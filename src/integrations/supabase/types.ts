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
      bookings: {
        Row: {
          booking_code: string
          check_in: string
          check_out: string
          created_at: string
          guest_email: string | null
          guest_name: string
          guest_notes: string | null
          guest_phone: string
          guests_count: number
          id: string
          language: string | null
          room_id: string
          status: string
          total_price_vnd: number
          updated_at: string
        }
        Insert: {
          booking_code?: string
          check_in: string
          check_out: string
          created_at?: string
          guest_email?: string | null
          guest_name: string
          guest_notes?: string | null
          guest_phone: string
          guests_count?: number
          id?: string
          language?: string | null
          room_id: string
          status?: string
          total_price_vnd?: number
          updated_at?: string
        }
        Update: {
          booking_code?: string
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          guest_notes?: string | null
          guest_phone?: string
          guests_count?: number
          id?: string
          language?: string | null
          room_id?: string
          status?: string
          total_price_vnd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_vi: string | null
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          title_en: string | null
          title_vi: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          title_en?: string | null
          title_vi?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          title_en?: string | null
          title_vi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          id: string
          invoice_number: string
          issued_at: string
          status: string | null
          total_vnd: number
        }
        Insert: {
          booking_id: string
          id?: string
          invoice_number?: string
          issued_at?: string
          status?: string | null
          total_vnd?: number
        }
        Update: {
          booking_id?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          status?: string | null
          total_vnd?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_price_overrides: {
        Row: {
          created_at: string
          id: string
          note: string | null
          override_date: string
          price_vnd: number
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          override_date: string
          price_vnd: number
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          override_date?: string
          price_vnd?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_price_overrides_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string
          description_en: string | null
          description_ja: string | null
          description_vi: string | null
          description_zh: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_en: string
          name_ja: string
          name_vi: string
          name_zh: string
          peak_multiplier: number | null
          price_vnd: number
          size_sqm: number
          updated_at: string
          weekend_multiplier: number | null
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          description_vi?: string | null
          description_zh?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean | null
          name_en: string
          name_ja: string
          name_vi: string
          name_zh: string
          peak_multiplier?: number | null
          price_vnd?: number
          size_sqm?: number
          updated_at?: string
          weekend_multiplier?: number | null
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          description_vi?: string | null
          description_zh?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_en?: string
          name_ja?: string
          name_vi?: string
          name_zh?: string
          peak_multiplier?: number | null
          price_vnd?: number
          size_sqm?: number
          updated_at?: string
          weekend_multiplier?: number | null
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
      [_ in never]: never
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
