import type {
  ProviderStatus,
  Role,
  UserStatus,
} from '../../common/auth/auth-user';
import type { BookingStatus } from '../../bookings/dto/booking-fields';

export interface AdminDashboardBookingStatusCountsRecord {
  readonly requested: number;
  readonly confirmed: number;
  readonly cancelled: number;
  readonly completed: number;
}

export interface AdminDashboardRecord {
  readonly total_users: number;
  readonly total_tutors: number;
  readonly total_providers: number;
  readonly bookings_by_status: AdminDashboardBookingStatusCountsRecord;
  readonly open_reports: number;
  readonly blocked_users: number;
}

export interface AdminUserRecord {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly Role[];
  readonly status: UserStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AdminProviderRecord {
  readonly id: string;
  readonly display_name: string;
  readonly status: ProviderStatus;
  readonly service_count: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AdminBookingRecord {
  readonly id: string;
  readonly service_label: string;
  readonly booking_date: string;
  readonly time_slot_id: string;
  readonly status: BookingStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AdminAuditLogRecord {
  readonly id: string;
  readonly actor_user_id: string | null;
  readonly action: string;
  readonly target_type: string | null;
  readonly target_id: string | null;
  readonly created_at: string;
}
