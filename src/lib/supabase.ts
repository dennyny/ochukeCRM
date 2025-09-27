import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Only throw error if we're not using placeholder values and they're actually missing
if ((!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') && 
    (!supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key')) {
  console.warn('Supabase environment variables not configured. Please set up Supabase connection.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          company: string | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          total_amount: number
          status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          order_date: string
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          customer_id: string
          total_amount: number
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          order_date?: string
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          customer_id?: string
          total_amount?: number
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
          order_date?: string
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          order_id: string
          invoice_number: string
          amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          due_date: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          order_id: string
          invoice_number: string
          amount: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          due_date: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          order_id?: string
          invoice_number?: string
          amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          due_date?: string
          created_at?: string
          user_id?: string
        }
      }
      financial_transactions: {
        Row: {
          id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          transaction_date: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string
          transaction_date: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string
          transaction_date?: string
          created_at?: string
          user_id?: string
        }
      }
    }
  }
}