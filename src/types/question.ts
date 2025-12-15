export interface Question {
  id: string;
  categoria: string; // Changed to string to allow dynamic categories
  subcategoria?: string;
  enunciado: string;
  alternativas: string[];
  gabarito: 'A' | 'B' | 'C' | 'D' | 'E';
  comentario: string;
  dificuldade: 'Fácil' | 'Médio' | 'Difícil';
  tags?: string[];
  fonte?: string;
  imagem?: string[]; // URLs das imagens anexadas no enunciado
  comentarioImagem?: string[]; // URLs das imagens anexadas no comentário
  referencias?: string[]; // Referencias bibliográficas
  isFavorite?: boolean; // Questão marcada como favorita
  createdAt: Date;
}

export type NeuroCategory = 
  | 'Anatomia e Fisiologia do Sistema Nervoso'
  | 'Semiologia Neurológica'
  | 'Doenças Cerebrovasculares'
  | 'Epilepsia e Distúrbios Paroxísticos'
  | 'Demências e Distúrbios Cognitivos'
  | 'Distúrbios do Movimento'
  | 'Doenças Desmielinizantes'
  | 'Neuropatias Periféricas'
  | 'Miopatias e Distúrbios da Junção Neuromuscular'
  | 'Distúrbios do Sono'
  | 'Cefaleia e Dor Facial'
  | 'Neuro-oncologia'
  | 'Neurologia de Urgência'
  | 'Neurologia Pediátrica'
  | 'Neurogenética'
  | 'Neurologia Comportamental'
  | 'Reabilitação Neurológica'
  | 'Neurorradiologia';

export interface SimuladoConfig {
  nome: string;
  categorias: string[]; // Changed to string[] to allow dynamic categories
  numQuestoes: number;
  dificuldade?: 'Fácil' | 'Médio' | 'Difícil';
  tempo?: number; // em minutos
}

export interface SimuladoResult {
  id: string;
  config: SimuladoConfig;
  questoes: Question[];
  respostas: Record<string, string>;
  pontuacao: number;
  tempo: number;
  completedAt: Date;
}