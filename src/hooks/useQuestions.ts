import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/types/question";

/* ================= NORMALIZE ================= */

const normalizeQuestionForDB = (q: any) => ({
  categoria: q.categoria,
  subcategoria: q.subcategoria ?? null,
  enunciado: q.enunciado,
  alternativas: Array.isArray(q.alternativas) ? q.alternativas : [],
  gabarito: q.gabarito,
  comentario: q.comentario,
  dificuldade: q.dificuldade,
  tags: Array.isArray(q.tags) ? q.tags : [],
  fonte: q.fonte ?? null,
  imagem: Array.isArray(q.imagem) ? q.imagem : [],
  comentario_imagem: Array.isArray(q.comentarioImagem)
    ? q.comentarioImagem
    : [],
});

/* ================= FETCH ================= */

const fetchQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

/* ================= HOOK ================= */

export function useQuestions() {
  const queryClient = useQueryClient();

  /* ========== QUESTIONS ========== */

  const {
    data: questions = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  /* ========== PAGINATION (placeholder estável) ========== */
  // Mantido para compatibilidade com o Index
  const hasMore = false;
  const loadMore = async () => {};

  /* ========== CATEGORIES ========== */

  const getAllCategories = async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from("questions")
      .select("categoria");

    if (error) throw error;

    return Array.from(new Set(data.map((q) => q.categoria))).sort();
  };

  const getAllCategoriesWithCounts = async (): Promise<
    { categoria: string; count: number }[]
  > => {
    const { data, error } = await supabase
      .from("questions")
      .select("categoria");

    if (error) throw error;

    const map: Record<string, number> = {};

    data.forEach((q) => {
      map[q.categoria] = (map[q.categoria] || 0) + 1;
    });

    return Object.entries(map).map(([categoria, count]) => ({
      categoria,
      count,
    }));
  };

  /* ========== FILTER BY CATEGORY ========== */

  const loadQuestionsByCategory = async (
    categoria: string,
    limit?: number
  ): Promise<Question[]> => {
    let query = supabase
      .from("questions")
      .select("*")
      .eq("categoria", categoria);

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  };

  /* ========== ADD QUESTION ========== */

  const addQuestion = useMutation({
    mutationFn: async (question: any) => {
      const payload = normalizeQuestionForDB(question);

      const { data, error } = await supabase
        .from("questions")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ========== IMPORT QUESTIONS ========== */

  const importQuestions = useMutation({
    mutationFn: async (questions: any[]) => {
      const payload = questions.map(normalizeQuestionForDB);

      const { error } = await supabase.from("questions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ========== UPDATE ========== */

  const updateQuestion = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Question>;
    }) => {
      const { error } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  /* ========== DELETE ========== */

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  /* ========== RETURN (CONTRATO FECHADO) ========== */

  return {
    questions,
    loading: isLoading,
    isFetching,
    error,
    refetch,

    hasMore,
    loadMore,

    loadQuestionsByCategory,
    getAllCategories,
    getAllCategoriesWithCounts,

    addQuestion: addQuestion.mutateAsync,
    importQuestions: importQuestions.mutateAsync,
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
  };
}
