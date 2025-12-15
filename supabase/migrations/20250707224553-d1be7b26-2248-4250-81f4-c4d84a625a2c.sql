-- Criar tabela para rastrear tentativas de questões
CREATE TABLE public.question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempt_time INTEGER, -- tempo em segundos para responder
  practice_session_id UUID, -- para agrupar tentativas de uma sessão
  simulado_session_id UUID, -- para agrupar tentativas de um simulado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para sessões de prática
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_name TEXT,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_time INTEGER, -- tempo total em segundos
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para sessões de simulado
CREATE TABLE public.simulado_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  config_name TEXT NOT NULL,
  categorias TEXT[] NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_time INTEGER, -- tempo total em segundos
  time_limit INTEGER, -- limite de tempo em segundos
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulado_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para question_attempts
CREATE POLICY "Users can view their own attempts" 
ON public.question_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attempts" 
ON public.question_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas para practice_sessions
CREATE POLICY "Users can view their own practice sessions" 
ON public.practice_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice sessions" 
ON public.practice_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas para simulado_sessions
CREATE POLICY "Users can view their own simulado sessions" 
ON public.simulado_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulado sessions" 
ON public.simulado_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_question_attempts_user_id ON public.question_attempts(user_id);
CREATE INDEX idx_question_attempts_question_id ON public.question_attempts(question_id);
CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_simulado_sessions_user_id ON public.simulado_sessions(user_id);