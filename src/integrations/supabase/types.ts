export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_settings: {
        Row: {
          address: string | null
          business_name: string
          gst_number: string
          id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          gst_number: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          gst_number?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consumables: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          id: string
          name: string
          price_per_unit: number
          quantity: number
          total_price: number
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date: string
          id?: string
          name: string
          price_per_unit: number
          quantity: number
          total_price: number
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          price_per_unit?: number
          quantity?: number
          total_price?: number
          unit?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          balance: number | null
          contact: string
          created_at: string | null
          email: string
          gst: string
          id: string
          name: string
          phone: string
        }
        Insert: {
          balance?: number | null
          contact: string
          created_at?: string | null
          email: string
          gst: string
          id?: string
          name: string
          phone: string
        }
        Update: {
          balance?: number | null
          contact?: string
          created_at?: string | null
          email?: string
          gst?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      daily_readings: {
        Row: {
          actual_meter_sales: number
          closing_stock: number
          created_at: string | null
          date: string
          dip_reading: number
          fuel_type: string
          id: string
          net_stock: number | null
          opening_stock: number
          receipt_quantity: number
          sales_per_tank_stock: number | null
          stock_variation: number | null
          tank_number: number | null
        }
        Insert: {
          actual_meter_sales: number
          closing_stock: number
          created_at?: string | null
          date: string
          dip_reading: number
          fuel_type: string
          id?: string
          net_stock?: number | null
          opening_stock: number
          receipt_quantity: number
          sales_per_tank_stock?: number | null
          stock_variation?: number | null
          tank_number?: number | null
        }
        Update: {
          actual_meter_sales?: number
          closing_stock?: number
          created_at?: string | null
          date?: string
          dip_reading?: number
          fuel_type?: string
          id?: string
          net_stock?: number | null
          opening_stock?: number
          receipt_quantity?: number
          sales_per_tank_stock?: number | null
          stock_variation?: number | null
          tank_number?: number | null
        }
        Relationships: []
      }
      fuel_settings: {
        Row: {
          current_level: number
          current_price: number
          fuel_type: string
          id: string
          tank_capacity: number
          updated_at: string | null
        }
        Insert: {
          current_level: number
          current_price: number
          fuel_type: string
          id?: string
          tank_capacity: number
          updated_at?: string | null
        }
        Update: {
          current_level?: number
          current_price?: number
          fuel_type?: string
          id?: string
          tank_capacity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fuel_tests: {
        Row: {
          appearance: string
          created_at: string
          density: number
          fuel_type: string
          id: string
          litres_tested: number
          notes: string | null
          temperature: number
          test_date: string
          test_time: string
          tested_by: string
        }
        Insert: {
          appearance: string
          created_at?: string
          density: number
          fuel_type: string
          id?: string
          litres_tested?: number
          notes?: string | null
          temperature: number
          test_date: string
          test_time: string
          tested_by: string
        }
        Update: {
          appearance?: string
          created_at?: string
          density?: number
          fuel_type?: string
          id?: string
          litres_tested?: number
          notes?: string | null
          temperature?: number
          test_date?: string
          test_time?: string
          tested_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      indent_booklets: {
        Row: {
          created_at: string | null
          customer_id: string
          end_number: string
          id: string
          issued_date: string
          start_number: string
          status: string
          total_indents: number
          used_indents: number
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          end_number: string
          id?: string
          issued_date: string
          start_number: string
          status?: string
          total_indents: number
          used_indents?: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          end_number?: string
          id?: string
          issued_date?: string
          start_number?: string
          status?: string
          total_indents?: number
          used_indents?: number
        }
        Relationships: [
          {
            foreignKeyName: "indent_booklets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      indents: {
        Row: {
          amount: number
          booklet_id: string | null
          created_at: string | null
          customer_id: string
          date: string | null
          fuel_type: string
          id: string
          indent_number: string | null
          quantity: number
          status: string | null
          vehicle_id: string
        }
        Insert: {
          amount: number
          booklet_id?: string | null
          created_at?: string | null
          customer_id: string
          date?: string | null
          fuel_type: string
          id: string
          indent_number?: string | null
          quantity: number
          status?: string | null
          vehicle_id: string
        }
        Update: {
          amount?: number
          booklet_id?: string | null
          created_at?: string | null
          customer_id?: string
          date?: string | null
          fuel_type?: string
          id?: string
          indent_number?: string | null
          quantity?: number
          status?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indents_booklet_id_fkey"
            columns: ["booklet_id"]
            isOneToOne: false
            referencedRelation: "indent_booklets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          date: string
          fuel_type: string
          id: string
          price_per_unit: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          date: string
          fuel_type: string
          id?: string
          price_per_unit: number
          quantity: number
          updated_at?: string | null
        }
        Update: {
          date?: string
          fuel_type?: string
          id?: string
          price_per_unit?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          username?: string | null
        }
        Relationships: []
      }
      pump_settings: {
        Row: {
          created_at: string | null
          fuel_types: string[]
          id: string
          nozzle_count: number
          pump_number: string
        }
        Insert: {
          created_at?: string | null
          fuel_types?: string[]
          id?: string
          nozzle_count?: number
          pump_number: string
        }
        Update: {
          created_at?: string | null
          fuel_types?: string[]
          id?: string
          nozzle_count?: number
          pump_number?: string
        }
        Relationships: []
      }
      readings: {
        Row: {
          card_sales: number | null
          cash_given: number | null
          cash_remaining: number | null
          cash_sales: number | null
          closing_reading: number | null
          created_at: string | null
          date: string
          id: string
          opening_reading: number
          pump_id: string
          shift_id: string
          staff_id: string
          upi_sales: number | null
        }
        Insert: {
          card_sales?: number | null
          cash_given?: number | null
          cash_remaining?: number | null
          cash_sales?: number | null
          closing_reading?: number | null
          created_at?: string | null
          date: string
          id?: string
          opening_reading: number
          pump_id: string
          shift_id: string
          staff_id: string
          upi_sales?: number | null
        }
        Update: {
          card_sales?: number | null
          cash_given?: number | null
          cash_remaining?: number | null
          cash_sales?: number | null
          closing_reading?: number | null
          created_at?: string | null
          date?: string
          id?: string
          opening_reading?: number
          pump_id?: string
          shift_id?: string
          staff_id?: string
          upi_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "readings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          cash_remaining: number | null
          created_at: string | null
          end_time: string | null
          id: string
          shift_type: string
          staff_id: string
          start_time: string
          status: string | null
        }
        Insert: {
          cash_remaining?: number | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          shift_type: string
          staff_id: string
          start_time: string
          status?: string | null
        }
        Update: {
          cash_remaining?: number | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          shift_type?: string
          staff_id?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          assigned_pumps: Json | null
          email: string
          id: string
          joining_date: string
          name: string
          phone: string
          role: string
          salary: number
        }
        Insert: {
          assigned_pumps?: Json | null
          email: string
          id?: string
          joining_date: string
          name: string
          phone: string
          role: string
          salary: number
        }
        Update: {
          assigned_pumps?: Json | null
          email?: string
          id?: string
          joining_date?: string
          name?: string
          phone?: string
          role?: string
          salary?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          date: string
          fuel_type: string
          id: string
          indent_id: string | null
          payment_method: string
          quantity: number
          staff_id: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          date: string
          fuel_type: string
          id: string
          indent_id?: string | null
          payment_method: string
          quantity: number
          staff_id: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          date?: string
          fuel_type?: string
          id?: string
          indent_id?: string | null
          payment_method?: string
          quantity?: number
          staff_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_indent_id_fkey"
            columns: ["indent_id"]
            isOneToOne: false
            referencedRelation: "indents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: string
          created_at: string | null
          customer_id: string
          id: string
          number: string
          type: string
        }
        Insert: {
          capacity: string
          created_at?: string | null
          customer_id: string
          id?: string
          number: string
          type: string
        }
        Update: {
          capacity?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          number?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
