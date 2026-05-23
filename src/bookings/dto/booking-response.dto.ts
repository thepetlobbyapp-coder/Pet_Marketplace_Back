import { ApiProperty } from '@nestjs/swagger';
import {
  BOOKING_STATUSES,
  type BookingRecord,
  type BookingStatus,
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

  @ApiProperty()
  service!: string;

  @ApiProperty({ enum: BOOKING_STATUSES })
  status!: BookingStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  static fromRecord(record: BookingRecord): BookingResponseDto {
    return {
      id: record.id,
      providerId: record.provider_id,
      petId: record.pet_id,
      date: record.booking_date,
      timeSlotId: record.time_slot_id,
      service: record.service_label,
      status: record.status,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }
}
