import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UPDATE_ADMIN_REVIEW_STATUS_ALLOWED_FIELDS = ['status'] as const;

/** Estados que o admin pode definir: ocultar ou restaurar uma avaliação. */
const ADMIN_MUTABLE_REVIEW_STATUSES = ['visible', 'hidden_by_admin'] as const;

export type AdminMutableReviewStatus =
  (typeof ADMIN_MUTABLE_REVIEW_STATUSES)[number];

export interface UpdateAdminReviewStatusInput {
  status: AdminMutableReviewStatus;
}

export class UpdateAdminReviewStatusRequestDto {
  @ApiProperty({ enum: ADMIN_MUTABLE_REVIEW_STATUSES })
  status!: AdminMutableReviewStatus;
}

export function parseAdminReviewId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw adminReviewStatusValidationError('review id must be a valid UUID.');
  }
  return value;
}

export function parseUpdateAdminReviewStatusBody(
  value: unknown,
): UpdateAdminReviewStatusInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw adminReviewStatusValidationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) =>
      !UPDATE_ADMIN_REVIEW_STATUS_ALLOWED_FIELDS.includes(key as 'status'),
  );

  if (rejectedFields.length > 0) {
    throw adminReviewStatusValidationError(
      'Request contains fields outside the admin review status allowlist.',
      {
        allowedFields: [...UPDATE_ADMIN_REVIEW_STATUS_ALLOWED_FIELDS],
        rejectedFields,
      },
    );
  }

  if (
    typeof body.status !== 'string' ||
    !ADMIN_MUTABLE_REVIEW_STATUSES.includes(
      body.status as AdminMutableReviewStatus,
    )
  ) {
    throw adminReviewStatusValidationError('status is not supported.', {
      allowedValues: [...ADMIN_MUTABLE_REVIEW_STATUSES],
    });
  }

  return { status: body.status as AdminMutableReviewStatus };
}

function adminReviewStatusValidationError(
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
