import { ApiProperty } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  parseDateField,
  parseServiceField,
  parseTimeSlotField,
  parseTimeSlotIdsField,
  parseUuidField,
  bookingValidationError,
  BOOKING_TIME_SLOTS,
  type BookingTimeSlot,
} from './booking-fields';

/** Entrada validada para criar uma reserva do tutor autenticado. */
export interface CreateBookingInput {
  providerId: string;
  date: string;
  timeSlotIds: BookingTimeSlot[];
  timeSlotId: BookingTimeSlot;
  petId: string;
  service: string;
}

const CREATE_BOOKING_ALLOWED_FIELDS = [
  'providerId',
  'date',
  'timeSlotIds',
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

  @ApiProperty({
    enum: BOOKING_TIME_SLOTS,
    isArray: true,
    example: ['09:00', '10:00'],
  })
  timeSlotIds!: BookingTimeSlot[];

  @ApiProperty({ format: 'uuid' })
  petId!: string;

  @ApiProperty({ maxLength: 160, example: 'Dog walking · 30 min' })
  service!: string;
}

export function parseCreateBookingBody(value: unknown): CreateBookingInput {
  const body = asAllowlistedBody(value, CREATE_BOOKING_ALLOWED_FIELDS);

  for (const field of ['providerId', 'date', 'petId', 'service'] as const) {
    if (!(field in body)) {
      throw bookingValidationError(`${field} is required.`);
    }
  }

  if (!('timeSlotId' in body) && !('timeSlotIds' in body)) {
    throw bookingValidationError('timeSlotIds is required.');
  }

  const timeSlotIds =
    'timeSlotIds' in body
      ? parseTimeSlotIdsField(body.timeSlotIds)
      : [parseTimeSlotField(body.timeSlotId)];

  return {
    providerId: parseUuidField(body.providerId, 'providerId'),
    date: parseDateField(body.date),
    timeSlotIds,
    timeSlotId: timeSlotIds[0]!,
    petId: parseUuidField(body.petId, 'petId'),
    service: parseServiceField(body.service),
  };
}
