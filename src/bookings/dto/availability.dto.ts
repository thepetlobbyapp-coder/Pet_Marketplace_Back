import { ApiProperty } from '@nestjs/swagger';
import {
  parseDateField,
  bookingValidationError,
  BOOKING_TIME_SLOTS,
} from './booking-fields';

/** Filtro validado de `GET /providers/:id/availability`. */
export interface AvailabilityQuery {
  date: string;
}

/** Um horário da grade fixa do prestador. */
export class TimeSlotResponseDto {
  @ApiProperty({ example: '09:00', description: 'Identificador do horário.' })
  id!: string;

  @ApiProperty({ example: '09:00', description: 'Rótulo HH:MM.' })
  label!: string;

  @ApiProperty({ description: 'Falso quando já há reserva ativa no horário.' })
  isAvailable!: boolean;
}

/** Valida a query — `date` é obrigatório e deve ser `YYYY-MM-DD`. */
export function parseAvailabilityQuery(value: unknown): AvailabilityQuery {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw bookingValidationError('Query string must be an object.');
  }
  const query = value as Record<string, unknown>;
  if (!('date' in query) || query.date === undefined || query.date === '') {
    throw bookingValidationError('date query parameter is required.');
  }
  return { date: parseDateField(query.date) };
}

/**
 * Monta a grade fixa marcando como indisponíveis os horários já ocupados
 * por reservas ativas (`requested`/`confirmed`).
 */
export function buildTimeSlots(occupiedSlotIds: string[]): TimeSlotResponseDto[] {
  const occupied = new Set(occupiedSlotIds);
  return BOOKING_TIME_SLOTS.map((slot) => ({
    id: slot,
    label: slot,
    isAvailable: !occupied.has(slot),
  }));
}
