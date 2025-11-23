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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      batch_items: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          quantity_grams: number | null
          quantity_kg: number | null
          raw_material_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          quantity_grams?: number | null
          quantity_kg?: number | null
          raw_material_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          quantity_grams?: number | null
          quantity_kg?: number | null
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_orders_log: {
        Row: {
          batch_id: string | null
          batch_items_snapshot: Json | null
          batch_name: string
          batch_number: string | null
          created_at: string
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          batch_id?: string | null
          batch_items_snapshot?: Json | null
          batch_name: string
          batch_number?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          batch_id?: string | null
          batch_items_snapshot?: Json | null
          batch_name?: string
          batch_number?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_orders_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_details: string | null
          batch_name: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          batch_details?: string | null
          batch_name: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          batch_details?: string | null
          batch_name?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bluetooth_printers: {
        Row: {
          connection_count: number | null
          created_at: string
          device_id: string | null
          id: string
          is_primary: boolean | null
          last_connected: number
          printer_name: string
          service_uuids: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_count?: number | null
          created_at?: string
          device_id?: string | null
          id?: string
          is_primary?: boolean | null
          last_connected: number
          printer_name: string
          service_uuids?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_count?: number | null
          created_at?: string
          device_id?: string | null
          id?: string
          is_primary?: boolean | null
          last_connected?: number
          printer_name?: string
          service_uuids?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      distributor_settings: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          mobile_number: string | null
          signature_header: string | null
          signature_name: string | null
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          mobile_number?: string | null
          signature_header?: string | null
          signature_name?: string | null
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          mobile_number?: string | null
          signature_header?: string | null
          signature_name?: string | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          created_at: string
          date: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          reason: string
          reference: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          reason: string
          reference?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          reason?: string
          reference?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      material_variants: {
        Row: {
          created_at: string
          id: string
          material_id: string
          updated_at: string
          variant_name: string
          variant_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          updated_at?: string
          variant_name: string
          variant_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          updated_at?: string
          variant_name?: string
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_variants_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          description: string | null
          has_variants: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_variants?: boolean
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          has_variants?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      parties: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          location_link: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          location_link?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          location_link?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_raw_materials: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_grams: number
          raw_material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_grams?: number
          raw_material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_grams?: number
          raw_material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_raw_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_raw_materials_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          hsn: string | null
          id: string
          image_url: string | null
          is_active: boolean
          mrp: number
          name: string
          price: number
          sku: string
          stock_quantity: number
          tax_rate: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hsn?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          mrp?: number
          name: string
          price?: number
          sku: string
          stock_quantity?: number
          tax_rate?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hsn?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          mrp?: number
          name?: string
          price?: number
          sku?: string
          stock_quantity?: number
          tax_rate?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_invoice_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          price: number
          product_id: string
          product_name: string
          purchase_invoice_id: string
          quantity: number
          tax_rate: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          price: number
          product_id: string
          product_name: string
          purchase_invoice_id: string
          quantity: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          product_name?: string
          purchase_invoice_id?: string
          quantity?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          created_at: string
          date: string
          id: string
          invoice_number: string
          notes: string | null
          purchase_order_id: string | null
          status: string
          subtotal: number
          supplier_id: string
          supplier_name: string
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          invoice_number: string
          notes?: string | null
          purchase_order_id?: string | null
          status?: string
          subtotal?: number
          supplier_id: string
          supplier_name: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          purchase_order_id?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          supplier_name?: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          price: number
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tax_rate: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          price: number
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          date: string
          expected_date: string | null
          id: string
          notes: string | null
          order_number: string
          status: string
          subtotal: number
          supplier_id: string
          supplier_name: string
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          status?: string
          subtotal?: number
          supplier_id: string
          supplier_name: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          supplier_name?: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_stock_transactions: {
        Row: {
          created_at: string | null
          id: string
          material_id: string
          notes: string | null
          quantity: number
          reference_number: string | null
          total_value: number | null
          transaction_date: string | null
          transaction_type: string
          unit_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id: string
          notes?: string | null
          quantity: number
          reference_number?: string | null
          total_value?: number | null
          transaction_date?: string | null
          transaction_type: string
          unit_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string
          notes?: string | null
          quantity?: number
          reference_number?: string | null
          total_value?: number | null
          transaction_date?: string | null
          transaction_type?: string
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_stock_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_material_usage: {
        Row: {
          created_at: string
          entered_by: string | null
          id: string
          notes: string | null
          raw_material_id: string
          raw_material_name: string
          total_used_grams: number | null
          usage_date: string
          used_grams: number
          used_kg: number
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          id?: string
          notes?: string | null
          raw_material_id: string
          raw_material_name: string
          total_used_grams?: number | null
          usage_date?: string
          used_grams?: number
          used_kg?: number
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          id?: string
          notes?: string | null
          raw_material_id?: string
          raw_material_name?: string
          total_used_grams?: number | null
          usage_date?: string
          used_grams?: number
          used_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "raw_material_usage_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          created_at: string
          current_stock_grams: number
          current_stock_kg: number
          display_name: string | null
          id: string
          material_id: string | null
          material_variant_id: string | null
          minimum_stock_grams: number | null
          minimum_stock_kg: number | null
          name: string
          total_stock_grams: number | null
          unit_cost_per_kg: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock_grams?: number
          current_stock_kg?: number
          display_name?: string | null
          id?: string
          material_id?: string | null
          material_variant_id?: string | null
          minimum_stock_grams?: number | null
          minimum_stock_kg?: number | null
          name: string
          total_stock_grams?: number | null
          unit_cost_per_kg?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock_grams?: number
          current_stock_kg?: number
          display_name?: string | null
          id?: string
          material_id?: string | null
          material_variant_id?: string | null
          minimum_stock_grams?: number | null
          minimum_stock_kg?: number | null
          name?: string
          total_stock_grams?: number | null
          unit_cost_per_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_materials_material_variant_id_fkey"
            columns: ["material_variant_id"]
            isOneToOne: false
            referencedRelation: "material_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials_inventory: {
        Row: {
          category: string | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          id: string
          last_restocked_at: string | null
          material_code: string | null
          material_name: string
          maximum_stock_level: number | null
          minimum_stock_level: number | null
          storage_location: string | null
          supplier_contact: string | null
          supplier_name: string | null
          unit_of_measurement: string
          unit_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          last_restocked_at?: string | null
          material_code?: string | null
          material_name: string
          maximum_stock_level?: number | null
          minimum_stock_level?: number | null
          storage_location?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit_of_measurement: string
          unit_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          last_restocked_at?: string | null
          material_code?: string | null
          material_name?: string
          maximum_stock_level?: number | null
          minimum_stock_level?: number | null
          storage_location?: string | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit_of_measurement?: string
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      replacement_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          product_id: string
          product_name: string
          quantity: number
          reason: string | null
          replacement_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          product_id: string
          product_name: string
          quantity?: number
          reason?: string | null
          replacement_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          reason?: string | null
          replacement_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          party_id: string
          party_name: string
          product_id: string
          product_name: string
          quantity_returned: number
          reason: string | null
          return_number: string
          status: string
          total_amount: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          party_id: string
          party_name: string
          product_id: string
          product_name: string
          quantity_returned: number
          reason?: string | null
          return_number: string
          status?: string
          total_amount?: number | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          party_id?: string
          party_name?: string
          product_id?: string
          product_name?: string
          quantity_returned?: number
          reason?: string | null
          return_number?: string
          status?: string
          total_amount?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_invoice_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          mrp: number | null
          price: number
          product_id: string
          product_name: string
          quantity: number
          tax_rate: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          mrp?: number | null
          price: number
          product_id: string
          product_name: string
          quantity: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          mrp?: number | null
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          date: string
          discount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          other_charges: number | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          date?: string
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          other_charges?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          date?: string
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          other_charges?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_printers: {
        Row: {
          connection_metadata: Json | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last_connected: string | null
          printer_device_id: string | null
          printer_mac: string
          printer_name: string
          status: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_metadata?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_connected?: string | null
          printer_device_id?: string | null
          printer_mac: string
          printer_name: string
          status?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_metadata?: Json | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_connected?: string | null
          printer_device_id?: string | null
          printer_mac?: string
          printer_name?: string
          status?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      deduct_inventory_for_batch_order: {
        Args: {
          p_batch_id: string
          p_batch_items_snapshot: Json
          p_batch_name: string
          p_batch_number: string
          p_user_id: string
          p_user_name: string
        }
        Returns: Json
      }
      deduct_inventory_for_invoice: {
        Args: { invoice_id: string }
        Returns: undefined
      }
      get_distributor_invoice_items: {
        Args: { p_invoice_id: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          mrp: number
          price: number
          product_id: string
          product_name: string
          quantity: number
          tax_rate: number
        }[]
      }
      get_distributor_invoices: {
        Args: { distributor_user_id: string }
        Returns: {
          created_at: string
          created_by: string
          customer_id: string
          customer_name: string
          date: string
          discount: number
          due_date: string
          id: string
          invoice_number: string
          notes: string
          other_charges: number
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }[]
      }
      get_product_recipes: {
        Args: never
        Returns: {
          product_id: string
          recipe_count: number
          recipe_details: string
        }[]
      }
      get_user_department_role: { Args: { dept_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_only: { Args: never; Returns: boolean }
      is_admin_or_superadmin: { Args: never; Returns: boolean }
      is_distributor: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      safe_delete_product: { Args: { product_uuid: string }; Returns: boolean }
      update_overdue_invoices: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "superadmin" | "distributor"
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
      app_role: ["superadmin", "distributor"],
    },
  },
} as const
