export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      connections: {
        Row: {
          addressee_last_read_at: string
          addressee_profile_id: string
          created_at: string
          id: string
          requester_last_read_at: string
          requester_profile_id: string
          status: string
        }
        Insert: {
          addressee_last_read_at?: string
          addressee_profile_id: string
          created_at?: string
          id?: string
          requester_last_read_at?: string
          requester_profile_id: string
          status?: string
        }
        Update: {
          addressee_last_read_at?: string
          addressee_profile_id?: string
          created_at?: string
          id?: string
          requester_last_read_at?: string
          requester_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_profile_id_fkey"
            columns: ["addressee_profile_id"]
            isOneToOne: false
            referencedRelation: "connection_overview"
            referencedColumns: ["other_profile_id"]
          },
          {
            foreignKeyName: "connections_addressee_profile_id_fkey"
            columns: ["addressee_profile_id"]
            isOneToOne: false
            referencedRelation: "discover_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_addressee_profile_id_fkey"
            columns: ["addressee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "connection_overview"
            referencedColumns: ["other_profile_id"]
          },
          {
            foreignKeyName: "connections_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "discover_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          connection_id: string
          created_at: string
          id: string
          sender_profile_id: string
        }
        Insert: {
          body: string
          connection_id: string
          created_at?: string
          id?: string
          sender_profile_id: string
        }
        Update: {
          body?: string
          connection_id?: string
          created_at?: string
          id?: string
          sender_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connection_overview"
            referencedColumns: ["connection_id"]
          },
          {
            foreignKeyName: "messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "connection_overview"
            referencedColumns: ["other_profile_id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "discover_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_path: string | null
          bio: string | null
          card_description: string | null
          created_at: string
          full_name: string
          id: string
          interests: string[]
          is_published: boolean
          role: string
          study_field: string | null
        }
        Insert: {
          availability?: string | null
          avatar_path?: string | null
          bio?: string | null
          card_description?: string | null
          created_at?: string
          full_name: string
          id: string
          interests?: string[]
          is_published?: boolean
          role: string
          study_field?: string | null
        }
        Update: {
          availability?: string | null
          avatar_path?: string | null
          bio?: string | null
          card_description?: string | null
          created_at?: string
          full_name?: string
          id?: string
          interests?: string[]
          is_published?: boolean
          role?: string
          study_field?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      connection_overview: {
        Row: {
          connection_id: string | null
          created_at: string | null
          i_am_requester: boolean | null
          last_message_at: string | null
          last_message_body: string | null
          last_message_sender_id: string | null
          other_availability: string | null
          other_avatar_path: string | null
          other_bio: string | null
          other_card_description: string | null
          other_full_name: string | null
          other_interests: string[] | null
          other_profile_id: string | null
          other_role: string | null
          other_study_field: string | null
          status: string | null
          unread_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "connection_overview"
            referencedColumns: ["other_profile_id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "discover_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["last_message_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_feed: {
        Row: {
          availability: string | null
          avatar_path: string | null
          bio: string | null
          card_description: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          interests: string[] | null
          role: string | null
          study_field: string | null
        }
        Insert: {
          availability?: string | null
          avatar_path?: string | null
          bio?: string | null
          card_description?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          interests?: string[] | null
          role?: string | null
          study_field?: string | null
        }
        Update: {
          availability?: string | null
          avatar_path?: string | null
          bio?: string | null
          card_description?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          interests?: string[] | null
          role?: string | null
          study_field?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

