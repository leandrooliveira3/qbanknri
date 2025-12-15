import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/types/question';

export const useDailyReview = () => {
  const [dailyReview, setDailyReview] = useState<{
    id: string;
    question_ids: string[];
    review_date: string;
  } | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Buscar revisão do dia
  const getDailyReview = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_reviews' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('review_date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDailyReview(data as any);
        setHasReview(true);
      } else {
        setHasReview(false);
      }
    } catch (error: any) {
      console.error('Erro ao buscar revisão diária:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gerar nova revisão chamando edge function
  const generateDailyReview = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-review');

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Revisão gerada!",
          description: `${data.question_count} questões selecionadas para revisão.`
        });
        await getDailyReview(); // Atualizar estado
        return true;
      } else {
        toast({
          title: "Sem revisão necessária",
          description: data?.message || "Você não tem questões com alta taxa de erro.",
          variant: "default"
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar revisão",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Buscar questões da revisão
  const getReviewQuestions = async (): Promise<Question[]> => {
    if (!dailyReview) return [];

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', dailyReview.question_ids);

      if (error) throw error;

      // Mapear para tipo Question
      return (data || []).map((q: any) => ({
        id: q.id,
        categoria: q.categoria,
        subcategoria: q.subcategoria,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        gabarito: q.gabarito as 'A' | 'B' | 'C' | 'D' | 'E',
        comentario: q.comentario,
        comentarioImagem: q.comentario_imagem || [],
        dificuldade: q.dificuldade as 'Fácil' | 'Médio' | 'Difícil',
        tags: q.tags,
        fonte: q.fonte,
        imagem: q.imagem || [],
        referencias: q.referencias,
        createdAt: new Date(q.created_at)
      }));
    } catch (error) {
      console.error('Erro ao buscar questões da revisão:', error);
      return [];
    }
  };

  useEffect(() => {
    getDailyReview();
  }, []);

  return {
    dailyReview,
    hasReview,
    loading,
    generateDailyReview,
    getReviewQuestions,
    refetch: getDailyReview
  };
};
