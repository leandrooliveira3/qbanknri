-- Tabela de Resumos
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para resumos
CREATE POLICY "Users can view own summaries"
ON public.summaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own summaries"
ON public.summaries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
ON public.summaries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries"
ON public.summaries FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de Flashcards
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT,
  difficulty TEXT DEFAULT 'Médio',
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  ease_factor DECIMAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para flashcards
CREATE POLICY "Users can view own flashcards"
ON public.flashcards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcards"
ON public.flashcards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
ON public.flashcards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
ON public.flashcards FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at nos resumos
CREATE TRIGGER update_summaries_updated_at
BEFORE UPDATE ON public.summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at nos flashcards
CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();