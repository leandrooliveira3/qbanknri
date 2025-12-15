import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NeuroCategory } from '@/types/question';

export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Categorias padrão do sistema
  const DEFAULT_CATEGORIES: NeuroCategory[] = [
    'Anatomia e Fisiologia do Sistema Nervoso',
    'Semiologia Neurológica',
    'Doenças Cerebrovasculares',
    'Epilepsia e Distúrbios Paroxísticos',
    'Demências e Distúrbios Cognitivos',
    'Distúrbios do Movimento',
    'Doenças Desmielinizantes',
    'Neuropatias Periféricas',
    'Miopatias e Distúrbios da Junção Neuromuscular',
    'Distúrbios do Sono',
    'Cefaleia e Dor Facial',
    'Neuro-oncologia',
    'Neurologia de Urgência',
    'Neurologia Pediátrica',
    'Neurogenética',
    'Neurologia Comportamental',
    'Reabilitação Neurológica',
    'Neurorradiologia'
  ];

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Buscar categorias das questões públicas e do usuário atual
      const { data: questionCategories, error: questionsError } = await supabase
        .from('questions')
        .select('categoria')
        .order('categoria');

      if (questionsError && questionsError.code !== 'PGRST116') {
        throw questionsError;
      }

      // Buscar categorias personalizadas do usuário (apenas se autenticado)
      let userCategories: string[] = [];
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userCats, error: userCatsError } = await supabase
          .from('categories')
          .select('name')
          .eq('user_id', user.id)
          .order('name');

        if (!userCatsError) {
          userCategories = userCats?.map(c => c.name) || [];
        }
      }

      // Extrair categorias únicas das questões
      const dbCategories = [...new Set(questionCategories?.map(q => q.categoria) || [])];
      
      // Combinar todas as categorias
      const allCategories = new Set([...DEFAULT_CATEGORIES, ...dbCategories, ...userCategories]);
      
      // Converter para array e ordenar
      const sortedCategories = Array.from(allCategories).sort();
      
      setCategories(sortedCategories);
      console.log(`Categorias carregadas: ${sortedCategories.length}`, sortedCategories);
      
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Em caso de erro, usar apenas categorias padrão
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova categoria personalizada
  const addCustomCategory = async (newCategory: string) => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      try {
        // Salvar no banco apenas se o usuário estiver autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('categories')
            .insert({ user_id: user.id, name: trimmedCategory });
        }
        
        const updatedCategories = [...categories, trimmedCategory].sort();
        setCategories(updatedCategories);
        console.log(`Nova categoria adicionada: ${trimmedCategory}`);
        return true;
      } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        // Adicionar localmente mesmo se falhar no banco
        const updatedCategories = [...categories, trimmedCategory].sort();
        setCategories(updatedCategories);
        return true;
      }
    }
    return false;
  };

  // Verificar se categoria existe
  const categoryExists = (category: string) => {
    return categories.includes(category.trim());
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    addCustomCategory,
    categoryExists,
    refetch: fetchCategories
  };
};