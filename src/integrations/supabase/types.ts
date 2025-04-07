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
          fuel_pump_id: string | null
          gst_number: string
          id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          fuel_pump_id?: string | null
          gst_number: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          fuel_pump_id?: string | null
          gst_number?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: true
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      consumables: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          fuel_pump_id: string | null
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
          fuel_pump_id?: string | null
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
          fuel_pump_id?: string | null
          id?: string
          name?: string
          price_per_unit?: number
          quantity?: number
          total_price?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumables_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          fuel_pump_id: string | null
          id: string
          notes: string | null
          payment_method: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          date?: string
          fuel_pump_id?: string | null
          id?: string
          notes?: string | null
          payment_method: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          fuel_pump_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          balance: number | null
          contact: string
          created_at: string | null
          email: string
          fuel_pump_id: string | null
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
          fuel_pump_id?: string | null
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
          fuel_pump_id?: string | null
          gst?: string
          id?: string
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_readings: {
        Row: {
          actual_meter_sales: number
          closing_stock: number
          created_at: string | null
          date: string
          dip_reading: number
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          net_stock: number | null
          opening_stock: number
          receipt_quantity: number | null
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
          fuel_pump_id?: string | null
          fuel_type: string
          id?: string
          net_stock?: number | null
          opening_stock: number
          receipt_quantity?: number | null
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
          fuel_pump_id?: string | null
          fuel_type?: string
          id?: string
          net_stock?: number | null
          opening_stock?: number
          receipt_quantity?: number | null
          sales_per_tank_stock?: number | null
          stock_variation?: number | null
          tank_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_readings_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_pumps: {
        Row: {
          address: string | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          status: string
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_pumps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_settings: {
        Row: {
          current_level: number
          current_price: number
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          tank_capacity: number
          updated_at: string | null
        }
        Insert: {
          current_level: number
          current_price: number
          fuel_pump_id?: string | null
          fuel_type: string
          id?: string
          tank_capacity: number
          updated_at?: string | null
        }
        Update: {
          current_level?: number
          current_price?: number
          fuel_pump_id?: string | null
          fuel_type?: string
          id?: string
          tank_capacity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_settings_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_tests: {
        Row: {
          appearance: string
          created_at: string
          density: number
          fuel_pump_id: string | null
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
          fuel_pump_id?: string | null
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
          fuel_pump_id?: string | null
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
            foreignKeyName: "fuel_tests_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
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
          fuel_pump_id: string | null
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
          fuel_pump_id?: string | null
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
          fuel_pump_id?: string | null
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
          {
            foreignKeyName: "indent_booklets_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      indents: {
        Row: {
          amount: number
          approval_date: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_by: string | null
          booklet_id: string | null
          created_at: string | null
          customer_id: string
          date: string | null
          discount_amount: number | null
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          indent_number: string | null
          quantity: number
          source: string | null
          status: string | null
          vehicle_id: string
        }
        Insert: {
          amount: number
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          booklet_id?: string | null
          created_at?: string | null
          customer_id: string
          date?: string | null
          discount_amount?: number | null
          fuel_pump_id?: string | null
          fuel_type: string
          id: string
          indent_number?: string | null
          quantity: number
          source?: string | null
          status?: string | null
          vehicle_id: string
        }
        Update: {
          amount?: number
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          booklet_id?: string | null
          created_at?: string | null
          customer_id?: string
          date?: string | null
          discount_amount?: number | null
          fuel_pump_id?: string | null
          fuel_type?: string
          id?: string
          indent_number?: string | null
          quantity?: number
          source?: string | null
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
            foreignKeyName: "indents_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
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
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          price_per_unit: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          date: string
          fuel_pump_id?: string | null
          fuel_type: string
          id?: string
          price_per_unit: number
          quantity: number
          updated_at?: string | null
        }
        Update: {
          date?: string
          fuel_pump_id?: string | null
          fuel_type?: string
          id?: string
          price_per_unit?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          date: string
          fuel_pump_id: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          date?: string
          fuel_pump_id?: string | null
          id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          date?: string
          fuel_pump_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
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
          fuel_pump_id: string | null
          fuel_types: string[]
          id: string
          nozzle_count: number
          pump_number: string
        }
        Insert: {
          created_at?: string | null
          fuel_pump_id?: string | null
          fuel_types?: string[]
          id?: string
          nozzle_count?: number
          pump_number: string
        }
        Update: {
          created_at?: string | null
          fuel_pump_id?: string | null
          fuel_types?: string[]
          id?: string
          nozzle_count?: number
          pump_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "pump_settings_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      readings: {
        Row: {
          card_sales: number | null
          cash_given: number | null
          cash_remaining: number | null
          cash_sales: number | null
          closing_reading: number | null
          consumable_expenses: number | null
          created_at: string | null
          date: string
          expenses: number | null
          fuel_pump_id: string | null
          id: string
          opening_reading: number
          pump_id: string
          shift_id: string
          staff_id: string
          testing_fuel: number | null
          upi_sales: number | null
        }
        Insert: {
          card_sales?: number | null
          cash_given?: number | null
          cash_remaining?: number | null
          cash_sales?: number | null
          closing_reading?: number | null
          consumable_expenses?: number | null
          created_at?: string | null
          date: string
          expenses?: number | null
          fuel_pump_id?: string | null
          id?: string
          opening_reading: number
          pump_id: string
          shift_id: string
          staff_id: string
          testing_fuel?: number | null
          upi_sales?: number | null
        }
        Update: {
          card_sales?: number | null
          cash_given?: number | null
          cash_remaining?: number | null
          cash_sales?: number | null
          closing_reading?: number | null
          consumable_expenses?: number | null
          created_at?: string | null
          date?: string
          expenses?: number | null
          fuel_pump_id?: string | null
          id?: string
          opening_reading?: number
          pump_id?: string
          shift_id?: string
          staff_id?: string
          testing_fuel?: number | null
          upi_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "readings_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
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
      shift_consumables: {
        Row: {
          consumable_id: string
          created_at: string | null
          id: string
          quantity_allocated: number
          quantity_returned: number | null
          shift_id: string
          status:
            | Database["public"]["Enums"]["consumable_allocation_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          consumable_id: string
          created_at?: string | null
          id?: string
          quantity_allocated: number
          quantity_returned?: number | null
          shift_id: string
          status?:
            | Database["public"]["Enums"]["consumable_allocation_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          consumable_id?: string
          created_at?: string | null
          id?: string
          quantity_allocated?: number
          quantity_returned?: number | null
          shift_id?: string
          status?:
            | Database["public"]["Enums"]["consumable_allocation_status"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_consumables_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_consumables_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          cash_remaining: number | null
          created_at: string | null
          end_time: string | null
          fuel_pump_id: string | null
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
          fuel_pump_id?: string | null
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
          fuel_pump_id?: string | null
          id?: string
          shift_type?: string
          staff_id?: string
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
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
          auth_id: string | null
          email: string
          fuel_pump_id: string | null
          id: string
          is_active: boolean | null
          joining_date: string
          name: string
          phone: string
          role: string
          salary: number
          staff_numeric_id: string | null
        }
        Insert: {
          assigned_pumps?: Json | null
          auth_id?: string | null
          email: string
          fuel_pump_id?: string | null
          id?: string
          is_active?: boolean | null
          joining_date: string
          name: string
          phone: string
          role: string
          salary: number
          staff_numeric_id?: string | null
        }
        Update: {
          assigned_pumps?: Json | null
          auth_id?: string | null
          email?: string
          fuel_pump_id?: string | null
          id?: string
          is_active?: boolean | null
          joining_date?: string
          name?: string
          phone?: string
          role?: string
          salary?: number
          staff_numeric_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          created_at: string | null
          feature: Database["public"]["Enums"]["staff_feature"]
          id: string
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature: Database["public"]["Enums"]["staff_feature"]
          id?: string
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: Database["public"]["Enums"]["staff_feature"]
          id?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tank_unloads: {
        Row: {
          amount: number
          created_at: string
          date: string
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          quantity: number
          vehicle_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          fuel_pump_id?: string | null
          fuel_type: string
          id?: string
          quantity: number
          vehicle_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          fuel_pump_id?: string | null
          fuel_type?: string
          id?: string
          quantity?: number
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tank_unloads_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          approval_date: string | null
          approval_notes: string | null
          approval_status: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string | null
          date: string
          discount_amount: number | null
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          indent_id: string | null
          payment_method: string
          quantity: number
          source: string | null
          staff_id: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          date: string
          discount_amount?: number | null
          fuel_pump_id?: string | null
          fuel_type: string
          id: string
          indent_id?: string | null
          payment_method: string
          quantity: number
          source?: string | null
          staff_id: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          approval_date?: string | null
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_id?: string | null
          date?: string
          discount_amount?: number | null
          fuel_pump_id?: string | null
          fuel_type?: string
          id?: string
          indent_id?: string | null
          payment_method?: string
          quantity?: number
          source?: string | null
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
            foreignKeyName: "transactions_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_indent_id_fkey"
            columns: ["indent_id"]
            isOneToOne: false
            referencedRelation: "indents"
            referencedColumns: ["indent_number"]
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
          fuel_pump_id: string | null
          id: string
          number: string
          type: string
        }
        Insert: {
          capacity: string
          created_at?: string | null
          customer_id: string
          fuel_pump_id?: string | null
          id?: string
          number: string
          type: string
        }
        Update: {
          capacity?: string
          created_at?: string | null
          customer_id?: string
          fuel_pump_id?: string | null
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
          {
            foreignKeyName: "vehicles_fuel_pump_id_fkey"
            columns: ["fuel_pump_id"]
            isOneToOne: false
            referencedRelation: "fuel_pumps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_invoice_record: {
        Args:
          | { p_customer_id: string; p_amount: number; p_date?: string }
          | {
              p_customer_id: string
              p_amount: number
              p_date?: string
              pump_id?: string
            }
        Returns: string
      }
      decrement_balance: {
        Args: { customer_id: string; amount_value: number }
        Returns: number
      }
      get_fuel_pump_by_email: {
        Args: { email_param: string }
        Returns: {
          address: string | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          status: string
        }[]
      }
      get_fuel_pump_by_id: {
        Args: { id_param: string }
        Returns: {
          address: string | null
          contact_number: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          status: string
        }[]
      }
      get_fuel_settings_for_pump: {
        Args: { pump_id_param: string }
        Returns: {
          current_level: number
          current_price: number
          fuel_pump_id: string | null
          fuel_type: string
          id: string
          tank_capacity: number
          updated_at: string | null
        }[]
      }
      get_invoices_with_customer_names: {
        Args: Record<PropertyKey, never> | { pump_id?: string }
        Returns: {
          id: string
          customer_id: string
          customer_name: string
          date: string
          amount: number
          status: string
          created_at: string
          updated_at: string
        }[]
      }
      get_pump_settings_for_fuel_pump: {
        Args: { pump_id_param: string }
        Returns: {
          created_at: string | null
          fuel_pump_id: string | null
          fuel_types: string[]
          id: string
          nozzle_count: number
          pump_number: string
        }[]
      }
      get_staff_features: {
        Args: { p_auth_id: string }
        Returns: Database["public"]["Enums"]["staff_feature"][]
      }
      get_user_fuel_pump_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_feature_access: {
        Args: { p_auth_id: string; p_feature: string }
        Returns: boolean
      }
      increment: {
        Args: { row_id: string; amount: number }
        Returns: number
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      consumable_allocation_status: "allocated" | "returned"
      staff_feature:
        | "dashboard"
        | "daily_readings"
        | "stock_levels"
        | "tank_unload"
        | "customers"
        | "staff_management"
        | "record_indent"
        | "shift_management"
        | "consumables"
        | "testing"
        | "settings"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      consumable_allocation_status: ["allocated", "returned"],
      staff_feature: [
        "dashboard",
        "daily_readings",
        "stock_levels",
        "tank_unload",
        "customers",
        "staff_management",
        "record_indent",
        "shift_management",
        "consumables",
        "testing",
        "settings",
      ],
    },
  },
} as const
