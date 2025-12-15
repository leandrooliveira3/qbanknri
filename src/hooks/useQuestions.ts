import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Question } from "@/types/question";

/* ===================== MAPPER ===================== */
const mapQuestion = (q: any): Question => ({
  id: q.id,
  categoria: q.categoria,
  subcategoria: q.subcategoria ?? "",
  enunciado: q.enunciado,
  alternativas: Array.isArray(q.alternativas) ? q.alternativas : [],
  gabarito: q.gabarito,
  comentario: q.comentario,
  dificuldade: q.dificuldade,
  tags: Array.isArray(q.tags) ? q.tags : [],
  fonte: q.fonte ?? "",
  imagem: Array.isArray(q.imagem) ? q.imagem : [],
  comentarioImagem: Array.isArray(q.comentarioImagem) ? q.comentarioImagem : [],
  referencias: Array.isArray(q.referencias) ? q.referencias : [],
  isFavorite: q.is_favorite ?? false,
  createdAt: q.created_at ? new Date(q.created_at) : new Date(),
});

/* ===================== FETCH ===================== */
const fetchQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapQuestion);
};

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

  /* ===================== ADD SINGLE ===================== */
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

      if (error) throw error;
      return mapQuestion(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ===================== IMPORT BATCH (🔥 FALTAVA ISSO) ===================== */
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

      if (error) throw error;
      return (data ?? []).map(mapQuestion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ===================== UPDATE ===================== */
  const updateQuestion = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Question>;
    }) => {
      const { createdAt, ...rest } = updates;

      const payload = {
        ...rest,
        ...(createdAt && { created_at: createdAt.toISOString() }),
      };

      const { data, error } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapQuestion(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  /* ===================== DELETE ===================== */
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
    importQuestions: importQuestions.mutateAsync, // ✅ AGORA EXISTE
    updateQuestion: (id: string, updates: Partial<Question>) =>
      updateQuestion.mutateAsync({ id, updates }),
    deleteQuestion: deleteQuestion.mutateAsync,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["questions"] }),
  };
}
