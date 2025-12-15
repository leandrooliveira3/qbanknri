import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/types/question";

/* ================= FETCH ================= */

const fetchQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar questões:", error);
    throw error;
  }

  return data ?? [];
};

/* ================= HOOK ================= */

export function useQuestions() {
  const queryClient = useQueryClient();

  const {
    data: questions = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
    staleTime: Infinity,
  });

  /* ================= MUTATIONS ================= */

  const addQuestion = async (
    question: Omit<Question, "id" | "createdAt">
  ) => {
    const { error } = await supabase.from("questions").insert(question);
    if (error) throw error;
    await refetch();
  };

  const importQuestions = async (
    questions: Omit<Question, "id" | "createdAt">[]
  ) => {
    if (questions.length === 0) return;

    const { error } = await supabase
      .from("questions")
      .insert(questions);

    if (error) throw error;
    await refetch();
  };

  const updateQuestion = async (
    id: string,
    updates: Partial<Question>
  ) => {
    const { error } = await supabase
      .from("questions")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    await refetch();
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await refetch();
  };

  /* ================= FALLBACKS (OPÇÃO A) ================= */

  return {
    questions,
    loading: isLoading || isFetching,
    error,

    // CRUD
    addQuestion,
    importQuestions,
    updateQuestion,
    deleteQuestion,
    refetch,

    // Fallbacks seguros (não quebram nada)
    hasMore: false,
    loadMore: async () => {},
    loadQuestionsByCategory: async () => [],
    getAllCategories: () =>
      Array.from(new Set(questions.map(q => q.categoria))),
    getAllCategoriesWithCounts: () =>
      Array.from(
        questions.reduce((map, q) => {
          map.set(q.categoria, (map.get(q.categoria) || 0) + 1);
          return map;
        }, new Map<string, number>())
      ).map(([categoria, count]) => ({ categoria, count })),
  };
}
