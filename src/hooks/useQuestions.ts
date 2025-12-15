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
    mutationFn: async (
      question: Omit<Question, "id" | "createdAt">
    ) => {
      const payload = {
        categoria: question.categoria,
        subcategoria: question.subcategoria ?? null,
        enunciado: question.enunciado,
        alternativas: question.alternativas, // jsonb
        gabarito: question.gabarito,
        comentario: question.comentario,
        dificuldade: question.dificuldade,
        tags: question.tags ?? [],
        fonte: question.fonte ?? null,
        imagem: question.imagem ?? [],
        comentarioImagem: question.comentarioImagem ?? [],
      };

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

  /* ================= IMPORT ================= */

  const importQuestions = useMutation({
    mutationFn: async (
      questions: Omit<Question, "id" | "createdAt">[]
    ) => {
      const payload = questions.map((q) => ({
        categoria: q.categoria,
        subcategoria: q.subcategoria ?? null,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        gabarito: q.gabarito,
        comentario: q.comentario,
        dificuldade: q.dificuldade,
        tags: q.tags ?? [],
        fonte: q.fonte ?? null,
        imagem: q.imagem ?? [],
        comentarioImagem: q.comentarioImagem ?? [],
      }));

      const { error } = await supabase
        .from("questions")
        .insert(payload);

      if (error) throw error;
      return true;
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
      const { createdAt, ...clean } = updates;

      const { data, error } = await supabase
        .from("questions")
        .update(clean)
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

  /* ================= DELETE ================= */

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
    isFetching,
    error,
    addQuestion: addQuestion.mutateAsync,
    importQuestions: importQuestions.mutateAsync,
    updateQuestion: updateQuestion.mutateAsync,
    deleteQuestion: deleteQuestion.mutateAsync,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["questions"] }),
  };
}
