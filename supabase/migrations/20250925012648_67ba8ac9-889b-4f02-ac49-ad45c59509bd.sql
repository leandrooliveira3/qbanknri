-- Create table for user favorites
CREATE TABLE IF NOT EXISTS public.question_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicates
ALTER TABLE public.question_favorites ADD CONSTRAINT uq_question_favorites UNIQUE (user_id, question_id);

-- Enable RLS
ALTER TABLE public.question_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for question_favorites
CREATE POLICY "Users can view own favorites"
ON public.question_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON public.question_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON public.question_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_question_favorites_user ON public.question_favorites(user_id);
CREATE INDEX idx_question_favorites_question ON public.question_favorites(question_id);