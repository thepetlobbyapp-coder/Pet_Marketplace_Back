import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../../common/errors/error-codes';
import { DomainException } from '../../common/errors/domain.exception';
import type { ProviderStatus } from '../../common/auth/auth-user';
import {
  PROVIDER_CATEGORIES,
  type ProviderCategory,
} from '../../providers/dto/provider-fields';

const ALLOWED_FIELDS = [
  'baseAddressId',
  'bio',
  'categoryId',
  'displayName',
  'isAvailable',
  'pricePerHour',
  'publish',
  'service',
  'serviceRadiusKm',
] as const;
const DISPLAY_NAME_LIMIT = 80;
const BIO_LIMIT = 600;
const SERVICE_LIMIT = 160;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ProviderProfileInput {
  baseAddressId?: string | null;
  bio?: string | null;
  categoryId?: ProviderCategory;
  displayName?: string;
  isAvailable?: boolean;
  pricePerHour?: number;
  publish?: boolean;
  service?: string;
  serviceRadiusKm?: number;
}

export interface ProviderProfileRecord {
  id: string;
  display_name: string;
  bio: string | null;
  base_address_id: string | null;
  status: ProviderStatus;
  service_radius_km: number;
  rating_average: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
  listing_id?: string | null;
  category?: ProviderCategory | null;
  service_label?: string | null;
  avatar_url?: string | null;
  price_per_hour?: number | null;
  is_available?: boolean | null;
}

export class ProviderProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Public display name for the authenticated provider profile.',
    example: 'Jane Pet Care',
    maxLength: DISPLAY_NAME_LIMIT,
  })
  displayName?: string;

  @ApiPropertyOptional({ maxLength: BIO_LIMIT, nullable: true })
  bio?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  baseAddressId?: string | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 50 })
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ enum: PROVIDER_CATEGORIES })
  categoryId?: ProviderCategory;

  @ApiPropertyOptional({ maxLength: SERVICE_LIMIT })
  service?: string;

  @ApiPropertyOptional({ minimum: 0 })
  pricePerHour?: number;

  @ApiPropertyOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description:
      'When true, publishes the provider if all marketplace fields are present.',
  })
  publish?: boolean;
}

export class ProviderProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiProperty({ enum: ['active', 'paused', 'blocked', 'deleted'] })
  status!: ProviderStatus;

  @ApiProperty()
  serviceRadiusKm!: number;

  @ApiPropertyOptional({ nullable: true })
  ratingAverage!: number | null;

  @ApiProperty()
  ratingCount!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  listingId!: string | null;

  @ApiPropertyOptional({ enum: PROVIDER_CATEGORIES, nullable: true })
  categoryId!: ProviderCategory | null;

  @ApiPropertyOptional({ nullable: true })
  service!: string | null;

  @ApiPropertyOptional({ format: 'uri', nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  pricePerHour!: number | null;

  @ApiPropertyOptional({ nullable: true })
  isAvailable!: boolean | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: ProviderProfileRecord): ProviderProfileResponseDto {
    return {
      id: record.id,
      displayName: record.display_name,
      bio: record.bio,
      status: record.status,
      serviceRadiusKm: toNumber(record.service_radius_km),
      ratingAverage:
        record.rating_average === null ? null : toNumber(record.rating_average),
      ratingCount: Math.max(0, Math.trunc(toNumber(record.rating_count))),
      listingId: record.listing_id ?? null,
      categoryId: record.category ?? null,
      service: record.service_label ?? null,
      avatarUrl: record.avatar_url ?? null,
      pricePerHour:
        record.price_per_hour === undefined || record.price_per_hour === null
          ? null
          : Math.max(0, toNumber(record.price_per_hour)),
      isAvailable: record.is_available ?? null,
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
    ...parseOptionalProviderProfileFields(body),
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
    ...parseOptionalProviderProfileFields(body),
    ...(body.displayName !== undefined
      ? { displayName: parseDisplayName(body.displayName) }
      : {}),
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

function parseOptionalProviderProfileFields(
  body: Record<string, unknown>,
): ProviderProfileInput {
  return {
    ...(body.bio !== undefined
      ? { bio: parseNullableText(body.bio, BIO_LIMIT, 'bio') }
      : {}),
    ...(body.baseAddressId !== undefined
      ? {
          baseAddressId: parseNullableUuid(body.baseAddressId, 'baseAddressId'),
        }
      : {}),
    ...(body.serviceRadiusKm !== undefined
      ? { serviceRadiusKm: parseServiceRadiusKm(body.serviceRadiusKm) }
      : {}),
    ...(body.categoryId !== undefined
      ? { categoryId: parseCategoryId(body.categoryId) }
      : {}),
    ...(body.service !== undefined
      ? { service: parseServiceLabel(body.service) }
      : {}),
    ...(body.pricePerHour !== undefined
      ? { pricePerHour: parsePricePerHour(body.pricePerHour) }
      : {}),
    ...(body.isAvailable !== undefined
      ? { isAvailable: parseBoolean(body.isAvailable, 'isAvailable') }
      : {}),
    ...(body.publish !== undefined
      ? { publish: parseBoolean(body.publish, 'publish') }
      : {}),
  };
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

function parseNullableText(
  value: unknown,
  limit: number,
  field: string,
): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw providerProfileValidationError(`${field} must be a string or null.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > limit) {
    throw providerProfileValidationError(
      `${field} must be at most ${limit} characters.`,
    );
  }
  return trimmed;
}

function parseNullableUuid(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw providerProfileValidationError(`${field} must be a valid UUID.`);
  }
  return value;
}

function parseServiceRadiusKm(value: unknown): number {
  const parsed = toNumber(value);
  if (parsed <= 0 || parsed > 50) {
    throw providerProfileValidationError(
      'serviceRadiusKm must be between 1 and 50.',
    );
  }
  return parsed;
}

function parseCategoryId(value: unknown): ProviderCategory {
  if (
    typeof value !== 'string' ||
    !(PROVIDER_CATEGORIES as readonly string[]).includes(value)
  ) {
    throw providerProfileValidationError(
      `categoryId must be one of: ${PROVIDER_CATEGORIES.join(', ')}.`,
    );
  }
  return value as ProviderCategory;
}

function parseServiceLabel(value: unknown): string {
  if (typeof value !== 'string') {
    throw providerProfileValidationError('service must be a string.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw providerProfileValidationError('service must not be empty.');
  }
  if (trimmed.length > SERVICE_LIMIT) {
    throw providerProfileValidationError(
      `service must be at most ${SERVICE_LIMIT} characters.`,
    );
  }
  return trimmed;
}

function parsePricePerHour(value: unknown): number {
  const parsed = toNumber(value);
  if (parsed < 0 || parsed > 9999) {
    throw providerProfileValidationError(
      'pricePerHour must be between 0 and 9999.',
    );
  }
  return parsed;
}

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw providerProfileValidationError(`${field} must be a boolean.`);
  }
  return value;
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw providerProfileValidationError('Expected a numeric value.');
  }
  return parsed;
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
