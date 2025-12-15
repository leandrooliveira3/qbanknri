-- Alterar o campo categoria de enum para text para permitir categorias personalizadas
ALTER TABLE public.questions ALTER COLUMN categoria TYPE text USING categoria::text;

-- Também alterar dificuldade se necessário para flexibilidade
-- ALTER TABLE public.questions ALTER COLUMN dificuldade TYPE text USING dificuldade::text;

-- Remover o enum neuro_category já que não será mais usado (opcional, mas recomendado)
-- DROP TYPE IF EXISTS public.neuro_category;