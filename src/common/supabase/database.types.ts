export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Privacy-safe row returned by the `providers_list_near` / `providers_get_one`
 * RPCs. `distance_meters` is approximate (rounded to tens of metres) and is
 * null when either the tutor or the provider has no stored location.
 */
export interface ProviderListingRow {
  id: string;
  name: string;
  service_label: string;
  category: 'walk' | 'sitting' | 'transport' | 'boarding';
  avatar_url: string | null;
  rating: number | null;
  review_count: number;
  distance_meters: number | null;
  is_available: boolean;
  price_per_hour: number;
  bio: string | null;
}

export interface ConversationOpenColdStartRow {
  status: 'ok' | 'rate_limited';
  id: string | null;
  provider_id: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  last_message_from_provider: boolean | null;
}

export interface AdminUpdateReportStatusWithAuditRow {
  id: string;
  status: 'open' | 'in_review' | 'action_taken' | 'dismissed' | 'closed';
  category:
    | 'safety_concern'
    | 'inappropriate_behaviour'
    | 'harassment'
    | 'spam_scam'
    | 'no_show'
    | 'other';
  target_type: 'conversation' | 'message';
  target_id: string;
  created_at: string;
  updated_at: string;
}

export interface TutorProfileOnboardingRow {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfileOnboardingRow {
  id: string;
  display_name: string;
  status: 'active' | 'paused' | 'blocked' | 'deleted';
  service_radius_km: number;
  rating_average: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingWithSlotsRow {
  id: string;
  provider_id: string;
  pet_id: string;
  service_label: string;
  booking_date: string;
  time_slot_id: string;
  time_slot_ids: string[];
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
  price_per_hour_snapshot: number;
  estimated_total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

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
          avatar_url: string | null;
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
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          phone?: string | null;
          status?: Database['public']['Enums']['user_status'];
          locale?: string;
          updated_at?: string;
          deleted_at?: string | null;
          avatar_url?: string | null;
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
      account_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          status: Database['public']['Enums']['account_deletion_request_status'];
          requested_at: string;
          estimated_completion_at: string;
          processing_started_at: string | null;
          completed_at: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: Database['public']['Enums']['account_deletion_request_status'];
          requested_at?: string;
          estimated_completion_at?: string;
          processing_started_at?: string | null;
          completed_at?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: Database['public']['Enums']['account_deletion_request_status'];
          estimated_completion_at?: string;
          processing_started_at?: string | null;
          completed_at?: string | null;
          internal_notes?: string | null;
          updated_at?: string;
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
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          country_code: string;
          line1: string | null;
          city: string | null;
          postcode: string | null;
          formatted_address: string | null;
          location: unknown;
          location_precision: Database['public']['Enums']['location_precision'];
          public_area_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          country_code?: string;
          line1?: string | null;
          city?: string | null;
          postcode?: string | null;
          formatted_address?: string | null;
          location: unknown;
          location_precision?: Database['public']['Enums']['location_precision'];
          public_area_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string | null;
          country_code?: string;
          line1?: string | null;
          city?: string | null;
          postcode?: string | null;
          formatted_address?: string | null;
          location?: unknown;
          location_precision?: Database['public']['Enums']['location_precision'];
          public_area_label?: string | null;
          updated_at?: string;
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
      providers: {
        Row: {
          id: string;
          provider_profile_id: string;
          category: Database['public']['Enums']['provider_category'];
          service_label: string;
          avatar_url: string | null;
          price_per_hour: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          provider_profile_id: string;
          category: Database['public']['Enums']['provider_category'];
          service_label: string;
          avatar_url?: string | null;
          price_per_hour: number;
          is_available?: boolean;
        };
        Update: {
          category?: Database['public']['Enums']['provider_category'];
          service_label?: string;
          avatar_url?: string | null;
          price_per_hour?: number;
          is_available?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          tutor_profile_id: string;
          provider_id: string;
          pet_id: string;
          service_label: string;
          booking_date: string;
          time_slot_id: string;
          status: Database['public']['Enums']['booking_status'];
          price_per_hour_snapshot: number;
          estimated_total_amount: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_profile_id: string;
          provider_id: string;
          pet_id: string;
          service_label: string;
          booking_date: string;
          time_slot_id: string;
          status?: Database['public']['Enums']['booking_status'];
          price_per_hour_snapshot?: number;
          estimated_total_amount?: number;
          currency?: string;
        };
        Update: {
          service_label?: string;
          booking_date?: string;
          time_slot_id?: string;
          status?: Database['public']['Enums']['booking_status'];
          price_per_hour_snapshot?: number;
          estimated_total_amount?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      provider_availability_rules: {
        Row: {
          id: string;
          provider_profile_id: string;
          weekday: number;
          time_slot_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_profile_id: string;
          weekday: number;
          time_slot_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          weekday?: number;
          time_slot_id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_slots: {
        Row: {
          id: string;
          booking_id: string;
          provider_id: string;
          booking_date: string;
          time_slot_id: string;
          status: Database['public']['Enums']['booking_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          provider_id: string;
          booking_date: string;
          time_slot_id: string;
          status?: Database['public']['Enums']['booking_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          booking_date?: string;
          time_slot_id?: string;
          status?: Database['public']['Enums']['booking_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          tutor_profile_id: string;
          provider_id: string;
          booking_id: string | null;
          last_message_text: string | null;
          last_message_at: string | null;
          last_message_from_provider: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_profile_id: string;
          provider_id: string;
          booking_id?: string | null;
          last_message_text?: string | null;
          last_message_at?: string | null;
          last_message_from_provider?: boolean;
        };
        Update: {
          booking_id?: string | null;
          last_message_text?: string | null;
          last_message_at?: string | null;
          last_message_from_provider?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          from_provider: boolean;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          from_provider: boolean;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_user_id: string;
          reported_user_id: string | null;
          target_type: 'conversation' | 'message';
          target_id: string;
          conversation_id: string;
          message_id: string | null;
          category: Database['public']['Enums']['report_category'];
          description: string | null;
          status: Database['public']['Enums']['report_status'];
          assigned_admin_id: string | null;
          internal_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_user_id: string;
          reported_user_id?: string | null;
          target_type: 'conversation' | 'message';
          target_id: string;
          conversation_id: string;
          message_id?: string | null;
          category: Database['public']['Enums']['report_category'];
          description?: string | null;
          status?: Database['public']['Enums']['report_status'];
          assigned_admin_id?: string | null;
          internal_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: Database['public']['Enums']['report_status'];
          assigned_admin_id?: string | null;
          internal_note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_user_id: string;
          blocked_user_id: string;
          conversation_id: string | null;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blocker_user_id: string;
          blocked_user_id: string;
          conversation_id?: string | null;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          conversation_id?: string | null;
          reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: unknown;
          created_at?: string;
        };
        Update: {
          actor_user_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: unknown;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_update_report_status_with_audit: {
        Args: {
          p_admin_user_id: string;
          p_report_id: string;
          p_status: Database['public']['Enums']['report_status'];
          p_internal_note: string | null;
        };
        Returns: AdminUpdateReportStatusWithAuditRow[];
      };
      create_booking_with_slots: {
        Args: {
          p_tutor_profile_id: string;
          p_provider_id: string;
          p_pet_id: string;
          p_service_label: string;
          p_booking_date: string;
          p_time_slot_ids: string[];
          p_price_per_hour: number;
          p_currency?: string;
        };
        Returns: CreateBookingWithSlotsRow[];
      };
      providers_list_near: {
        Args: {
          p_user_id: string;
          p_category?: string | null;
          p_search?: string | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: ProviderListingRow[];
      };
      providers_get_one: {
        Args: {
          p_user_id: string;
          p_provider_id: string;
        };
        Returns: ProviderListingRow[];
      };
      conversations_open_cold_start: {
        Args: {
          p_tutor_profile_id: string;
          p_provider_id: string;
          p_limit: number;
          p_window_start: string;
        };
        Returns: ConversationOpenColdStartRow[];
      };
      ensure_tutor_profile: {
        Args: {
          p_user_id: string;
          p_display_name: string;
        };
        Returns: TutorProfileOnboardingRow[];
      };
      ensure_provider_profile: {
        Args: {
          p_user_id: string;
          p_display_name: string;
        };
        Returns: ProviderProfileOnboardingRow[];
      };
    };
    Enums: {
      user_status: 'active' | 'blocked' | 'deleted';
      profile_type: 'tutor' | 'provider' | 'admin';
      account_deletion_request_status: 'pending' | 'processing' | 'done';
      provider_status: 'active' | 'paused' | 'blocked' | 'deleted';
      provider_category: 'walk' | 'sitting' | 'transport' | 'boarding';
      booking_status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
      report_status:
        | 'open'
        | 'in_review'
        | 'action_taken'
        | 'dismissed'
        | 'closed';
      report_category:
        | 'safety_concern'
        | 'inappropriate_behaviour'
        | 'harassment'
        | 'spam_scam'
        | 'no_show'
        | 'other';
      pet_species: 'dog' | 'cat' | 'other';
      pet_size: 'small' | 'medium' | 'large' | 'giant' | 'unknown';
      location_precision: 'exact' | 'postcode' | 'approximate';
    };
    CompositeTypes: Record<string, never>;
  };
}
