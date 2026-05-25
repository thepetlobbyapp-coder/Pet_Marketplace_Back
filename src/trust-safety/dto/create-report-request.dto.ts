import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  asAllowlistedTrustSafetyBody,
  parseReportCategory,
  parseReportDescription,
  parseReportTargetType,
  parseTrustSafetyUuid,
  type ReportCategory,
  type ReportTargetType,
} from './trust-safety-fields';

export interface CreateReportInput {
  category: ReportCategory;
  description: string | null;
  targetId: string;
  targetType: ReportTargetType;
}

const CREATE_REPORT_ALLOWED_FIELDS = [
  'targetType',
  'targetId',
  'category',
  'description',
] as const;

export class CreateReportRequestDto {
  @ApiProperty({ enum: ['conversation', 'message'] })
  targetType!: ReportTargetType;

  @ApiProperty({ format: 'uuid' })
  targetId!: string;

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

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  description?: string | null;
}

export function parseCreateReportBody(value: unknown): CreateReportInput {
  const body = asAllowlistedTrustSafetyBody(
    value,
    CREATE_REPORT_ALLOWED_FIELDS,
  );

  return {
    targetType: parseReportTargetType(body.targetType),
    targetId: parseTrustSafetyUuid(body.targetId, 'targetId'),
    category: parseReportCategory(body.category),
    description: parseReportDescription(body.description),
  };
}
