import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BOOKING_STATUSES,
  type BookingRecord,
  type BookingStatus,
  type BookingViewerRole,
  type BookingPerspective,
} from './booking-fields';

/**
 * Contrato seguro de uma reserva (Bloco 4G).
 * Não expõe `tutor_profile_id` e — por design da Fase 1 — não há nenhum
 * campo de pagamento, preço, custódia ou proteção financeira.
 */
export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ format: 'uuid' })
  petId!: string;

  @ApiProperty({ format: 'date' })
  date!: string;

  @ApiProperty({ example: '09:00' })
  timeSlotId!: string;

  @ApiProperty({ example: ['09:00', '10:00'], isArray: true })
  timeSlotIds!: string[];

  @ApiProperty()
  service!: string;

  @ApiProperty({ enum: BOOKING_STATUSES })
  status!: BookingStatus;

  @ApiPropertyOptional({ enum: ['tutor', 'provider', 'both'], nullable: true })
  viewerRole?: BookingViewerRole | null;

  @ApiPropertyOptional({ nullable: true })
  providerName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  tutorName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  petName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  counterpartName?: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uri' })
  counterpartAvatarUrl?: string | null;

  @ApiPropertyOptional({ enum: ['tutor', 'provider'], nullable: true })
  counterpartRole?: BookingPerspective | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Opaque grouping key for same participant, pet and day.',
  })
  bookingGroupKey?: string | null;

  @ApiProperty({ example: 18.5, nullable: true })
  pricePerHourSnapshot!: number | null;

  @ApiProperty({ example: 37, nullable: true })
  estimatedTotalAmount!: number | null;

  @ApiProperty({ example: 'GBP' })
  currency!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: BookingRecord): BookingResponseDto {
    const response: BookingResponseDto = {
      id: record.id,
      providerId: record.provider_id,
      petId: record.pet_id,
      date: record.booking_date,
      timeSlotId: record.time_slot_id,
      timeSlotIds: record.time_slot_ids?.length
        ? record.time_slot_ids
        : [record.time_slot_id],
      service: record.service_label,
      status: record.status,
      pricePerHourSnapshot: toNullableNumber(record.price_per_hour_snapshot),
      estimatedTotalAmount: toNullableNumber(record.estimated_total_amount),
      currency: record.currency ?? 'GBP',
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };

    if (record.viewer_role) response.viewerRole = record.viewer_role;
    if (record.provider_name !== undefined) {
      response.providerName = record.provider_name;
    }
    if (record.tutor_name !== undefined) response.tutorName = record.tutor_name;
    if (record.pet_name !== undefined) response.petName = record.pet_name;
    if (record.counterpart_name !== undefined) {
      response.counterpartName = record.counterpart_name;
    }
    if (record.counterpart_avatar_url !== undefined) {
      response.counterpartAvatarUrl = record.counterpart_avatar_url;
    }
    if (record.counterpart_role !== undefined) {
      response.counterpartRole = record.counterpart_role;
    }
    if (record.booking_group_key !== undefined) {
      response.bookingGroupKey = record.booking_group_key;
    }

    return response;
  }
}

export class BookingListResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  items!: BookingResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: BookingRecord[],
    nextCursor: string | null,
  ): BookingListResponseDto {
    return {
      items: records.map((record) => BookingResponseDto.fromRecord(record)),
      nextCursor,
    };
  }
}

function toNullableNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
