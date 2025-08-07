import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          theatre_name: string;
          event_type: 'Play' | 'Musical' | 'Comedy' | 'Drama' | 'Children' | 'Opera' | 'Dance' | 'Other';
          date: string;
          time: string;
          description: string | null;
          website_url: string | null;
          ticket_url: string | null;
          venue: string | null;
          price: string | null;
          sign_language_interpreting: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          theatre_name: string;
          event_type: 'Play' | 'Musical' | 'Comedy' | 'Drama' | 'Children' | 'Opera' | 'Dance' | 'Other';
          date: string;
          time: string;
          description?: string | null;
          website_url?: string | null;
          ticket_url?: string | null;
          venue?: string | null;
          price?: string | null;
          sign_language_interpreting?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          theatre_name?: string;
          event_type?: 'Play' | 'Musical' | 'Comedy' | 'Drama' | 'Children' | 'Opera' | 'Dance' | 'Other';
          date?: string;
          time?: string;
          description?: string | null;
          website_url?: string | null;
          ticket_url?: string | null;
          venue?: string | null;
          price?: string | null;
          sign_language_interpreting?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      theatres: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          address: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};