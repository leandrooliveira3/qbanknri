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

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  /* ---------- ADD ---------- */
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

  /* ---------- IMPORT (🔑 FIX) ---------- */
  const importQuestions = useMutation({
    mutationFn: async (
      questions: Omit<Question, "id" | "created_at">[]
    ) => {
      const { error } = await supabase
        .from("questions")
        .insert(questions);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ---------- UPDATE ---------- */
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

  /* ---------- DELETE ---------- */
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
    loading: isLoading,

    addQuestion: addQuestion.mutateAsync,
    importQuestions: importQuestions.mutateAsync, // 🔥 ESSENCIAL
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
  };
}
