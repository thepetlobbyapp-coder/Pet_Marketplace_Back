import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ReportCategory,
  ReportRecord,
  ReportStatus,
  ReportTargetType,
} from './trust-safety-fields';

/** Safe report contract. Does not expose report description or private message text. */
export class ReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['open', 'in_review', 'action_taken', 'dismissed', 'closed'],
  })
  status!: ReportStatus;

  @ApiProperty({
    enum: [
      'safety_concern',
      'inappropriate_behaviour',
      'harassment',
      'spam_scam',
      'no_show',
      'other',
    ],
  })
  category!: ReportCategory;

  @ApiProperty({ enum: ['conversation', 'message'] })
  targetType!: ReportTargetType;

  @ApiProperty({ format: 'uuid' })
  targetId!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: ReportRecord): ReportResponseDto {
    return {
      id: record.id,
      status: record.status,
      category: record.category,
      targetType: record.target_type,
      targetId: record.target_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export class ReportListResponseDto {
  @ApiProperty({ type: [ReportResponseDto] })
  items!: ReportResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: ReportRecord[],
    nextCursor: string | null,
  ): ReportListResponseDto {
    return {
      items: records.map((record) => ReportResponseDto.fromRecord(record)),
      nextCursor,
    };
  }
}
