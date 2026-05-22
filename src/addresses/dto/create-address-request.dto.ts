import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ADDRESS_PRECISIONS,
  asAllowlistedAddressBody,
  parseCountryCode,
  parseLatitude,
  parseLocationPrecision,
  parseLongitude,
  parseOptionalAddressText,
  parseOptionalDefaultFlag,
  requireReadableAddress,
  type AddressInput,
  type AddressPrecision,
} from './address-fields';

export interface CreateAddressInput {
  label: string | null;
  countryCode: 'GB';
  city: string | null;
  postcode: string | null;
  publicAreaLabel: string | null;
  latitude: number;
  longitude: number;
  locationPrecision: AddressPrecision;
  setAsDefaultTutorAddress: boolean;
}

export class CreateAddressRequestDto {
  @ApiPropertyOptional({ maxLength: 60, nullable: true, example: 'Home' })
  label?: string | null;

  @ApiPropertyOptional({ enum: ['GB'], default: 'GB' })
  countryCode?: 'GB';

  @ApiPropertyOptional({ maxLength: 120, nullable: true, example: 'London' })
  city?: string | null;

  @ApiPropertyOptional({ maxLength: 16, nullable: true, example: 'SW1A' })
  postcode?: string | null;

  @ApiPropertyOptional({
    maxLength: 160,
    nullable: true,
    example: 'Westminster, London',
  })
  publicAreaLabel?: string | null;

  @ApiProperty({ minimum: 49, maximum: 61 })
  latitude!: number;

  @ApiProperty({ minimum: -9, maximum: 2 })
  longitude!: number;

  @ApiPropertyOptional({ enum: ADDRESS_PRECISIONS, default: 'approximate' })
  locationPrecision?: AddressPrecision;

  @ApiPropertyOptional({ default: false })
  setAsDefaultTutorAddress?: boolean;
}

export function parseCreateAddressBody(value: unknown): CreateAddressInput {
  const body = asAllowlistedAddressBody(value);
  const input: AddressInput = {
    label: 'label' in body ? parseOptionalAddressText(body.label, 'label') : null,
    countryCode: parseCountryCode(body.countryCode),
    city: 'city' in body ? parseOptionalAddressText(body.city, 'city') : null,
    postcode:
      'postcode' in body
        ? parseOptionalAddressText(body.postcode, 'postcode')
        : null,
    publicAreaLabel:
      'publicAreaLabel' in body
        ? parseOptionalAddressText(body.publicAreaLabel, 'publicAreaLabel')
        : null,
    latitude: parseLatitude(body.latitude, true),
    longitude: parseLongitude(body.longitude, true),
    locationPrecision: parseLocationPrecision(body.locationPrecision),
    setAsDefaultTutorAddress: parseOptionalDefaultFlag(
      body.setAsDefaultTutorAddress,
    ),
  };

  requireReadableAddress(input);

  return input as CreateAddressInput;
}
