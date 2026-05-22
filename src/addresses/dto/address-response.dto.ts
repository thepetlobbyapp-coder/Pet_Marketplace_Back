import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ADDRESS_PRECISIONS,
  type AddressPrecision,
  type AddressWithDefaultRecord,
} from './address-fields';

/**
 * Safe own-address contract. It intentionally omits raw PostGIS location,
 * coordinates, full formatted address, user_id and provider linkage.
 */
export class AddressResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  label!: string | null;

  @ApiProperty({ enum: ['GB'] })
  countryCode!: 'GB';

  @ApiPropertyOptional({ nullable: true })
  city!: string | null;

  @ApiPropertyOptional({ nullable: true })
  postcode!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publicAreaLabel!: string | null;

  @ApiProperty({ enum: ADDRESS_PRECISIONS })
  locationPrecision!: AddressPrecision;

  @ApiProperty()
  isDefaultTutorAddress!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: AddressWithDefaultRecord): AddressResponseDto {
    return {
      id: record.id,
      label: record.label,
      countryCode: 'GB',
      city: record.city,
      postcode: record.postcode,
      publicAreaLabel: record.public_area_label,
      locationPrecision:
        record.location_precision === 'postcode' ? 'postcode' : 'approximate',
      isDefaultTutorAddress: record.isDefaultTutorAddress,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
