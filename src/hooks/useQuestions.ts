import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/types/question";

/**
 * Busca todas as questões do usuário logado
 */
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

export function useQuestions() {
  const queryClient = useQueryClient();

  const isOnline =
    typeof navigator !== "undefined" && navigator.onLine;

  const {
    data: questions = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
    enabled: isOnline,      // 🔑 não tenta fetch offline
    staleTime: Infinity,    // 🔑 confia no cache
  });

  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("questions")
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Question>;
    }) => {
      const { data, error } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  return {
    questions,
    isLoading,
    isFetching,
    error,
    addQuestion: addQuestion.mutateAsync,
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
  };
}
