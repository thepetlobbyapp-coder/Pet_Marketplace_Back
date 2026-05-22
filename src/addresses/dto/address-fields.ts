import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

export const ADDRESS_ALLOWED_FIELDS = [
  'label',
  'countryCode',
  'city',
  'postcode',
  'publicAreaLabel',
  'latitude',
  'longitude',
  'locationPrecision',
  'setAsDefaultTutorAddress',
] as const;

export const ADDRESS_PRECISIONS = ['postcode', 'approximate'] as const;
export type AddressPrecision = (typeof ADDRESS_PRECISIONS)[number];
export type StoredAddressPrecision = AddressPrecision | 'exact';

export interface AddressRecord {
  id: string;
  label: string | null;
  country_code: string;
  city: string | null;
  postcode: string | null;
  public_area_label: string | null;
  location_precision: StoredAddressPrecision;
  created_at: string;
  updated_at: string;
}

export interface AddressWithDefaultRecord extends AddressRecord {
  isDefaultTutorAddress: boolean;
}

export interface AddressLocationInput {
  latitude: number;
  longitude: number;
}

export interface AddressInput {
  label?: string | null;
  countryCode?: 'GB';
  city?: string | null;
  postcode?: string | null;
  publicAreaLabel?: string | null;
  latitude?: number;
  longitude?: number;
  locationPrecision?: AddressPrecision;
  setAsDefaultTutorAddress?: boolean;
}

const TEXT_LIMITS = {
  label: 60,
  city: 120,
  postcode: 16,
  publicAreaLabel: 160,
} as const;

export function addressValidationError(
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

export function asAllowlistedAddressBody(
  value: unknown,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw addressValidationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !(ADDRESS_ALLOWED_FIELDS as readonly string[]).includes(key),
  );

  if (rejectedFields.length > 0) {
    throw addressValidationError(
      'Request contains fields outside the address allowlist.',
      { allowedFields: [...ADDRESS_ALLOWED_FIELDS], rejectedFields },
    );
  }

  return body;
}

export function parseOptionalAddressText(
  value: unknown,
  field: keyof typeof TEXT_LIMITS,
): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw addressValidationError(`${field} must be a string or null.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const limit = TEXT_LIMITS[field];
  if (trimmed.length > limit) {
    throw addressValidationError(`${field} must be at most ${limit} characters.`);
  }

  return trimmed;
}

export function parseCountryCode(value: unknown): 'GB' {
  if (value === undefined) return 'GB';
  if (value !== 'GB') {
    throw addressValidationError('countryCode must be GB.');
  }
  return 'GB';
}

export function parseLocationPrecision(
  value: unknown,
  defaultValue: AddressPrecision = 'approximate',
): AddressPrecision {
  if (value === undefined) return defaultValue;
  if (
    typeof value !== 'string' ||
    !(ADDRESS_PRECISIONS as readonly string[]).includes(value)
  ) {
    throw addressValidationError(
      `locationPrecision must be one of: ${ADDRESS_PRECISIONS.join(', ')}.`,
    );
  }
  return value as AddressPrecision;
}

export function parseOptionalDefaultFlag(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') {
    throw addressValidationError('setAsDefaultTutorAddress must be a boolean.');
  }
  return value;
}

export function parseLatitude(value: unknown, required: boolean): number | undefined {
  return parseCoordinate(value, 'latitude', required, 49, 61);
}

export function parseLongitude(
  value: unknown,
  required: boolean,
): number | undefined {
  return parseCoordinate(value, 'longitude', required, -9, 2);
}

export function requireReadableAddress(input: AddressInput): void {
  if (!input.postcode && !input.city && !input.publicAreaLabel) {
    throw addressValidationError(
      'At least one of postcode, city or publicAreaLabel is required.',
    );
  }
}

function parseCoordinate(
  value: unknown,
  field: 'latitude' | 'longitude',
  required: boolean,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined) {
    if (required) throw addressValidationError(`${field} is required.`);
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw addressValidationError(`${field} must be a finite number.`);
  }

  if (value < min || value > max) {
    throw addressValidationError(`${field} is outside the supported UK range.`);
  }

  return value;
}
