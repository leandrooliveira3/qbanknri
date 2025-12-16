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

  return (data ?? []).map((q) => ({
    ...q,
    createdAt: q.created_at ? new Date(q.created_at) : new Date(),
  }));
};


/* ================= HOOK ================= */

export function useQuestions() {
  const queryClient = useQueryClient();

  const {
    data: questions = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
    staleTime: Infinity,
  });

  /* ================= ADD ================= */

  const addQuestion = useMutation({
    mutationFn: async (question: Omit<Question, "id" | "createdAt">) => {
      const payload = {
        ...question,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("questions")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar questão:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ================= IMPORT (🔴 ERRO ORIGINAL ESTAVA AQUI) ================= */

  const importQuestions = useMutation({
    mutationFn: async (
      questions: Omit<Question, "id" | "createdAt">[]
    ) => {
      const payload = questions.map(q => ({
        ...q,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("questions")
        .insert(payload)
        .select();

      if (error) {
        console.error("Erro ao importar questões:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ================= UPDATE ================= */

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

      if (error) {
        console.error("Erro ao atualizar questão:", error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ================= DELETE ================= */

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao excluir questão:", error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ================= RETURN ================= */

  return {
    questions,
    isLoading,
    isFetching,
    error,
    addQuestion: addQuestion.mutateAsync,
    importQuestions: importQuestions.mutateAsync, // 🔑 ESSENCIAL
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
  };
}
