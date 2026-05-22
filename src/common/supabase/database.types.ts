export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          status: Database['public']['Enums']['user_status'];
          locale: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          status?: Database['public']['Enums']['user_status'];
          locale?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          email?: string;
          phone?: string | null;
          status?: Database['public']['Enums']['user_status'];
          locale?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database['public']['Enums']['profile_type'];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database['public']['Enums']['profile_type'];
          created_at?: string;
        };
        Update: {
          role?: Database['public']['Enums']['profile_type'];
        };
        Relationships: [];
      };
      tutor_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          default_address_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          default_address_id?: string | null;
        };
        Update: {
          display_name?: string;
          default_address_id?: string | null;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          tutor_profile_id: string;
          name: string;
          species: Database['public']['Enums']['pet_species'];
          breed: string | null;
          size: Database['public']['Enums']['pet_size'];
          age_range: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          tutor_profile_id: string;
          name: string;
          species: Database['public']['Enums']['pet_species'];
          breed?: string | null;
          size?: Database['public']['Enums']['pet_size'];
          age_range?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          species?: Database['public']['Enums']['pet_species'];
          breed?: string | null;
          size?: Database['public']['Enums']['pet_size'];
          age_range?: string | null;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      provider_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          bio: string | null;
          base_address_id: string | null;
          service_radius_km: number;
          status: Database['public']['Enums']['provider_status'];
          rating_average: number | null;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          bio?: string | null;
          base_address_id?: string | null;
          service_radius_km?: number;
          status?: Database['public']['Enums']['provider_status'];
          rating_average?: number | null;
          rating_count?: number;
        };
        Update: {
          display_name?: string;
          bio?: string | null;
          base_address_id?: string | null;
          service_radius_km?: number;
          status?: Database['public']['Enums']['provider_status'];
          rating_average?: number | null;
          rating_count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_status: 'active' | 'blocked' | 'deleted';
      profile_type: 'tutor' | 'provider' | 'admin';
      provider_status: 'active' | 'paused' | 'blocked' | 'deleted';
      pet_species: 'dog' | 'cat' | 'other';
      pet_size: 'small' | 'medium' | 'large' | 'giant' | 'unknown';
    };
    CompositeTypes: Record<string, never>;
  };
}
