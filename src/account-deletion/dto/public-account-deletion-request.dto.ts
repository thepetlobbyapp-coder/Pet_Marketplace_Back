import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

const ALLOWED_FIELDS = ['email', 'confirm', 'responseMode'] as const;
const EMAIL_LIMIT = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PublicAccountDeletionRequestInput {
  email: string;
  responseMode: 'json' | 'web';
}

export class PublicAccountDeletionRequestDto {
  @ApiProperty({
    description: 'Email address used for the account on The Pet Lobby.',
    example: 'user@example.com',
    maxLength: EMAIL_LIMIT,
  })
  email!: string;

  @ApiProperty({
    description:
      'Must be true to confirm this is an account deletion request.',
    example: true,
  })
  confirm!: boolean | string;

  @ApiPropertyOptional({
    description: 'Internal form mode used by the public web page.',
    enum: ['web'],
  })
  responseMode?: string;
}

export class PublicAccountDeletionRequestResponseDto {
  @ApiProperty({ example: true })
  received!: true;

  @ApiProperty({
    example:
      'If the email belongs to an account on The Pet Lobby, the deletion request has been received.',
  })
  message!: string;

  @ApiProperty({ example: 30 })
  estimatedProcessingDays!: number;

  static accepted(): PublicAccountDeletionRequestResponseDto {
    return {
      received: true,
      message:
        'If the email belongs to an account on The Pet Lobby, the deletion request has been received.',
      estimatedProcessingDays: 30,
    };
  }
}

export function readPublicDeletionResponseMode(value: unknown): 'json' | 'web' {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'json';
  }

  const mode = (value as Record<string, unknown>).responseMode;
  return mode === 'web' ? 'web' : 'json';
}

export function parsePublicAccountDeletionRequestBody(
  value: unknown,
): PublicAccountDeletionRequestInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !(ALLOWED_FIELDS as readonly string[]).includes(key),
  );

  if (rejectedFields.length > 0) {
    throw validationError(
      'Request contains fields outside the account deletion allowlist.',
      { allowedFields: [...ALLOWED_FIELDS], rejectedFields },
    );
  }

  const email = parseEmail(body.email);
  const confirmed = parseConfirmation(body.confirm);
  if (!confirmed) {
    throw validationError('Deletion request confirmation is required.');
  }

  return {
    email,
    responseMode: readPublicDeletionResponseMode(body),
  };
}

function parseEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw validationError('email is required and must be a string.');
  }

  const normalised = value.trim().toLowerCase();
  if (
    !normalised ||
    normalised.length > EMAIL_LIMIT ||
    !EMAIL_PATTERN.test(normalised)
  ) {
    throw validationError('email must be a valid email address.');
  }

  return normalised;
}

function parseConfirmation(value: unknown): boolean {
  return (
    value === true ||
    value === 'true' ||
    value === 'on' ||
    value === '1'
  );
}

function validationError(
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
