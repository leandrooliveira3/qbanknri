import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/types/question";

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

  /* ========== ADD SINGLE QUESTION ========== */

  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, "id" | "createdAt">) => {
      const { error } = await supabase
        .from("questions")
        .insert({
          ...question,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  /* ========== IMPORT QUESTIONS (🔥 O QUE FALTAVA 🔥) ========== */

  const importQuestions = useMutation({
    mutationFn: async (questions: Omit<Question, "id" | "createdAt">[]) => {
      const payload = questions.map((q) => ({
        ...q,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("questions")
        .insert(payload);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  return {
    questions,
    loading: isLoading,
    isFetching,
    error,
    refetch,

    addQuestion: addQuestion.mutateAsync,
    importQuestions: importQuestions.mutateAsync, // 🔑 ESSENCIAL
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
  };
}
