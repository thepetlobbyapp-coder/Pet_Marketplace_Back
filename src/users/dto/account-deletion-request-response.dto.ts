import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ACCOUNT_DELETION_REQUEST_STATUSES = [
  'pending',
  'processing',
  'done',
] as const;

export type AccountDeletionRequestStatus =
  (typeof ACCOUNT_DELETION_REQUEST_STATUSES)[number];

export interface AccountDeletionRequestRecord {
  id: string;
  status: AccountDeletionRequestStatus;
  requested_at: string;
  estimated_completion_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

/**
 * Safe account deletion request contract. It intentionally omits `user_id`,
 * internal notes and any deletion job metadata.
 */
export class AccountDeletionRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ACCOUNT_DELETION_REQUEST_STATUSES })
  status!: AccountDeletionRequestStatus;

  @ApiProperty({ format: 'date-time' })
  requestedAt!: string;

  @ApiProperty({ format: 'date-time' })
  estimatedCompletionAt!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  processingStartedAt!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(
    record: AccountDeletionRequestRecord,
  ): AccountDeletionRequestResponseDto {
    return {
      id: record.id,
      status: record.status,
      requestedAt: record.requested_at,
      estimatedCompletionAt: record.estimated_completion_at,
      processingStartedAt: record.processing_started_at,
      completedAt: record.completed_at,
      updatedAt: record.updated_at,
    };
  }
}
