import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProviderStatus } from '../../common/auth/auth-user';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

const ALLOWED_FIELDS = ['displayName'] as const;
const DISPLAY_NAME_LIMIT = 80;

export interface ProviderProfileInput {
  displayName: string;
}

export interface ProviderProfileRecord {
  id: string;
  display_name: string;
  status: ProviderStatus;
  service_radius_km: number;
  rating_average: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export class ProviderProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Public display name for the authenticated provider profile.',
    example: 'Jane Pet Care',
    maxLength: DISPLAY_NAME_LIMIT,
  })
  displayName?: string;
}

export class ProviderProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['active', 'paused', 'blocked', 'deleted'] })
  status!: ProviderStatus;

  @ApiProperty()
  serviceRadiusKm!: number;

  @ApiPropertyOptional({ nullable: true })
  ratingAverage!: number | null;

  @ApiProperty()
  ratingCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: ProviderProfileRecord): ProviderProfileResponseDto {
    return {
      id: record.id,
      displayName: record.display_name,
      status: record.status,
      serviceRadiusKm: record.service_radius_km,
      ratingAverage: record.rating_average,
      ratingCount: record.rating_count,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}

export function parseCreateProviderProfileBody(
  value: unknown,
): ProviderProfileInput {
  const body = asAllowlistedProviderProfileBody(value);

  return {
    displayName: parseDisplayName(body.displayName),
  };
}

export function parseUpdateProviderProfileBody(
  value: unknown,
): ProviderProfileInput {
  const body = asAllowlistedProviderProfileBody(value);

  if (Object.keys(body).length === 0) {
    throw providerProfileValidationError('Request body must not be empty.');
  }

  return {
    displayName: parseDisplayName(body.displayName),
  };
}

function asAllowlistedProviderProfileBody(
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw providerProfileValidationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !(ALLOWED_FIELDS as readonly string[]).includes(key),
  );

  if (rejectedFields.length > 0) {
    throw providerProfileValidationError(
      'Request contains fields outside the provider profile allowlist.',
      { allowedFields: [...ALLOWED_FIELDS], rejectedFields },
    );
  }

  return body;
}

function parseDisplayName(value: unknown): string {
  if (typeof value !== 'string') {
    throw providerProfileValidationError(
      'displayName is required and must be a string.',
    );
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw providerProfileValidationError('displayName must not be empty.');
  }

  if (trimmed.length > DISPLAY_NAME_LIMIT) {
    throw providerProfileValidationError(
      `displayName must be at most ${DISPLAY_NAME_LIMIT} characters.`,
    );
  }

  return trimmed;
}

function providerProfileValidationError(
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
