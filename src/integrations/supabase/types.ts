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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessment_reports: {
        Row: {
          challenges: string[] | null
          created_at: string
          detailed_analysis: Json | null
          id: string
          overall_sentiment_score: number | null
          primary_patterns: string[] | null
          recommendations: Json | null
          session_id: string
          strengths: string[] | null
        }
        Insert: {
          challenges?: string[] | null
          created_at?: string
          detailed_analysis?: Json | null
          id?: string
          overall_sentiment_score?: number | null
          primary_patterns?: string[] | null
          recommendations?: Json | null
          session_id: string
          strengths?: string[] | null
        }
        Update: {
          challenges?: string[] | null
          created_at?: string
          detailed_analysis?: Json | null
          id?: string
          overall_sentiment_score?: number | null
          primary_patterns?: string[] | null
          recommendations?: Json | null
          session_id?: string
          strengths?: string[] | null
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          ai_acknowledgment: string | null
          created_at: string
          emotion_detected: string | null
          id: string
          question_index: number
          question_text: string
          sentiment_score: number | null
          session_id: string
          user_response: string
        }
        Insert: {
          ai_acknowledgment?: string | null
          created_at?: string
          emotion_detected?: string | null
          id?: string
          question_index: number
          question_text: string
          sentiment_score?: number | null
          session_id: string
          user_response: string
        }
        Update: {
          ai_acknowledgment?: string | null
          created_at?: string
          emotion_detected?: string | null
          id?: string
          question_index?: number
          question_text?: string
          sentiment_score?: number | null
          session_id?: string
          user_response?: string
        }
        Relationships: []
      }
      assessment_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          session_id: string
          started_at: string
          status: string
          total_questions: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          session_id: string
          started_at?: string
          status?: string
          total_questions?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          session_id?: string
          started_at?: string
          status?: string
          total_questions?: number | null
        }
        Relationships: []
      }
      companion_memories: {
        Row: {
          content: string
          created_at: string
          emotional_context: string | null
          id: string
          importance_score: number | null
          last_referenced_at: string | null
          memory_type: string
          reference_count: number | null
          source_session_id: string | null
          tags: string[] | null
        }
        Insert: {
          content: string
          created_at?: string
          emotional_context?: string | null
          id?: string
          importance_score?: number | null
          last_referenced_at?: string | null
          memory_type: string
          reference_count?: number | null
          source_session_id?: string | null
          tags?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string
          emotional_context?: string | null
          id?: string
          importance_score?: number | null
          last_referenced_at?: string | null
          memory_type?: string
          reference_count?: number | null
          source_session_id?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      companion_messages: {
        Row: {
          content: string
          created_at: string
          emotion_detected: string | null
          id: string
          is_significant: boolean | null
          role: string
          sentiment_score: number | null
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emotion_detected?: string | null
          id?: string
          is_significant?: boolean | null
          role: string
          sentiment_score?: number | null
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emotion_detected?: string | null
          id?: string
          is_significant?: boolean | null
          role?: string
          sentiment_score?: number | null
          session_id?: string
        }
        Relationships: []
      }
      companion_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          messages_count: number | null
          mood_summary: string | null
          session_id: string
          started_at: string
          topics_discussed: string[] | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          messages_count?: number | null
          mood_summary?: string | null
          session_id: string
          started_at?: string
          topics_discussed?: string[] | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          messages_count?: number | null
          mood_summary?: string | null
          session_id?: string
          started_at?: string
          topics_discussed?: string[] | null
        }
        Relationships: []
      }
      companion_strategies: {
        Row: {
          category: string
          created_at: string
          description: string
          effectiveness_rating: number | null
          id: string
          last_used_at: string | null
          strategy_name: string
          times_successful: number | null
          times_suggested: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          effectiveness_rating?: number | null
          id?: string
          last_used_at?: string | null
          strategy_name: string
          times_successful?: number | null
          times_suggested?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          effectiveness_rating?: number | null
          id?: string
          last_used_at?: string | null
          strategy_name?: string
          times_successful?: number | null
          times_suggested?: number | null
        }
        Relationships: []
      }
      exercise_completions: {
        Row: {
          completed_at: string
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      exercise_favorites: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      grounding_exercises: {
        Row: {
          audio_cues: string[] | null
          category: string
          created_at: string
          duration_minutes: number | null
          id: string
          instructions: Json
          name: string
          suitable_for: string[] | null
        }
        Insert: {
          audio_cues?: string[] | null
          category: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          instructions: Json
          name: string
          suitable_for?: string[] | null
        }
        Update: {
          audio_cues?: string[] | null
          category?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          instructions?: Json
          name?: string
          suitable_for?: string[] | null
        }
        Relationships: []
      }
      moderation_logs: {
        Row: {
          confidence: number | null
          content_preview: string
          created_at: string
          full_content_hash: string | null
          id: string
          is_blocked: boolean
          is_crisis: boolean
          reason: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_level: string
          safe_response_suggestion: string | null
          session_id: string | null
          source: string
          violated_policies: string[] | null
        }
        Insert: {
          confidence?: number | null
          content_preview: string
          created_at?: string
          full_content_hash?: string | null
          id?: string
          is_blocked?: boolean
          is_crisis?: boolean
          reason?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string
          safe_response_suggestion?: string | null
          session_id?: string | null
          source: string
          violated_policies?: string[] | null
        }
        Update: {
          confidence?: number | null
          content_preview?: string
          created_at?: string
          full_content_hash?: string | null
          id?: string
          is_blocked?: boolean
          is_crisis?: boolean
          reason?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string
          safe_response_suggestion?: string | null
          session_id?: string | null
          source?: string
          violated_policies?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      moderation_metrics_daily: {
        Row: {
          assessment_checks: number | null
          avg_confidence: number | null
          blocked_count: number | null
          companion_checks: number | null
          crisis_count: number | null
          date: string | null
          high_risk_count: number | null
          total_checks: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
