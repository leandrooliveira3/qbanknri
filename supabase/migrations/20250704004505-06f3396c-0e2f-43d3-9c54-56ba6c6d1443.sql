-- Criar enum para categorias de neurologia
CREATE TYPE public.neuro_category AS ENUM (
  'Anatomia e Fisiologia do Sistema Nervoso',
  'Semiologia Neurológica',
  'Doenças Cerebrovasculares',
  'Epilepsia e Distúrbios Paroxísticos',
  'Demências e Distúrbios Cognitivos',
  'Distúrbios do Movimento',
  'Doenças Desmielinizantes',
  'Neuropatias Periféricas',
  'Miopatias e Distúrbios da Junção Neuromuscular',
  'Distúrbios do Sono',
  'Cefaleia e Dor Facial',
  'Neuro-oncologia',
  'Neurologia de Urgência',
  'Neurologia Pediátrica',
  'Neurogenética',
  'Neurologia Comportamental',
  'Reabilitação Neurológica'
);

-- Criar enum para dificuldade
CREATE TYPE public.difficulty_level AS ENUM ('Fácil', 'Médio', 'Difícil');

-- Criar tabela de questões
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enunciado TEXT NOT NULL,
  alternativas TEXT[] NOT NULL CHECK (array_length(alternativas, 1) = 5),
  gabarito CHAR(1) NOT NULL CHECK (gabarito IN ('A', 'B', 'C', 'D', 'E')),
  comentario TEXT NOT NULL,
  categoria neuro_category NOT NULL,
  subcategoria TEXT,
  dificuldade difficulty_level NOT NULL,
  tags TEXT[],
  fonte TEXT,
  imagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuários só veem suas próprias questões
CREATE POLICY "Users can view own questions" ON public.questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON public.questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions" ON public.questions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();