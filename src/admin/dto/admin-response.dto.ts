import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  AdminAuditLogRecord,
  AdminBookingRecord,
  AdminDashboardBookingStatusCountsRecord,
  AdminDashboardRecord,
  AdminProviderRecord,
  AdminUserRecord,
} from './admin-records';

export class AdminDashboardBookingStatusCountsDto {
  @ApiProperty()
  requested!: number;

  @ApiProperty()
  confirmed!: number;

  @ApiProperty()
  cancelled!: number;

  @ApiProperty()
  completed!: number;

  static fromRecord(
    record: AdminDashboardBookingStatusCountsRecord,
  ): AdminDashboardBookingStatusCountsDto {
    return {
      cancelled: record.cancelled,
      completed: record.completed,
      confirmed: record.confirmed,
      requested: record.requested,
    };
  }
}

export class AdminDashboardResponseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  totalTutors!: number;

  @ApiProperty()
  totalProviders!: number;

  @ApiProperty({ type: AdminDashboardBookingStatusCountsDto })
  bookingsByStatus!: AdminDashboardBookingStatusCountsDto;

  @ApiProperty()
  openReports!: number;

  @ApiProperty()
  blockedUsers!: number;

  static fromRecord(record: AdminDashboardRecord): AdminDashboardResponseDto {
    return {
      blockedUsers: record.blocked_users,
      bookingsByStatus: AdminDashboardBookingStatusCountsDto.fromRecord(
        record.bookings_by_status,
      ),
      openReports: record.open_reports,
      totalProviders: record.total_providers,
      totalTutors: record.total_tutors,
      totalUsers: record.total_users,
    };
  }
}

export class AdminUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ['tutor', 'provider', 'admin'], isArray: true })
  roles!: string[];

  @ApiProperty({ enum: ['active', 'blocked', 'deleted'] })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: AdminUserRecord): AdminUserResponseDto {
    return {
      createdAt: record.created_at,
      email: record.email,
      id: record.id,
      roles: [...record.roles],
      status: record.status,
      updatedAt: record.updated_at,
    };
  }
}

export class AdminProviderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['active', 'paused', 'blocked', 'deleted'] })
  status!: string;

  @ApiProperty()
  serviceCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: AdminProviderRecord): AdminProviderResponseDto {
    return {
      createdAt: record.created_at,
      displayName: record.display_name,
      id: record.id,
      serviceCount: record.service_count,
      status: record.status,
      updatedAt: record.updated_at,
    };
  }
}

export class AdminBookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  service!: string;

  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty({ example: '09:00' })
  timeSlotId!: string;

  @ApiProperty({ enum: ['requested', 'confirmed', 'cancelled', 'completed'] })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: AdminBookingRecord): AdminBookingResponseDto {
    return {
      createdAt: record.created_at,
      date: record.booking_date,
      id: record.id,
      service: record.service_label,
      status: record.status,
      timeSlotId: record.time_slot_id,
      updatedAt: record.updated_at,
    };
  }
}

export class AdminAuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ApiProperty()
  action!: string;

  @ApiPropertyOptional({ nullable: true })
  targetType!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  targetId!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  static fromRecord(record: AdminAuditLogRecord): AdminAuditLogResponseDto {
    return {
      action: record.action,
      actorUserId: record.actor_user_id,
      createdAt: record.created_at,
      id: record.id,
      targetId: record.target_id,
      targetType: record.target_type,
    };
  }
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] })
  items!: AdminUserResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: AdminUserRecord[],
    nextCursor: string | null,
  ): AdminUserListResponseDto {
    return {
      items: records.map((record) => AdminUserResponseDto.fromRecord(record)),
      nextCursor,
    };
  }
}

export class AdminProviderListResponseDto {
  @ApiProperty({ type: [AdminProviderResponseDto] })
  items!: AdminProviderResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: AdminProviderRecord[],
    nextCursor: string | null,
  ): AdminProviderListResponseDto {
    return {
      items: records.map((record) =>
        AdminProviderResponseDto.fromRecord(record),
      ),
      nextCursor,
    };
  }
}

export class AdminBookingListResponseDto {
  @ApiProperty({ type: [AdminBookingResponseDto] })
  items!: AdminBookingResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: AdminBookingRecord[],
    nextCursor: string | null,
  ): AdminBookingListResponseDto {
    return {
      items: records.map((record) => AdminBookingResponseDto.fromRecord(record)),
      nextCursor,
    };
  }
}

export class AdminAuditLogListResponseDto {
  @ApiProperty({ type: [AdminAuditLogResponseDto] })
  items!: AdminAuditLogResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: AdminAuditLogRecord[],
    nextCursor: string | null,
  ): AdminAuditLogListResponseDto {
    return {
      items: records.map((record) =>
        AdminAuditLogResponseDto.fromRecord(record),
      ),
      nextCursor,
    };
  }
}
