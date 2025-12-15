export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_reviews: {
        Row: {
          created_at: string
          id: string
          question_ids: string[]
          review_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_ids: string[]
          review_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_ids?: string[]
          review_date?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          category: string | null
          created_at: string | null
          difficulty: string | null
          ease_factor: number | null
          front: string
          id: string
          interval_days: number | null
          next_review_at: string | null
          repetitions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          back: string
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          ease_factor?: number | null
          front: string
          id?: string
          interval_days?: number | null
          next_review_at?: string | null
          repetitions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          back?: string
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          ease_factor?: number | null
          front?: string
          id?: string
          interval_days?: number | null
          next_review_at?: string | null
          repetitions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          completed_at: string
          correct_answers: number
          id: string
          session_name: string | null
          total_questions: number
          total_time: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_answers: number
          id?: string
          session_name?: string | null
          total_questions: number
          total_time?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_answers?: number
          id?: string
          session_name?: string | null
          total_questions?: number
          total_time?: number | null
          user_id?: string
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          attempt_time: number | null
          created_at: string
          id: string
          is_correct: boolean
          practice_session_id: string | null
          question_id: string
          selected_answer: string
          simulado_session_id: string | null
          user_id: string
        }
        Insert: {
          attempt_time?: number | null
          created_at?: string
          id?: string
          is_correct: boolean
          practice_session_id?: string | null
          question_id: string
          selected_answer: string
          simulado_session_id?: string | null
          user_id: string
        }
        Update: {
          attempt_time?: number | null
          created_at?: string
          id?: string
          is_correct?: boolean
          practice_session_id?: string | null
          question_id?: string
          selected_answer?: string
          simulado_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_favorites: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          alternativas: string[]
          categoria: string
          comentario: string
          comentario_imagem: string[] | null
          created_at: string | null
          dificuldade: Database["public"]["Enums"]["difficulty_level"]
          enunciado: string
          fonte: string | null
          gabarito: string
          id: string
          imagem: string[] | null
          is_public: boolean
          referencias: string[] | null
          subcategoria: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternativas: string[]
          categoria: string
          comentario: string
          comentario_imagem?: string[] | null
          created_at?: string | null
          dificuldade: Database["public"]["Enums"]["difficulty_level"]
          enunciado: string
          fonte?: string | null
          gabarito: string
          id?: string
          imagem?: string[] | null
          is_public?: boolean
          referencias?: string[] | null
          subcategoria?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternativas?: string[]
          categoria?: string
          comentario?: string
          comentario_imagem?: string[] | null
          created_at?: string | null
          dificuldade?: Database["public"]["Enums"]["difficulty_level"]
          enunciado?: string
          fonte?: string | null
          gabarito?: string
          id?: string
          imagem?: string[] | null
          is_public?: boolean
          referencias?: string[] | null
          subcategoria?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      simulado_sessions: {
        Row: {
          categorias: string[]
          completed_at: string
          config_name: string
          correct_answers: number
          id: string
          time_limit: number | null
          total_questions: number
          total_time: number | null
          user_id: string
        }
        Insert: {
          categorias: string[]
          completed_at?: string
          config_name: string
          correct_answers: number
          id?: string
          time_limit?: number | null
          total_questions: number
          total_time?: number | null
          user_id: string
        }
        Update: {
          categorias?: string[]
          completed_at?: string
          config_name?: string
          correct_answers?: number
          id?: string
          time_limit?: number | null
          total_questions?: number
          total_time?: number | null
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      list_categories_with_counts: {
        Args: never
        Returns: {
          categoria: string
          count: number
        }[]
      }
    }
    Enums: {
      difficulty_level: "Fácil" | "Médio" | "Difícil"
      neuro_category:
        | "Anatomia e Fisiologia do Sistema Nervoso"
        | "Semiologia Neurológica"
        | "Doenças Cerebrovasculares"
        | "Epilepsia e Distúrbios Paroxísticos"
        | "Demências e Distúrbios Cognitivos"
        | "Distúrbios do Movimento"
        | "Doenças Desmielinizantes"
        | "Neuropatias Periféricas"
        | "Miopatias e Distúrbios da Junção Neuromuscular"
        | "Distúrbios do Sono"
        | "Cefaleia e Dor Facial"
        | "Neuro-oncologia"
        | "Neurologia de Urgência"
        | "Neurologia Pediátrica"
        | "Neurogenética"
        | "Neurologia Comportamental"
        | "Reabilitação Neurológica"
        | "Neurorradiologia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["Fácil", "Médio", "Difícil"],
      neuro_category: [
        "Anatomia e Fisiologia do Sistema Nervoso",
        "Semiologia Neurológica",
        "Doenças Cerebrovasculares",
        "Epilepsia e Distúrbios Paroxísticos",
        "Demências e Distúrbios Cognitivos",
        "Distúrbios do Movimento",
        "Doenças Desmielinizantes",
        "Neuropatias Periféricas",
        "Miopatias e Distúrbios da Junção Neuromuscular",
        "Distúrbios do Sono",
        "Cefaleia e Dor Facial",
        "Neuro-oncologia",
        "Neurologia de Urgência",
        "Neurologia Pediátrica",
        "Neurogenética",
        "Neurologia Comportamental",
        "Reabilitação Neurológica",
        "Neurorradiologia",
      ],
    },
  },
} as const
