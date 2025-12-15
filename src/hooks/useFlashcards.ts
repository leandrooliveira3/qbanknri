import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Flashcard {
  id: string;
  user_id: string;
  front: string;
  back: string;
  category: string | null;
  difficulty: string;
  next_review_at: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}

type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';

export const useFlashcards = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFlashcards = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .order('next_review_at', { ascending: true });
    
    if (error) {
      toast({
        title: 'Erro ao carregar flashcards',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setFlashcards(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const getDueFlashcards = useCallback(() => {
    const now = new Date();
    return flashcards.filter(fc => new Date(fc.next_review_at) <= now);
  }, [flashcards]);

  const addFlashcard = async (data: { front: string; back: string; category?: string }) => {
    if (!user) return { error: new Error('Usuário não autenticado') };
    
    const { data: newFlashcard, error } = await supabase
      .from('flashcards')
      .insert({
        ...data,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) {
      toast({
        title: 'Erro ao criar flashcard',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
    
    setFlashcards(prev => [...prev, newFlashcard]);
    toast({ title: 'Flashcard criado!' });
    return { data: newFlashcard, error: null };
  };

  const updateFlashcard = async (id: string, data: Partial<Flashcard>) => {
    const { error } = await supabase
      .from('flashcards')
      .update(data)
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao atualizar flashcard',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
    
    setFlashcards(prev => prev.map(fc => fc.id === id ? { ...fc, ...data } : fc));
    return { error: null };
  };

  const deleteFlashcard = async (id: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir flashcard',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
    
    setFlashcards(prev => prev.filter(fc => fc.id !== id));
    toast({ title: 'Flashcard excluído!' });
    return { error: null };
  };

  // Spaced repetition algorithm (SM-2 simplified)
  const reviewFlashcard = async (id: string, quality: ReviewQuality) => {
    const flashcard = flashcards.find(fc => fc.id === id);
    if (!flashcard) return;

    let { ease_factor, interval_days, repetitions } = flashcard;
    
    const qualityMap: Record<ReviewQuality, number> = {
      'again': 0,
      'hard': 2,
      'good': 3,
      'easy': 5
    };
    const q = qualityMap[quality];

    if (q < 3) {
      // Failed - reset
      repetitions = 0;
      interval_days = 1;
    } else {
      // Successful review
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions += 1;
    }

    // Update ease factor
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    const next_review_at = new Date();
    next_review_at.setDate(next_review_at.getDate() + interval_days);

    await updateFlashcard(id, {
      ease_factor,
      interval_days,
      repetitions,
      next_review_at: next_review_at.toISOString()
    });
  };

  return {
    flashcards,
    loading,
    getDueFlashcards,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    reviewFlashcard,
    refetch: fetchFlashcards
  };
};
