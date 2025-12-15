import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verificar autenticação
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error('Usuário não autenticado');
      throw new Error('Não autenticado');
    }

    console.log(`Gerando revisão para usuário: ${user.id}`);
    const today = new Date().toISOString().split('T')[0];

    // Verificar se já existe revisão para hoje
    const { data: existing } = await supabaseClient
      .from('daily_reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('review_date', today)
      .maybeSingle();

    if (existing) {
      console.log('Revisão já existe para hoje');
      return new Response(
        JSON.stringify({ 
          message: 'Revisão já existe para hoje',
          review_id: existing.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar tentativas dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attempts } = await supabaseClient
      .from('question_attempts')
      .select('question_id, is_correct, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!attempts || attempts.length === 0) {
      console.log('Sem tentativas suficientes para gerar revisão');
      return new Response(
        JSON.stringify({ message: 'Sem tentativas suficientes para gerar revisão' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verificar revisões dos últimos 3 dias (para não repetir questões)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const { data: recentReviews } = await supabaseClient
      .from('daily_reviews')
      .select('question_ids')
      .eq('user_id', user.id)
      .gte('review_date', threeDaysAgo.toISOString().split('T')[0]);

    const recentlyReviewedIds = new Set(
      (recentReviews || []).flatMap(r => r.question_ids)
    );

    // ALGORITMO DE SELEÇÃO:
    // 1. Agrupar tentativas por questão
    const questionStats: Record<string, {
      correct: number;
      incorrect: number;
      lastAttempt: Date;
      errorRate: number;
    }> = {};

    attempts.forEach(attempt => {
      if (!questionStats[attempt.question_id]) {
        questionStats[attempt.question_id] = {
          correct: 0,
          incorrect: 0,
          lastAttempt: new Date(attempt.created_at),
          errorRate: 0
        };
      }
      
      const stats = questionStats[attempt.question_id];
      if (attempt.is_correct) {
        stats.correct++;
      } else {
        stats.incorrect++;
      }
      
      const attemptDate = new Date(attempt.created_at);
      if (attemptDate > stats.lastAttempt) {
        stats.lastAttempt = attemptDate;
      }
    });

    // 2. Calcular taxa de erro e pontuar questões
    const scoredQuestions = Object.entries(questionStats)
      .filter(([qid, _]) => !recentlyReviewedIds.has(qid)) // Excluir revisões recentes
      .map(([questionId, stats]) => {
        const total = stats.correct + stats.incorrect;
        const errorRate = (stats.incorrect / total) * 100;
        
        // Pontuação baseada em:
        // - Taxa de erro (peso 60%)
        // - Recência (peso 40%) - questões mais recentes têm prioridade
        const daysSinceLastAttempt = (Date.now() - stats.lastAttempt.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 100 - (daysSinceLastAttempt * 10)); // Decai 10 pontos por dia
        
        const finalScore = (errorRate * 0.6) + (recencyScore * 0.4);
        
        return {
          questionId,
          errorRate,
          recencyScore,
          finalScore,
          attempts: total
        };
      })
      .filter(q => q.errorRate > 20) // Apenas questões com >20% de erro
      .sort((a, b) => b.finalScore - a.finalScore) // Ordenar por pontuação
      .slice(0, 20); // Top 20

    if (scoredQuestions.length === 0) {
      console.log('Parabéns! Você não tem questões com alta taxa de erro.');
      return new Response(
        JSON.stringify({ 
          message: 'Parabéns! Você não tem questões com alta taxa de erro.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const questionIds = scoredQuestions.map(q => q.questionId);

    // 3. Salvar revisão no banco
    const { data: review, error: insertError } = await supabaseClient
      .from('daily_reviews')
      .insert({
        user_id: user.id,
        review_date: today,
        question_ids: questionIds
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir revisão:', insertError);
      throw insertError;
    }

    console.log(`Revisão gerada com ${questionIds.length} questões para usuário ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        review_id: review.id,
        question_count: questionIds.length,
        questions: scoredQuestions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao gerar revisão:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});