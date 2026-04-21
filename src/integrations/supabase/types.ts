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
      addresses: {
        Row: {
          city: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          postal_code: string
          province: string | null
          street: string
          suburb: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          postal_code: string
          province?: string | null
          street: string
          suburb: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          postal_code?: string
          province?: string | null
          street?: string
          suburb?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          franchise_code: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          franchise_code?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          franchise_code?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          cheapest_price: number | null
          id: string
          postal_code: string
          request_timestamp: string
          rf_code: string
          services_count: number | null
          suburb: string
          weight: number
        }
        Insert: {
          cheapest_price?: number | null
          id?: string
          postal_code: string
          request_timestamp?: string
          rf_code?: string
          services_count?: number | null
          suburb: string
          weight: number
        }
        Update: {
          cheapest_price?: number | null
          id?: string
          postal_code?: string
          request_timestamp?: string
          rf_code?: string
          services_count?: number | null
          suburb?: string
          weight?: number
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          created_at: string
          description: string
          id: string
          location: string | null
          recorded_by: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          location?: string | null
          recorded_by?: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          recorded_by?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          assigned_driver_id: string | null
          created_at: string
          customer_id: string
          id: string
          paid: boolean
          parcel_description: string | null
          pickup_scheduled_at: string | null
          price_zar: number
          receiver_franchise_code: string | null
          receiver_name: string
          receiver_phone: string
          receiver_postal_code: string
          receiver_street: string
          receiver_suburb: string
          sender_franchise_code: string
          sender_name: string
          sender_phone: string
          sender_postal_code: string
          sender_street: string
          sender_suburb: string
          service_name: string
          service_type: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          updated_at: string
          waybill_number: string
          weight_kg: number
        }
        Insert: {
          assigned_driver_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          paid?: boolean
          parcel_description?: string | null
          pickup_scheduled_at?: string | null
          price_zar: number
          receiver_franchise_code?: string | null
          receiver_name: string
          receiver_phone: string
          receiver_postal_code: string
          receiver_street: string
          receiver_suburb: string
          sender_franchise_code?: string
          sender_name: string
          sender_phone: string
          sender_postal_code: string
          sender_street: string
          sender_suburb: string
          service_name: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          updated_at?: string
          waybill_number: string
          weight_kg: number
        }
        Update: {
          assigned_driver_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          paid?: boolean
          parcel_description?: string | null
          pickup_scheduled_at?: string | null
          price_zar?: number
          receiver_franchise_code?: string | null
          receiver_name?: string
          receiver_phone?: string
          receiver_postal_code?: string
          receiver_street?: string
          receiver_suburb?: string
          sender_franchise_code?: string
          sender_name?: string
          sender_phone?: string
          sender_postal_code?: string
          sender_street?: string
          sender_suburb?: string
          service_name?: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          updated_at?: string
          waybill_number?: string
          weight_kg?: number
        }
        Relationships: []
      }
      tracking_searches: {
        Row: {
          has_result: boolean | null
          id: string
          result_status: string | null
          search_timestamp: string
          tracking_number: string
        }
        Insert: {
          has_result?: boolean | null
          id?: string
          result_status?: string | null
          search_timestamp?: string
          tracking_number: string
        }
        Update: {
          has_result?: boolean | null
          id?: string
          result_status?: string | null
          search_timestamp?: string
          tracking_number?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      generate_waybill: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_franchise: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "customer" | "driver" | "franchisee" | "admin"
      shipment_status:
        | "pending_payment"
        | "booked"
        | "awaiting_pickup"
        | "collected"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "failed_delivery"
        | "cancelled"
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
      app_role: ["customer", "driver", "franchisee", "admin"],
      shipment_status: [
        "pending_payment",
        "booked",
        "awaiting_pickup",
        "collected",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
        "cancelled",
      ],
    },
  },
} as const
