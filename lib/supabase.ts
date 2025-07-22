import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types for database tables
export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'volunteer' | 'vet' | 'viewer';
          location_id: string | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'volunteer' | 'vet' | 'viewer';
          location_id?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'volunteer' | 'vet' | 'viewer';
          location_id?: string | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dogs: {
        Row: {
          id: string;
          name: string;
          status: 'stray' | 'fostered' | 'adopted' | 'deceased';
          gender: 'male' | 'female' | 'unknown';
          location_id: string;
          breed: string | null;
          age: number | null;
          description: string | null;
          last_seen: string | null;
          last_seen_location: string | null;
          medical_notes: string | null;
          is_neutered: boolean;
          is_vaccinated: boolean;
          main_image: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          status: 'stray' | 'fostered' | 'adopted' | 'deceased';
          gender: 'male' | 'female' | 'unknown';
          location_id: string;
          breed?: string | null;
          age?: number | null;
          description?: string | null;
          last_seen?: string | null;
          last_seen_location?: string | null;
          medical_notes?: string | null;
          is_neutered?: boolean;
          is_vaccinated?: boolean;
          main_image?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          status?: 'stray' | 'fostered' | 'adopted' | 'deceased';
          gender?: 'male' | 'female' | 'unknown';
          location_id?: string;
          breed?: string | null;
          age?: number | null;
          description?: string | null;
          last_seen?: string | null;
          last_seen_location?: string | null;
          medical_notes?: string | null;
          is_neutered?: boolean;
          is_vaccinated?: boolean;
          main_image?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          dog_id: string;
          type: 'medical' | 'location' | 'status' | 'note';
          title: string;
          description: string;
          date: string;
          created_by: string;
          is_private: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          dog_id: string;
          type: 'medical' | 'location' | 'status' | 'note';
          title: string;
          description: string;
          date?: string;
          created_by: string;
          is_private?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          dog_id?: string;
          type?: 'medical' | 'location' | 'status' | 'note';
          title?: string;
          description?: string;
          date?: string;
          created_by?: string;
          is_private?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          dog_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          dog_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          content?: string;
          dog_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_1_id: string;
          participant_2_id: string;
          dog_id: string | null;
          last_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_1_id: string;
          participant_2_id: string;
          dog_id?: string | null;
          last_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_1_id?: string;
          participant_2_id?: string;
          dog_id?: string | null;
          last_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}