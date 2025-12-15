export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  attempt_time?: number;
  practice_session_id?: string;
  simulado_session_id?: string;
  created_at: Date;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  session_name?: string;
  total_questions: number;
  correct_answers: number;
  total_time?: number;
  completed_at: Date;
}

export interface SimuladoSession {
  id: string;
  user_id: string;
  config_name: string;
  categorias: string[];
  total_questions: number;
  correct_answers: number;
  total_time?: number;
  time_limit?: number;
  completed_at: Date;
}

export interface CategoryStats {
  categoria: string;
  total_attempts: number; // Total de tentativas
  unique_questions: number; // Questões únicas respondidas
  correct_attempts: number;
  accuracy: number;
  avg_time?: number;
  questions_answered_once: number;
  questions_answered_multiple: number;
  questions_remaining: number;
  repetition_rate: number; // Taxa de repetição da categoria
}

export interface GeneralStats {
  total_attempts: number; // Total de tentativas (antes: total_questions_answered)
  unique_questions_answered: number; // Questões únicas respondidas
  total_correct: number;
  overall_accuracy: number;
  questions_answered_once: number; // Questões respondidas 1x
  questions_answered_multiple: number; // Questões respondidas 2+ vezes
  repetition_rate: number; // Taxa de repetição (%)
  total_practice_sessions: number;
  total_simulados: number;
  avg_time_per_question?: number;
  category_stats: CategoryStats[];
  recent_sessions: (PracticeSession | SimuladoSession)[];
}