import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../../common/errors/error-codes';
import { DomainException } from '../../common/errors/domain.exception';

const ALLOWED_FIELDS = ['displayName'] as const;
const DISPLAY_NAME_LIMIT = 80;

export interface TutorProfileInput {
  displayName: string;
}

export interface TutorProfileRecord {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export class TutorProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Public display name for the authenticated tutor profile.',
    example: 'Jane S.',
    maxLength: DISPLAY_NAME_LIMIT,
  })
  displayName?: string;
}

export class TutorProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: TutorProfileRecord): TutorProfileResponseDto {
    return {
      id: record.id,
      displayName: record.display_name,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export function parseCreateTutorProfileBody(
  value: unknown,
): TutorProfileInput {
  const body = asAllowlistedTutorProfileBody(value);

  return {
    displayName: parseDisplayName(body.displayName),
  };
}

export function parseUpdateTutorProfileBody(
  value: unknown,
): TutorProfileInput {
  const body = asAllowlistedTutorProfileBody(value);

  if (Object.keys(body).length === 0) {
    throw tutorProfileValidationError('Request body must not be empty.');
  }

  return {
    displayName: parseDisplayName(body.displayName),
  };
}

function asAllowlistedTutorProfileBody(
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw tutorProfileValidationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !(ALLOWED_FIELDS as readonly string[]).includes(key),
  );

  if (rejectedFields.length > 0) {
    throw tutorProfileValidationError(
      'Request contains fields outside the tutor profile allowlist.',
      { allowedFields: [...ALLOWED_FIELDS], rejectedFields },
    );
  }

  return body;
}

function parseDisplayName(value: unknown): string {
  if (typeof value !== 'string') {
    throw tutorProfileValidationError(
      'displayName is required and must be a string.',
    );
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw tutorProfileValidationError('displayName must not be empty.');
  }

  if (trimmed.length > DISPLAY_NAME_LIMIT) {
    throw tutorProfileValidationError(
      `displayName must be at most ${DISPLAY_NAME_LIMIT} characters.`,
    );
  }

  return trimmed;
}

function tutorProfileValidationError(
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
