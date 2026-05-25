import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REPORT_DESCRIPTION_MAX_LENGTH = 1000;
const ADMIN_NOTE_MAX_LENGTH = 1000;

export type ReportTargetType = 'conversation' | 'message';
export type ReportCategory =
  | 'safety_concern'
  | 'inappropriate_behaviour'
  | 'harassment'
  | 'spam_scam'
  | 'no_show'
  | 'other';
export type ReportStatus =
  | 'open'
  | 'in_review'
  | 'action_taken'
  | 'dismissed'
  | 'closed';

export interface ReportRecord {
  id: string;
  status: ReportStatus;
  category: ReportCategory;
  target_type: ReportTargetType;
  target_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserBlockRecord {
  id: string;
  blocked_user_id: string;
  conversation_id: string | null;
  created_at: string;
}

const REPORT_TARGET_TYPES: readonly ReportTargetType[] = [
  'conversation',
  'message',
];
const REPORT_CATEGORIES: readonly ReportCategory[] = [
  'safety_concern',
  'inappropriate_behaviour',
  'harassment',
  'spam_scam',
  'no_show',
  'other',
];
const REPORT_STATUSES: readonly ReportStatus[] = [
  'open',
  'in_review',
  'action_taken',
  'dismissed',
  'closed',
];

export function trustSafetyValidationError(
  message: string,
  details: Record<string, unknown> = {},
): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    message,
    details,
    HttpStatus.BAD_REQUEST,
  );
}

export function trustSafetyNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Trust and safety target not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}

export function conversationBlocked(): DomainException {
  return new DomainException(
    ErrorCode.FORBIDDEN,
    'This conversation is blocked.',
    {},
    HttpStatus.FORBIDDEN,
  );
}

export function parseTrustSafetyUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw trustSafetyValidationError(`${label} must be a valid UUID.`);
  }
  return value;
}

export function asAllowlistedTrustSafetyBody(
  value: unknown,
  allowedFields: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw trustSafetyValidationError('Request body must be an object.');
  }
  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key),
  );
  if (rejectedFields.length > 0) {
    throw trustSafetyValidationError(
      'Request contains fields outside the trust and safety allowlist.',
      { allowedFields: [...allowedFields], rejectedFields },
    );
  }
  return body;
}

export function parseReportTargetType(value: unknown): ReportTargetType {
  if (
    typeof value !== 'string' ||
    !REPORT_TARGET_TYPES.includes(value as ReportTargetType)
  ) {
    throw trustSafetyValidationError(
      'targetType must be conversation or message.',
      { allowedValues: [...REPORT_TARGET_TYPES] },
    );
  }
  return value as ReportTargetType;
}

export function parseReportCategory(value: unknown): ReportCategory {
  if (
    typeof value !== 'string' ||
    !REPORT_CATEGORIES.includes(value as ReportCategory)
  ) {
    throw trustSafetyValidationError('category is not supported.', {
      allowedValues: [...REPORT_CATEGORIES],
    });
  }
  return value as ReportCategory;
}

export function parseReportStatus(value: unknown): ReportStatus {
  if (
    typeof value !== 'string' ||
    !REPORT_STATUSES.includes(value as ReportStatus)
  ) {
    throw trustSafetyValidationError('status is not supported.', {
      allowedValues: [...REPORT_STATUSES],
    });
  }
  return value as ReportStatus;
}

export function parseOptionalTrustSafetyText(
  value: unknown,
  label: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw trustSafetyValidationError(`${label} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw trustSafetyValidationError(
      `${label} must be at most ${maxLength} characters.`,
    );
  }
  return trimmed;
}

export function parseReportDescription(value: unknown): string | null {
  return parseOptionalTrustSafetyText(
    value,
    'description',
    REPORT_DESCRIPTION_MAX_LENGTH,
  );
}

export function parseAdminInternalNote(value: unknown): string | null {
  return parseOptionalTrustSafetyText(
    value,
    'internalNote',
    ADMIN_NOTE_MAX_LENGTH,
  );
}
