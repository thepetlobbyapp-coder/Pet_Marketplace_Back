import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import type { UserStatus } from '../../common/auth/auth-user';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UPDATE_ADMIN_USER_STATUS_ALLOWED_FIELDS = ['status'] as const;
const ADMIN_MUTABLE_USER_STATUSES = ['active', 'blocked'] as const;

export type AdminMutableUserStatus = Extract<UserStatus, 'active' | 'blocked'>;

export interface UpdateAdminUserStatusInput {
  status: AdminMutableUserStatus;
}

export class UpdateAdminUserStatusRequestDto {
  @ApiProperty({ enum: ADMIN_MUTABLE_USER_STATUSES })
  status!: AdminMutableUserStatus;
}

export function parseAdminUserId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw adminUserStatusValidationError('user id must be a valid UUID.');
  }
  return value;
}

export function parseUpdateAdminUserStatusBody(
  value: unknown,
): UpdateAdminUserStatusInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw adminUserStatusValidationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !UPDATE_ADMIN_USER_STATUS_ALLOWED_FIELDS.includes(key as 'status'),
  );

  if (rejectedFields.length > 0) {
    throw adminUserStatusValidationError(
      'Request contains fields outside the admin user status allowlist.',
      {
        allowedFields: [...UPDATE_ADMIN_USER_STATUS_ALLOWED_FIELDS],
        rejectedFields,
      },
    );
  }

  if (
    typeof body.status !== 'string' ||
    !ADMIN_MUTABLE_USER_STATUSES.includes(body.status as AdminMutableUserStatus)
  ) {
    throw adminUserStatusValidationError('status is not supported.', {
      allowedValues: [...ADMIN_MUTABLE_USER_STATUSES],
    });
  }

  return { status: body.status as AdminMutableUserStatus };
}

function adminUserStatusValidationError(
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
