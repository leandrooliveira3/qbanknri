-- Função RPC para buscar categorias com contagens (rápido e barato em egress)
CREATE OR REPLACE FUNCTION list_categories_with_counts()
RETURNS TABLE (
  categoria text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    categoria,
    COUNT(*) as count
  FROM public.questions
  WHERE user_id = auth.uid() OR is_public = true
  GROUP BY categoria
  ORDER BY categoria;
$$;