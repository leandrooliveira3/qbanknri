import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

import { Question } from '@/types/question';
import { useToast } from '@/hooks/use-toast';

interface QuestionHistory {
  questionId: string;
  correctCount: number;
  incorrectCount: number;
  lastAttempt: Date | null;
  userDifficulty?: 'Fácil' | 'Médio' | 'Difícil';
}

export const useSmartReview = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Buscar histórico pessoal de uma questão específica
  const getQuestionHistory = useCallback(async (questionId: string): Promise<QuestionHistory | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('is_correct, created_at')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (!attempts || attempts.length === 0) return null;

      const correctCount = attempts.filter(a => a.is_correct).length;
      const incorrectCount = attempts.filter(a => !a.is_correct).length;
      const lastAttempt = attempts[0] ? new Date(attempts[0].created_at) : null;

      return {
        questionId,
        correctCount,
        incorrectCount,
        lastAttempt,
      };
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return null;
    }
  }, []);

  // Gerar questões para Smart Review
  const generateSmartReview = useCallback(async (allQuestions: Question[]): Promise<Question[]> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar todas as tentativas do usuário
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!attempts || attempts.length === 0) {
        toast({
          title: "Sem dados suficientes",
          description: "Responda algumas questões primeiro para gerar uma revisão inteligente.",
          variant: "destructive"
        });
        return [];
      }

      // Agrupar tentativas por questão
      const questionStats = new Map<string, {
        correctCount: number;
        incorrectCount: number;
        lastAttempt: Date;
      }>();

      attempts.forEach(attempt => {
        const existing = questionStats.get(attempt.question_id);
        if (existing) {
          if (attempt.is_correct) existing.correctCount++;
          else existing.incorrectCount++;
        } else {
          questionStats.set(attempt.question_id, {
            correctCount: attempt.is_correct ? 1 : 0,
            incorrectCount: attempt.is_correct ? 0 : 1,
            lastAttempt: new Date(attempt.created_at)
          });
        }
      });

      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Filtrar questões: erradas OU difíceis E não revisadas nos últimos 3 dias
      const smartQuestions: { question: Question; score: number }[] = [];

      allQuestions.forEach(question => {
        const stats = questionStats.get(question.id);
        
        // Questões nunca respondidas não entram na Smart Review
        if (!stats) return;

        // Pular questões revisadas recentemente (menos de 3 dias)
        if (stats.lastAttempt > threeDaysAgo) return;

        // Calcular score de prioridade
        let score = 0;
        
        // Questões com mais erros que acertos
        if (stats.incorrectCount > stats.correctCount) {
          score += 10 + (stats.incorrectCount - stats.correctCount) * 2;
        }

        // Questões marcadas como "Difícil"
        if (question.dificuldade === 'Difícil') {
          score += 5;
        }

        // Questões com taxa de erro > 50%
        const totalAttempts = stats.correctCount + stats.incorrectCount;
        const errorRate = totalAttempts > 0 ? stats.incorrectCount / totalAttempts : 0;
        if (errorRate > 0.5) {
          score += 5;
        }

        // Tempo desde última tentativa (mais antigo = maior prioridade)
        const daysSinceAttempt = Math.floor((now.getTime() - stats.lastAttempt.getTime()) / (1000 * 60 * 60 * 24));
        score += Math.min(daysSinceAttempt, 10); // Max 10 pontos por tempo

        if (score > 0) {
          smartQuestions.push({ question, score });
        }
      });

      // Ordenar por score e pegar as 20 melhores
      smartQuestions.sort((a, b) => b.score - a.score);
      const selectedQuestions = smartQuestions.slice(0, 20).map(sq => sq.question);

      if (selectedQuestions.length === 0) {
        toast({
          title: "Parabéns!",
          description: "Você não tem questões pendentes para revisão inteligente.",
        });
      }

      return selectedQuestions;
    } catch (error: any) {
      toast({
        title: "Erro ao gerar revisão",
        description: error.message,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Buscar contagem de questões disponíveis para Smart Review
  const getSmartReviewCount = useCallback(async (allQuestions: Question[]): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('question_id, is_correct, created_at')
        .eq('user_id', user.id);

      if (!attempts || attempts.length === 0) return 0;

      const questionStats = new Map<string, {
        correctCount: number;
        incorrectCount: number;
        lastAttempt: Date;
      }>();

      attempts.forEach(attempt => {
        const existing = questionStats.get(attempt.question_id);
        if (existing) {
          if (attempt.is_correct) existing.correctCount++;
          else existing.incorrectCount++;
        } else {
          questionStats.set(attempt.question_id, {
            correctCount: attempt.is_correct ? 1 : 0,
            incorrectCount: attempt.is_correct ? 0 : 1,
            lastAttempt: new Date(attempt.created_at)
          });
        }
      });

      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      let count = 0;

      allQuestions.forEach(question => {
        const stats = questionStats.get(question.id);
        if (!stats) return;
        if (stats.lastAttempt > threeDaysAgo) return;
        if (stats.incorrectCount > stats.correctCount || question.dificuldade === 'Difícil') {
          count++;
        }
      });

      return count;
    } catch {
      return 0;
    }
  }, []);

  return {
    loading,
    getQuestionHistory,
    generateSmartReview,
    getSmartReviewCount
  };
};
