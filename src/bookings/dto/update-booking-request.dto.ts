import { ApiProperty } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  parseStatusField,
  bookingValidationError,
  BOOKING_STATUSES,
  type BookingStatus,
} from './booking-fields';

/** Entrada validada para alterar o status de uma reserva. */
export interface UpdateBookingInput {
  status: BookingStatus;
}

const UPDATE_BOOKING_ALLOWED_FIELDS = ['status'] as const;

export class UpdateBookingRequestDto {
  @ApiProperty({ enum: BOOKING_STATUSES })
  status!: BookingStatus;
}

export function parseUpdateBookingBody(value: unknown): UpdateBookingInput {
  const body = asAllowlistedBody(value, UPDATE_BOOKING_ALLOWED_FIELDS);

  if (!('status' in body)) {
    throw bookingValidationError('status is required.');
  }

  return { status: parseStatusField(body.status) };
}
