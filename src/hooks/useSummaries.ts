import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Summary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useSummaries = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSummaries = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      toast({
        title: 'Erro ao carregar resumos',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setSummaries(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const addSummary = async (data: { title: string; content: string; category?: string; tags?: string[] }) => {
    if (!user) return { error: new Error('Usuário não autenticado') };
    
    const { data: newSummary, error } = await supabase
      .from('summaries')
      .insert({
        ...data,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) {
      toast({
        title: 'Erro ao criar resumo',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
    
    setSummaries(prev => [newSummary, ...prev]);
    toast({ title: 'Resumo criado com sucesso!' });
    return { data: newSummary, error: null };
  };

  const updateSummary = async (id: string, data: Partial<Summary>) => {
    const { error } = await supabase
      .from('summaries')
      .update(data)
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao atualizar resumo',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
    
    setSummaries(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    toast({ title: 'Resumo atualizado!' });
    return { error: null };
  };

  const deleteSummary = async (id: string) => {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir resumo',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
    
    setSummaries(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Resumo excluído!' });
    return { error: null };
  };

  return {
    summaries,
    loading,
    addSummary,
    updateSummary,
    deleteSummary,
    refetch: fetchSummaries
  };
};
