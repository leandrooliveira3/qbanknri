-- First, let's check if the categoria column has any constraint or is using an enum
-- We'll update the existing check constraint or enum to include 'Neurorradiologia'

-- Drop the existing constraint if it exists
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_categoria_check;

-- Add a new check constraint that includes all categories including Neurorradiologia
ALTER TABLE questions ADD CONSTRAINT questions_categoria_check 
CHECK (categoria IN (
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
  'Reabilitação Neurológica',
  'Neurorradiologia'
));

-- Do the same for the categorias array column in simulado_sessions table if needed
ALTER TABLE simulado_sessions DROP CONSTRAINT IF EXISTS simulado_sessions_categorias_check;

-- Add constraint for categorias array
ALTER TABLE simulado_sessions ADD CONSTRAINT simulado_sessions_categorias_check 
CHECK (
  categorias <@ ARRAY[
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
    'Reabilitação Neurológica',
    'Neurorradiologia'
  ]::text[]
);