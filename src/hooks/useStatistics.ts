import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuestionAttempt, PracticeSession, SimuladoSession, GeneralStats, CategoryStats } from '@/types/statistics';

export const useStatistics = () => {
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(null);
        setLoading(false);
        return;
      }

      // Cache de 1 hora (otimização egress)
      const cacheKey = `stats_cache_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          setStats(cachedData);
          setLoading(false);
          return;
        }
      }

      // Buscar TODAS as tentativas para estatísticas corretas
      const { data: attempts, error: attemptsError } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Buscar as questões para obter as categorias
      const questionIds = attempts?.map(a => a.question_id) || [];
      const { data: questions, error: questionsError } = questionIds.length > 0 
        ? await supabase
            .from('questions')
            .select('id, categoria')
            .in('id', questionIds)
        : { data: [], error: null };

      if (questionsError) throw questionsError;

      // Buscar TODAS as questões disponíveis para calcular questions_remaining
      const { data: allQuestions, error: allQuestionsError } = await supabase
        .from('questions')
        .select('id, categoria')
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      if (allQuestionsError) throw allQuestionsError;

      // Buscar sessões de prática
      const { data: practiceSessions, error: practiceError } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (practiceError) throw practiceError;

      // Buscar sessões de simulado
      const { data: simuladoSessions, error: simuladoError } = await supabase
        .from('simulado_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (simuladoError) throw simuladoError;

      // Calcular estatísticas gerais
      const totalAttempts = attempts?.length || 0;
      const totalCorrect = attempts?.filter(a => a.is_correct).length || 0;
      const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

      // Calcular estatísticas detalhadas por questão
      const questionAttemptCounts = (attempts || []).reduce((acc, attempt) => {
        const questionId = attempt.question_id;
        const question = questions?.find(q => q.id === attempt.question_id);
        const categoria = question?.categoria || 'Sem categoria';
        
        if (!acc[questionId]) {
          acc[questionId] = {
            attempts: 0,
            correct: 0,
            incorrect: 0,
            categoria
          };
        }
        acc[questionId].attempts++;
        if (attempt.is_correct) {
          acc[questionId].correct++;
        } else {
          acc[questionId].incorrect++;
        }
        return acc;
      }, {} as Record<string, { attempts: number; correct: number; incorrect: number; categoria: string }>);

      const uniqueQuestionsAnswered = Object.keys(questionAttemptCounts).length;
      const questionsAnsweredOnce = Object.values(questionAttemptCounts).filter(q => q.attempts === 1).length;
      const questionsAnsweredMultiple = Object.values(questionAttemptCounts).filter(q => q.attempts > 1).length;

      // Calcular estatísticas por categoria
      const categoryMap = new Map<string, { 
        total: number; 
        correct: number; 
        times: number[]; 
        unique_questions: Set<string>;
        questions_answered_once: number;
        questions_answered_multiple: number;
      }>();
      
      attempts?.forEach(attempt => {
        const question = questions?.find(q => q.id === attempt.question_id);
        const categoria = question?.categoria || 'Sem categoria';
        
        if (!categoryMap.has(categoria)) {
          categoryMap.set(categoria, { 
            total: 0, 
            correct: 0, 
            times: [], 
            unique_questions: new Set(),
            questions_answered_once: 0,
            questions_answered_multiple: 0
          });
        }
        
        const current = categoryMap.get(categoria)!;
        current.total += 1;
        if (attempt.is_correct) current.correct += 1;
        if (attempt.attempt_time) current.times.push(attempt.attempt_time);
        current.unique_questions.add(attempt.question_id);
      });

      // Calcular questões repetidas por categoria
      Object.entries(questionAttemptCounts).forEach(([questionId, questionData]) => {
        const categoryData = categoryMap.get(questionData.categoria);
        if (categoryData) {
          if (questionData.attempts === 1) {
            categoryData.questions_answered_once++;
          } else if (questionData.attempts > 1) {
            categoryData.questions_answered_multiple++;
          }
        }
      });

      // Calcular total de questões por categoria
      const totalQuestionsByCategory = (allQuestions || []).reduce((acc, q) => {
        if (!acc[q.categoria]) acc[q.categoria] = 0;
        acc[q.categoria]++;
        return acc;
      }, {} as Record<string, number>);

      const categoryStats: CategoryStats[] = Array.from(categoryMap.entries()).map(([categoria, data]) => {
        const repetitionRate = data.unique_questions.size > 0 
          ? ((data.total - data.unique_questions.size) / data.unique_questions.size) * 100 
          : 0;
        
        const totalQuestionsInCategory = totalQuestionsByCategory[categoria] || 0;
        const questionsRemaining = Math.max(0, totalQuestionsInCategory - data.unique_questions.size);
        
        return {
          categoria,
          total_attempts: data.total,
          unique_questions: data.unique_questions.size,
          correct_attempts: data.correct,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          avg_time: data.times.length > 0 ? data.times.reduce((a, b) => a + b, 0) / data.times.length : undefined,
          questions_answered_once: data.questions_answered_once,
          questions_answered_multiple: data.questions_answered_multiple,
          questions_remaining: questionsRemaining,
          repetition_rate: repetitionRate
        };
      });

      // Adicionar categorias que não foram respondidas ainda
      Object.entries(totalQuestionsByCategory).forEach(([categoria, total]) => {
        if (!categoryStats.find(c => c.categoria === categoria)) {
          categoryStats.push({
            categoria,
            total_attempts: 0,
            unique_questions: 0,
            correct_attempts: 0,
            accuracy: 0,
            avg_time: undefined,
            questions_answered_once: 0,
            questions_answered_multiple: 0,
            questions_remaining: total,
            repetition_rate: 0
          });
        }
      });

      // Calcular tempo médio por questão
      const allTimes = attempts?.filter(a => a.attempt_time).map(a => a.attempt_time!) || [];
      const avgTimePerQuestion = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : undefined;

      // Combinar sessões recentes
      const recentSessions = [
        ...(practiceSessions?.map(s => ({ ...s, type: 'practice' })) || []),
        ...(simuladoSessions?.map(s => ({ ...s, type: 'simulado' })) || [])
      ].sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()).slice(0, 10);

      // Calcular taxa de repetição geral
      const repetitionRate = uniqueQuestionsAnswered > 0 
        ? ((totalAttempts - uniqueQuestionsAnswered) / uniqueQuestionsAnswered) * 100 
        : 0;

      const generalStats: GeneralStats = {
        total_attempts: totalAttempts,
        unique_questions_answered: uniqueQuestionsAnswered,
        total_correct: totalCorrect,
        overall_accuracy: overallAccuracy,
        questions_answered_once: questionsAnsweredOnce,
        questions_answered_multiple: questionsAnsweredMultiple,
        repetition_rate: repetitionRate,
        total_practice_sessions: practiceSessions?.length || 0,
        total_simulados: simuladoSessions?.length || 0,
        avg_time_per_question: avgTimePerQuestion,
        category_stats: categoryStats,
        recent_sessions: recentSessions as any
      };

      setStats(generalStats);

      // Salvar no cache
      try {
        const cacheKey = `stats_cache_${user.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({ 
          data: generalStats, 
          timestamp: Date.now() 
        }));
      } catch {}
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recordAttempt = async (
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    attemptTime?: number,
    sessionId?: string,
    sessionType?: 'practice' | 'simulado'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const attemptData: any = {
        user_id: user.id,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        attempt_time: attemptTime
      };

      if (sessionId && sessionType === 'practice') {
        attemptData.practice_session_id = sessionId;
      } else if (sessionId && sessionType === 'simulado') {
        attemptData.simulado_session_id = sessionId;
      }

      const { error } = await supabase
        .from('question_attempts')
        .insert(attemptData);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao salvar tentativa:', error);
    }
  };

  const createPracticeSession = async (
    sessionName: string,
    totalQuestions: number,
    correctAnswers: number,
    totalTime?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: user.id,
          session_name: sessionName,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_time: totalTime
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    } catch (error: any) {
      console.error('Erro ao criar sessão de prática:', error);
      return null;
    }
  };

  const createSimuladoSession = async (
    configName: string,
    categorias: string[],
    totalQuestions: number,
    correctAnswers: number,
    totalTime?: number,
    timeLimit?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('simulado_sessions')
        .insert({
          user_id: user.id,
          config_name: configName,
          categorias: categorias,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_time: totalTime,
          time_limit: timeLimit
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    } catch (error: any) {
      console.error('Erro ao criar sessão de simulado:', error);
      return null;
    }
  };

  // Buscar IDs de questões que o usuário já respondeu
  const getAnsweredQuestionIds = async (): Promise<Set<string>> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set();

      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('question_id')
        .eq('user_id', user.id);

      return new Set(attempts?.map(a => a.question_id) || []);
    } catch (error) {
      console.error('Erro ao buscar questões respondidas:', error);
      return new Set();
    }
  };

  // Buscar questões que o usuário mais errou (questões específicas, não categorias)
  const getMostMissedQuestionIds = async (): Promise<string[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct')
        .eq('user_id', user.id);

      if (!attempts || attempts.length === 0) return [];

      // Agrupar por question_id e contar erros
      const questionErrors = attempts.reduce((acc, attempt) => {
        if (!acc[attempt.question_id]) {
          acc[attempt.question_id] = { correct: 0, incorrect: 0 };
        }
        if (attempt.is_correct) {
          acc[attempt.question_id].correct++;
        } else {
          acc[attempt.question_id].incorrect++;
        }
        return acc;
      }, {} as Record<string, { correct: number; incorrect: number }>);

      // Filtrar questões com mais erros que acertos e ordenar
      const mostMissed = Object.entries(questionErrors)
        .filter(([_, counts]) => counts.incorrect > counts.correct)
        .sort((a, b) => b[1].incorrect - a[1].incorrect)
        .map(([questionId]) => questionId);

      return mostMissed;
    } catch (error) {
      console.error('Erro ao buscar questões com mais erros:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    stats,
    loading,
    recordAttempt,
    createPracticeSession,
    createSimuladoSession,
    refetch: fetchStatistics,
    getAnsweredQuestionIds,
    getMostMissedQuestionIds
  };
};