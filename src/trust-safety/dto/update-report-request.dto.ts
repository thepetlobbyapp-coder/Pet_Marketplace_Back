import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  asAllowlistedTrustSafetyBody,
  parseAdminInternalNote,
  parseReportStatus,
  type ReportStatus,
} from './trust-safety-fields';

export interface UpdateReportInput {
  internalNote: string | null;
  status: ReportStatus;
}

const UPDATE_REPORT_ALLOWED_FIELDS = ['status', 'internalNote'] as const;

export class UpdateReportRequestDto {
  @ApiPropertyOptional({
    enum: ['open', 'in_review', 'action_taken', 'dismissed', 'closed'],
  })
  status!: ReportStatus;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true })
  internalNote?: string | null;
}

export function parseUpdateReportBody(value: unknown): UpdateReportInput {
  const body = asAllowlistedTrustSafetyBody(
    value,
    UPDATE_REPORT_ALLOWED_FIELDS,
  );

  return {
    status: parseReportStatus(body.status),
    internalNote: parseAdminInternalNote(body.internalNote),
  };
}
