import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useFavorites = () => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Carregar favoritos do Supabase persistente
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Carregar favoritos do Supabase
        const { data: dbFavorites, error } = await supabase
          .from('question_favorites')
          .select('question_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao carregar favoritos do Supabase:', error);
          // Fallback para localStorage
          const savedFavorites = localStorage.getItem(`questionFavorites_${user.id}`);
          if (savedFavorites) {
            const favoriteIds = JSON.parse(savedFavorites);
            setFavorites(new Set(favoriteIds));
          }
        } else {
          const favoriteIds = dbFavorites.map(f => f.question_id);
          setFavorites(new Set(favoriteIds));
          
          // Migrar localStorage existente para Supabase se necessário
          const savedFavorites = localStorage.getItem(`questionFavorites_${user.id}`);
          if (savedFavorites) {
            const localFavorites = JSON.parse(savedFavorites);
            const newFavorites = localFavorites.filter((id: string) => !favoriteIds.includes(id));
            
            if (newFavorites.length > 0) {
              console.log('Migrando favoritos do localStorage para Supabase...');
              const insertPromises = newFavorites.map(async (questionId: string) => {
                try {
                  await supabase
                    .from('question_favorites')
                    .insert({ user_id: user.id, question_id: questionId });
                } catch (error) {
                  // Ignora erros de duplicação
                  console.log(`Favorito ${questionId} já existe no banco`);
                }
              });
              
              await Promise.all(insertPromises);
              
              // Recarregar após migração
              const updatedFavorites = new Set([...favoriteIds, ...newFavorites]);
              setFavorites(updatedFavorites);
            }
            
            // Limpar localStorage após migração
            localStorage.removeItem(`questionFavorites_${user.id}`);
          }
        }
      } else {
        // Usuário não logado, usar localStorage global
        const savedFavorites = localStorage.getItem('questionFavorites');
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites);
          setFavorites(new Set(favoriteIds));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (questionId: string) => {
    const newFavorites = new Set(favorites);
    const isRemoving = newFavorites.has(questionId);
    
    if (isRemoving) {
      newFavorites.delete(questionId);
    } else {
      newFavorites.add(questionId);
    }
    
    // Atualizar estado imediatamente para responsividade
    setFavorites(newFavorites);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (isRemoving) {
          // Remover do Supabase
          const { error } = await supabase
            .from('question_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('question_id', questionId);
            
          if (error) throw error;
          
          toast({
            title: "Removido dos favoritos",
            description: "Questão removida da sua lista de favoritos"
          });
        } else {
          // Adicionar ao Supabase
          const { error } = await supabase
            .from('question_favorites')
            .insert({ user_id: user.id, question_id: questionId });
            
          if (error) throw error;
          
          toast({
            title: "Adicionado aos favoritos",
            description: "Questão salva na sua lista de favoritos"
          });
        }
      } else {
        // Fallback para localStorage se não logado
        const favoritesArray = Array.from(newFavorites);
        localStorage.setItem('questionFavorites', JSON.stringify(favoritesArray));
        
        toast({
          title: isRemoving ? "Removido dos favoritos" : "Adicionado aos favoritos",
          description: isRemoving ? "Questão removida da sua lista de favoritos" : "Questão salva na sua lista de favoritos"
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar favorito:', error);
      
      // Reverter estado em caso de erro
      const revertedFavorites = new Set(favorites);
      setFavorites(revertedFavorites);
      
      toast({
        title: "Erro ao atualizar favorito",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const isFavorite = (questionId: string) => favorites.has(questionId);

  const getFavoriteCount = () => favorites.size;

  const clearAllFavorites = async () => {
    setFavorites(new Set());
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Limpar do Supabase
        const { error } = await supabase
          .from('question_favorites')
          .delete()
          .eq('user_id', user.id);
          
        if (error) throw error;
      } else {
        // Limpar localStorage
        localStorage.removeItem('questionFavorites');
      }
      
      toast({
        title: "Favoritos limpos",
        description: "Todos os favoritos foram removidos"
      });
    } catch (error: any) {
      console.error('Erro ao limpar favoritos:', error);
      toast({
        title: "Erro ao limpar favoritos",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  };

  // Memoizar favoriteIds para evitar loops infinitos de re-render
  const favoriteIds = useMemo(() => Array.from(favorites), [favorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    getFavoriteCount,
    clearAllFavorites,
    favoriteIds,
    refetch: loadFavorites
  };
};