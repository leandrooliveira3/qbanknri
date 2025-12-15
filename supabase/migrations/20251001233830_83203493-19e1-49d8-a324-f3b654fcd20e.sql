-- Corrigir search_path nas funções para segurança
DROP FUNCTION IF EXISTS list_categories_with_counts();

CREATE OR REPLACE FUNCTION list_categories_with_counts()
RETURNS TABLE (
  categoria text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    categoria,
    COUNT(*) as count
  FROM public.questions
  WHERE user_id = auth.uid() OR is_public = true
  GROUP BY categoria
  ORDER BY categoria;
$$;

-- Também corrigir a função update_updated_at_column existente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;