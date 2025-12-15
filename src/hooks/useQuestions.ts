
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/question';
import { useToast } from '@/hooks/use-toast';

export type QuestionFilterType = 'all' | 'new' | 'most_errors' | 'favorites' | 'recent';
export type SortType = 'newest' | 'oldest' | 'difficulty' | 'category' | 'random';

export const useQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  // Cache otimizado - MODO ECONOMIA ATIVADO
  const CACHE_KEY = 'questions_cache_v7';
  const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos
  const CATEGORIES_CACHE_KEY = 'categories_with_counts_v1';
  const CATEGORIES_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas
  const FIRST_LOAD_SIZE = 5; // ✅ Primeira carga super leve!
  const PAGE_SIZE = 50; // Páginas seguintes
  const TIMEOUT_MS_FIRST = 4000; // 4s timeout para primeira carga

  type CachedQuestion = Omit<Question, 'createdAt'> & { createdAt: string };

  const mapRowToQuestion = (q: any): Question => ({
    id: q.id,
    categoria: q.categoria as any,
    subcategoria: q.subcategoria,
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    gabarito: q.gabarito as 'A' | 'B' | 'C' | 'D' | 'E',
    comentario: q.comentario,
    comentarioImagem: q.comentario_imagem || [], // Arrays de imagens do comentário
    dificuldade: q.dificuldade as 'Fácil' | 'Médio' | 'Difícil',
    tags: q.tags,
    fonte: q.fonte,
    imagem: q.imagem || [], // Array de imagens do enunciado
    referencias: q.referencias,
    createdAt: new Date(q.created_at ?? q.createdAt)
  });

  // Tipos de filtros para seleção de questões
  type QuestionFilter = 'new' | 'all' | 'most_errors' | 'favorites';
  
  // Carregar questões do Supabase com paginação e filtros
  const fetchQuestions = async (reset = true, filter: QuestionFilterType = 'all', sort: SortType = 'newest') => {
    if (reset) {
      setLoading(true);
      setCurrentPage(0);
      setHasMore(true);
    }

    // 1) Tenta mostrar cache rapidamente apenas na primeira carga
    if (reset && questions.length === 0 && filter === 'all') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { data: CachedQuestion[]; timestamp: number };
          const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
          if (isFresh) {
            const restored = parsed.data.map((q) => mapRowToQuestion(q));
            console.log(`Questões carregadas do cache: ${restored.length}`);
            setQuestions(restored);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignora erros de cache
      }
    }

    const doFetchPage = async (page: number): Promise<{ questions: Question[]; hasMore: boolean }> => {
      console.log(`Buscando página ${page} no Supabase...`);
      
      // Timeout otimizado: mais curto na primeira carga
      const timeout = page === 0 ? TIMEOUT_MS_FIRST : 8000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tempo limite excedido')), timeout)
      );

      let queryPromise: Promise<any>;

      if (page === 0) {
        // ✅ Primeira carga: apenas 5 questões mais recentes (super rápido!)
        console.log(`Carregando ${FIRST_LOAD_SIZE} questões mais recentes...`);
        
        queryPromise = new Promise(async (resolve, reject) => {
          try {
            // ✅ Primeira carga ordenada por data (mais recentes primeiro)
            const result = await supabase
              .from('questions')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(FIRST_LOAD_SIZE * 3);
            
            // Manter ordem original (mais recentes primeiro)
            if (result.data) {
              result.data = result.data.slice(0, FIRST_LOAD_SIZE);
            }
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      } else {
        // Páginas seguintes: buscar 50 por vez
        const from = page === 1 ? FIRST_LOAD_SIZE : (FIRST_LOAD_SIZE + (page - 1) * PAGE_SIZE);
        const to = from + PAGE_SIZE - 1;
        
        queryPromise = new Promise(async (resolve, reject) => {
          try {
            const result = await supabase
              .from('questions')
              .select('*')
              .order('created_at', { ascending: false })
              .range(from, to);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;
      
      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }
      if (!data) throw new Error('Sem dados retornados');

      console.log(`Página ${page}: ${data.length} questões carregadas`);
      
      const formattedQuestions = data.map(mapRowToQuestion);
      const expectedSize = page === 0 ? FIRST_LOAD_SIZE : PAGE_SIZE;
      const hasMoreData = data.length === expectedSize;
      
      return { questions: formattedQuestions, hasMore: hasMoreData };
    };

    // 2) Busca com retry otimizado para a página atual
    let attempt = 0;
    let backoff = 500; // ms - mais rápido para páginas menores
    let lastError: any = null;
    const targetPage = reset ? 0 : currentPage;

    while (attempt < 2) { // Menos tentativas para ser mais rápido
      try {
        const { questions: newQuestions, hasMore: hasMoreData } = await doFetchPage(targetPage);
        
        if (reset) {
          // Garante lista sem duplicatas e mais recente no topo
          const unique = new Map<string, Question>();
          newQuestions.forEach((q) => unique.set(q.id, q));
          setQuestions(Array.from(unique.values()));
          // Salva no cache apenas no reset (primeira carga)
          try {
            const toCache: CachedQuestion[] = newQuestions.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() }));
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: toCache, timestamp: Date.now() }));
            console.log(`Cache atualizado com ${toCache.length} questões`);
          } catch {
            // ignora erros de cache
          }
        } else {
          // Append sem duplicar
          setQuestions(prev => {
            const map = new Map(prev.map(q => [q.id, q] as const));
            newQuestions.forEach(q => map.set(q.id, q));
            return Array.from(map.values());
          });
        }
        
        setHasMore(hasMoreData);
        setCurrentPage(targetPage + 1);
        setLoading(false);
        console.log(`✅ Página ${targetPage} carregada com sucesso`);
        return;
      } catch (err: any) {
        lastError = err;
        attempt++;
        console.error(`Tentativa ${attempt} para página ${targetPage} falhou:`, err.message);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, backoff));
          backoff *= 1.5;
        }
      }
    }

    // 3) Se falhar após tentativas, usar cache silenciosamente (primeira carga) ou com aviso
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { data: CachedQuestion[]; timestamp: number };
        const restored = parsed.data.map((q) => mapRowToQuestion(q));
        setQuestions(restored);
        
        // ✅ Apenas mostrar toast se não for primeira carga (timeout silencioso na inicialização)
        if (targetPage > 0) {
          toast({
            title: 'Usando cache',
            description: 'Mostrando questões em cache.'
          });
        }
        setLoading(false);
        return;
      }
    } catch {
      // ignora erros de cache
    }

    // 4) Sem cache: notifica erro apenas se não for primeira carga
    if (targetPage > 0) {
      toast({
        title: 'Erro ao carregar questões',
        description: lastError?.message ?? 'Falha ao buscar dados.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  // Adicionar nova questão
  const addQuestion = async (questionData: Omit<Question, 'id' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // ✅ Normalizar gabarito antes de inserir
      let gabaritoNormalizado = (questionData.gabarito || 'A').toString().trim().toUpperCase().charAt(0);
      if (!['A', 'B', 'C', 'D', 'E'].includes(gabaritoNormalizado)) {
        gabaritoNormalizado = 'A';
      }

      // ✅ Normalizar dificuldade
      let dificuldadeNormalizada = questionData.dificuldade || 'Médio';
      const dificuldadeMap: Record<string, 'Fácil' | 'Médio' | 'Difícil'> = {
        'facil': 'Fácil', 'fácil': 'Fácil', 'Facil': 'Fácil', 'FACIL': 'Fácil',
        'medio': 'Médio', 'médio': 'Médio', 'Medio': 'Médio', 'MEDIO': 'Médio',
        'dificil': 'Difícil', 'difícil': 'Difícil', 'Dificil': 'Difícil', 'DIFICIL': 'Difícil'
      };
      dificuldadeNormalizada = dificuldadeMap[dificuldadeNormalizada] || dificuldadeNormalizada;
      if (!['Fácil', 'Médio', 'Difícil'].includes(dificuldadeNormalizada)) {
        dificuldadeNormalizada = 'Médio';
      }

      const insertPayload = {
        user_id: user.id,
        enunciado: questionData.enunciado.trim(),
        alternativas: questionData.alternativas,
        gabarito: gabaritoNormalizado,
        comentario: questionData.comentario.trim(),
        comentario_imagem: questionData.comentarioImagem || [],
        categoria: questionData.categoria as any,
        subcategoria: questionData.subcategoria?.trim() || null,
        dificuldade: dificuldadeNormalizada,
        tags: questionData.tags || [],
        fonte: questionData.fonte?.trim() || null,
        imagem: questionData.imagem || [],
        referencias: questionData.referencias || []
      } as any;

      const { data, error } = await supabase
        .from('questions')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;

      const newQuestion = mapRowToQuestion(data);

      // Atualiza estado imediatamente (evita refetch pesado)
      setQuestions(prev => [newQuestion, ...prev.filter(q => q.id !== newQuestion.id)]);

      // Atualiza cache de forma segura
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedObj = cached ? (JSON.parse(cached) as { data: CachedQuestion[]; timestamp: number }) : null;
        const newCached: CachedQuestion = { ...newQuestion, createdAt: newQuestion.createdAt.toISOString() } as any;
        const merged = [newCached, ...(cachedObj?.data || [])].slice(0, PAGE_SIZE);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: merged, timestamp: Date.now() }));
      } catch {}

      // Não faz refetch - economia de egress ✅

      toast({
        title: "Questão adicionada",
        description: "A questão foi salva com sucesso!"
      });
    } catch (error: any) {
      console.error('Erro ao adicionar questão:', error);
      toast({
        title: "Erro ao adicionar questão",
        description: error?.message || 'Falha ao salvar. Veja o console para detalhes.',
        variant: "destructive"
      });
    }
  };

  // Importar questões em lote - MODO ECONOMIA ATIVADO
  const importQuestions = async (questionsData: Omit<Question, 'id' | 'createdAt'>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Coletar candidatos e normalizar enunciados
      const candidateEnunciados = questionsData
        .map(q => (q.enunciado || '').trim())
        .filter(Boolean);

      // Verificar duplicatas no servidor (todas as questões do usuário)
      let existingSet = new Set<string>();
      try {
        const { data: existingRows } = await supabase
          .from('questions')
          .select('enunciado')
          .eq('user_id', user.id)
          .limit(10000);
        existingSet = new Set((existingRows || []).map(r => (r.enunciado || '').trim().toLowerCase()));
      } catch (e) {
        console.warn('Falha ao checar duplicatas no servidor, prosseguindo apenas com checagem local.', e);
        existingSet = new Set(questions.map(q => q.enunciado.trim().toLowerCase()));
      }

      // Filtrar apenas novas (server-side dedupe)
      const toInsertData = questionsData.filter(q => {
        const en = (q.enunciado || '').trim();
        return en && !existingSet.has(en.toLowerCase());
      });

      if (toInsertData.length === 0) {
        toast({
          title: "Nada para importar",
          description: "Todas as questões do arquivo já existem.",
        });
        return;
      }

      // ✅ Normalizar dados antes de inserir (fix para constraints do banco)
      const rows = toInsertData.map(q => {
        // Normalizar gabarito: trim, uppercase, apenas 1 caractere
        let gabaritoNormalizado = (q.gabarito || 'A').toString().trim().toUpperCase().charAt(0);
        if (!['A', 'B', 'C', 'D', 'E'].includes(gabaritoNormalizado)) {
          gabaritoNormalizado = 'A'; // fallback seguro
        }

        // Normalizar dificuldade: mapear variações comuns
        let dificuldadeNormalizada = q.dificuldade || 'Médio';
        const dificuldadeMap: Record<string, 'Fácil' | 'Médio' | 'Difícil'> = {
          'facil': 'Fácil',
          'fácil': 'Fácil',
          'Facil': 'Fácil',
          'FACIL': 'Fácil',
          'medio': 'Médio',
          'médio': 'Médio',
          'Medio': 'Médio',
          'MEDIO': 'Médio',
          'dificil': 'Difícil',
          'difícil': 'Difícil',
          'Dificil': 'Difícil',
          'DIFICIL': 'Difícil'
        };
        dificuldadeNormalizada = dificuldadeMap[dificuldadeNormalizada] || dificuldadeNormalizada;
        if (!['Fácil', 'Médio', 'Difícil'].includes(dificuldadeNormalizada)) {
          dificuldadeNormalizada = 'Médio'; // fallback seguro
        }

        return {
          user_id: user.id,
          enunciado: q.enunciado.trim(),
          alternativas: q.alternativas,
          gabarito: gabaritoNormalizado,
          comentario: q.comentario.trim(),
          comentario_imagem: q.comentarioImagem || [],
          categoria: q.categoria as any,
          subcategoria: q.subcategoria?.trim() || null,
          dificuldade: dificuldadeNormalizada,
          tags: q.tags || [],
          fonte: q.fonte?.trim() || null,
          imagem: q.imagem || [],
          referencias: q.referencias || []
        } as any;
      });

      const { data, error } = await supabase
        .from('questions')
        .insert(rows)
        .select('*');

      if (error) throw error;

      const inserted = (data || []).map(mapRowToQuestion);

      // ✅ MODO ECONOMIA: Atualizar estado imediatamente com questões importadas visíveis
      setQuestions(prev => {
        const existingMap = new Map(prev.map(q => [q.id, q]));
        // Adicionar novas questões importadas ao mapa (sem duplicar)
        inserted.forEach(q => existingMap.set(q.id, q));
        
        // Retornar todas as questões (até o limite razoável) para que sejam visíveis
        const allQuestions = Array.from(existingMap.values())
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Manter um limite razoável no estado (últimas 50)
        return allQuestions.slice(0, 50);
      });

      // ✅ Atualizar cache mantendo um número razoável de questões recentes
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedObj = cached ? JSON.parse(cached) : null;
        const existingCached = cachedObj?.data || [];
        
        // Mesclar questões importadas com cache existente
        const allForCache = [...inserted, ...existingCached.map(mapRowToQuestion)]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 30) // Manter 30 questões mais recentes no cache
          .map(q => ({ ...q, createdAt: q.createdAt.toISOString() } as any));
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: allForCache, timestamp: Date.now() }));
        console.log(`Cache atualizado com ${allForCache.length} questões (incluindo ${inserted.length} importadas)`);
      } catch {}

      // Atualizar cache de categorias
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedObj = cached ? JSON.parse(cached) : null;
        const prevQuestions = cachedObj?.data || [];
        const allCategories = new Set([
          ...inserted.map(q => q.categoria),
          ...prevQuestions.map((q: any) => q.categoria)
        ]);
        localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ 
          categories: Array.from(allCategories), 
          timestamp: Date.now() 
        }));
      } catch {}

      toast({
        title: "Questões importadas",
        description: `${inserted.length} novas questões foram importadas e estão visíveis!`
      });
    } catch (error: any) {
      console.error('Erro ao importar questões:', error);
      toast({
        title: "Erro ao importar questões",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Atualizar questão existente
  const updateQuestion = async (id: string, questionData: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          enunciado: questionData.enunciado,
          alternativas: questionData.alternativas,
          gabarito: questionData.gabarito,
          comentario: questionData.comentario,
          comentario_imagem: questionData.comentarioImagem || [], // Array de imagens do comentário
          categoria: questionData.categoria as any, // Type cast to allow dynamic categories
          subcategoria: questionData.subcategoria,
          dificuldade: questionData.dificuldade,
          tags: questionData.tags,
          fonte: questionData.fonte,
          imagem: questionData.imagem || [], // Array de imagens do enunciado
          referencias: questionData.referencias
        } as any) // Type cast to bypass TypeScript checking
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Questão atualizada",
        description: "A questão foi atualizada com sucesso!"
      });

      await fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar questão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Deletar questão
  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Questão removida",
        description: "A questão foi removida com sucesso!"
      });

      await fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao remover questão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Realtime + primeira carga
    let channel: any;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        channel = supabase
          .channel('questions-realtime')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'questions' }, (payload) => {
            const row: any = payload.new;
            if (user && row.user_id !== user.id) return;
            const q = mapRowToQuestion(row);
            setQuestions(prev => {
              const map = new Map(prev.map((i) => [i.id, i] as const));
              map.set(q.id, q);
              return Array.from(map.values());
            });
            try {
              const cached = localStorage.getItem(CACHE_KEY);
              const cachedObj = cached ? (JSON.parse(cached) as { data: CachedQuestion[]; timestamp: number }) : null;
              const newCached = [{ ...q, createdAt: q.createdAt.toISOString() } as any, ...(cachedObj?.data || [])].slice(0, PAGE_SIZE);
              localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newCached, timestamp: Date.now() }));
            } catch {}
          })
          .subscribe();
      } catch {}

      fetchQuestions(true, 'all', 'newest');
    };

    init();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Função para carregar mais questões
  const loadMore = async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    await fetchQuestions(false);
  };

  // Carregar questões adicionais de uma categoria específica (para PracticeConfig)
  // ✅ OTIMIZADO: Buscar apenas quantidade necessária, não todas
  const loadQuestionsByCategory = async (categoria: string, quantidadeDesejada: number): Promise<Question[]> => {
    try {
      // Verificar quantas questões dessa categoria já temos
      const questoesExistentes = questions.filter(q => q.categoria === categoria);
      
      if (questoesExistentes.length >= quantidadeDesejada) {
        // Já temos questões suficientes, retorna as existentes embaralhadas
        return questoesExistentes.sort(() => Math.random() - 0.5).slice(0, quantidadeDesejada);
      }

      console.log(`Buscando questões de ${categoria}. Temos ${questoesExistentes.length}, precisamos de ${quantidadeDesejada}`);

      // ✅ Buscar apenas o necessário + margem, não todas
      const limite = Math.max(quantidadeDesejada, 20);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('categoria', categoria as any)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;

      if (!data || data.length === 0) {
        return questoesExistentes;
      }

      const novasQuestoes = data.map(mapRowToQuestion);

      // Atualizar o estado com as novas questões (evitando duplicatas)
      setQuestions(prev => {
        const existingIds = new Set(prev.map(q => q.id));
        const toAdd = novasQuestoes.filter(q => !existingIds.has(q.id));
        
        if (toAdd.length > 0) {
          console.log(`Adicionadas ${toAdd.length} novas questões de ${categoria}`);
        }
        
        return [...prev, ...toAdd];
      });

      // Retornar as questões solicitadas (embaralhadas)
      return novasQuestoes.slice(0, quantidadeDesejada).sort(() => Math.random() - 0.5);

    } catch (error: any) {
      console.error('Erro ao carregar questões por categoria:', error);
      
      // Em caso de erro, retorna as questões existentes dessa categoria
      return questions.filter(q => q.categoria === categoria).slice(0, quantidadeDesejada);
    }
  };

  // ✅ NOVA FUNÇÃO: Buscar categorias com contagens (rápido, barato em egress)
  const getAllCategoriesWithCounts = async (): Promise<{categoria: string; count: number}[]> => {
    try {
      // Tentar cache primeiro
      const cached = localStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CATEGORIES_CACHE_TTL) {
          console.log('Categorias com contagens carregadas do cache:', parsed.categories.length);
          return parsed.categories;
        }
      }

      // ✅ Chamar RPC function (super rápido e barato!)
      const { data, error } = await supabase.rpc('list_categories_with_counts');

      if (error) {
        console.error('Erro ao buscar categorias via RPC:', error);
        throw error;
      }

      const categoriesWithCounts = data || [];
      
      // Salvar no cache
      localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ 
        categories: categoriesWithCounts, 
        timestamp: Date.now() 
      }));

      console.log('Categorias com contagens carregadas do servidor:', categoriesWithCounts.length);
      return categoriesWithCounts;
    } catch (error) {
      console.error('Erro ao buscar categorias com contagens:', error);
      // Fallback: retornar categorias do array local (sem contagens precisas)
      const localCategories = [...new Set(questions.map(q => q.categoria))];
      return localCategories.map(cat => ({
        categoria: cat,
        count: questions.filter(q => q.categoria === cat).length
      }));
    }
  };

  // Buscar todas as categorias disponíveis (para compatibilidade)
  const getAllCategories = async (): Promise<string[]> => {
    const withCounts = await getAllCategoriesWithCounts();
    return withCounts.map(c => c.categoria);
  };

  return {
    questions,
    loading,
    hasMore,
    loadMore,
    loadQuestionsByCategory,
    getAllCategories,
    getAllCategoriesWithCounts, // ✅ Nova função para egress otimizado
    addQuestion,
    importQuestions,
    updateQuestion,
    deleteQuestion,
    refetch: () => fetchQuestions(true)
  };
};
