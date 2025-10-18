import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'user' | 'admin';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          description: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          capacity?: number;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          status: 'pending' | 'approved' | 'rejected';
          notes: string;
          admin_notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          start_time: string;
          end_time: string;
          status?: 'pending' | 'approved' | 'rejected';
          notes?: string;
          admin_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string;
          status?: 'pending' | 'approved' | 'rejected';
          notes?: string;
          admin_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
