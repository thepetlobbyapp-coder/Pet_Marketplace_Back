import { ApiProperty } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  parseDateField,
  parseServiceField,
  parseTimeSlotField,
  parseUuidField,
  bookingValidationError,
  BOOKING_TIME_SLOTS,
  type BookingTimeSlot,
} from './booking-fields';

/** Entrada validada para criar uma reserva do tutor autenticado. */
export interface CreateBookingInput {
  providerId: string;
  date: string;
  timeSlotId: BookingTimeSlot;
  petId: string;
  service: string;
}

const CREATE_BOOKING_ALLOWED_FIELDS = [
  'providerId',
  'date',
  'timeSlotId',
  'petId',
  'service',
] as const;

export class CreateBookingRequestDto {
  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiProperty({ format: 'date', example: '2026-06-01' })
  date!: string;

  @ApiProperty({ enum: BOOKING_TIME_SLOTS, example: '09:00' })
  timeSlotId!: BookingTimeSlot;

  @ApiProperty({ format: 'uuid' })
  petId!: string;

  @ApiProperty({ maxLength: 160, example: 'Dog walking · 30 min' })
  service!: string;
}

export function parseCreateBookingBody(value: unknown): CreateBookingInput {
  const body = asAllowlistedBody(value, CREATE_BOOKING_ALLOWED_FIELDS);

  for (const field of CREATE_BOOKING_ALLOWED_FIELDS) {
    if (!(field in body)) {
      throw bookingValidationError(`${field} is required.`);
    }
  }

  return {
    providerId: parseUuidField(body.providerId, 'providerId'),
    date: parseDateField(body.date),
    timeSlotId: parseTimeSlotField(body.timeSlotId),
    petId: parseUuidField(body.petId, 'petId'),
    service: parseServiceField(body.service),
  };
}
