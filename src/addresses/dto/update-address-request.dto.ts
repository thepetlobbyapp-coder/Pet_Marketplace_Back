import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ADDRESS_ALLOWED_FIELDS,
  ADDRESS_PRECISIONS,
  addressValidationError,
  asAllowlistedAddressBody,
  parseCountryCode,
  parseLatitude,
  parseLocationPrecision,
  parseLongitude,
  parseOptionalAddressText,
  parseOptionalDefaultFlag,
  type AddressInput,
  type AddressPrecision,
} from './address-fields';

export interface UpdateAddressInput {
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

export class UpdateAddressRequestDto {
  @ApiPropertyOptional({ maxLength: 60, nullable: true })
  label?: string | null;

  @ApiPropertyOptional({ enum: ['GB'] })
  countryCode?: 'GB';

  @ApiPropertyOptional({ maxLength: 120, nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ maxLength: 16, nullable: true })
  postcode?: string | null;

  @ApiPropertyOptional({ maxLength: 160, nullable: true })
  publicAreaLabel?: string | null;

  @ApiPropertyOptional({ minimum: 49, maximum: 61 })
  latitude?: number;

  @ApiPropertyOptional({ minimum: -9, maximum: 2 })
  longitude?: number;

  @ApiPropertyOptional({ enum: ADDRESS_PRECISIONS })
  locationPrecision?: AddressPrecision;

  @ApiPropertyOptional()
  setAsDefaultTutorAddress?: boolean;
}

export function parseUpdateAddressBody(value: unknown): UpdateAddressInput {
  const body = asAllowlistedAddressBody(value);
  const input: AddressInput = {};

  if ('label' in body) input.label = parseOptionalAddressText(body.label, 'label');
  if ('countryCode' in body) input.countryCode = parseCountryCode(body.countryCode);
  if ('city' in body) input.city = parseOptionalAddressText(body.city, 'city');
  if ('postcode' in body) {
    input.postcode = parseOptionalAddressText(body.postcode, 'postcode');
  }
  if ('publicAreaLabel' in body) {
    input.publicAreaLabel = parseOptionalAddressText(
      body.publicAreaLabel,
      'publicAreaLabel',
    );
  }
  if ('latitude' in body) input.latitude = parseLatitude(body.latitude, false);
  if ('longitude' in body) input.longitude = parseLongitude(body.longitude, false);
  if ('locationPrecision' in body) {
    input.locationPrecision = parseLocationPrecision(body.locationPrecision);
  }
  if ('setAsDefaultTutorAddress' in body) {
    input.setAsDefaultTutorAddress = parseOptionalDefaultFlag(
      body.setAsDefaultTutorAddress,
    );
  }

  if (Object.keys(input).length === 0) {
    throw addressValidationError('Request must update at least one address field.', {
      allowedFields: [...ADDRESS_ALLOWED_FIELDS],
    });
  }

  if (('latitude' in input) !== ('longitude' in input)) {
    throw addressValidationError(
      'latitude and longitude must be updated together.',
    );
  }

  if (
    'postcode' in input &&
    'city' in input &&
    'publicAreaLabel' in input &&
    !input.postcode &&
    !input.city &&
    !input.publicAreaLabel
  ) {
    throw addressValidationError(
      'At least one of postcode, city or publicAreaLabel must remain readable.',
    );
  }

  return input;
}
