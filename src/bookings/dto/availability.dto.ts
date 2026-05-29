import { ApiProperty } from '@nestjs/swagger';
import {
  BOOKING_TIME_SLOTS,
  bookingValidationError,
  parseDateField,
  parseTimeSlotIdsField,
  type BookingTimeSlot,
} from './booking-fields';

/** Filtro validado de `GET /providers/:id/availability`. */
export interface AvailabilityQuery {
  date: string;
}

export interface ProviderAvailabilityDayInput {
  weekday: number;
  timeSlotIds: BookingTimeSlot[];
}

export interface ProviderWeeklyAvailabilityInput {
  days: ProviderAvailabilityDayInput[];
}

export interface ProviderAvailabilitySlotState {
  configuredSlotIds: string[];
  occupiedSlotIds: string[];
}

/** Um horario da agenda semanal do prestador. */
export class TimeSlotResponseDto {
  @ApiProperty({ example: '09:00', description: 'Identificador do horario.' })
  id!: string;

  @ApiProperty({ example: '09:00', description: 'Rotulo HH:MM.' })
  label!: string;

  @ApiProperty({ description: 'Falso quando ja ha reserva ativa no horario.' })
  isAvailable!: boolean;
}

export class ProviderAvailabilityDayDto {
  @ApiProperty({ example: 1, maximum: 6, minimum: 0 })
  weekday!: number;

  @ApiProperty({ enum: BOOKING_TIME_SLOTS, isArray: true })
  timeSlotIds!: string[];
}

export class ProviderWeeklyAvailabilityDto {
  @ApiProperty({ type: [ProviderAvailabilityDayDto] })
  days!: ProviderAvailabilityDayDto[];

  static fromDays(
    days: ProviderAvailabilityDayInput[],
  ): ProviderWeeklyAvailabilityDto {
    return {
      days: normaliseAvailabilityDays(days).map((day) => ({
        weekday: day.weekday,
        timeSlotIds: day.timeSlotIds,
      })),
    };
  }
}

/** Valida a query; `date` e obrigatorio e deve ser `YYYY-MM-DD`. */
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

export function parseProviderWeeklyAvailabilityBody(
  value: unknown,
): ProviderWeeklyAvailabilityInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw bookingValidationError('Request body must be an object.');
  }
  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter((key) => key !== 'days');
  if (rejectedFields.length > 0) {
    throw bookingValidationError(
      'Request contains fields outside the availability allowlist.',
      { allowedFields: ['days'], rejectedFields },
    );
  }
  if (!Array.isArray(body.days)) {
    throw bookingValidationError('days must be an array.');
  }
  if (body.days.length > 7) {
    throw bookingValidationError('days must contain at most seven weekdays.');
  }

  const seenWeekdays = new Set<number>();
  const days = body.days.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw bookingValidationError('Each availability day must be an object.');
    }
    const day = item as Record<string, unknown>;
    const extraFields = Object.keys(day).filter(
      (key) => key !== 'weekday' && key !== 'timeSlotIds',
    );
    if (extraFields.length > 0) {
      throw bookingValidationError(
        'Availability day contains fields outside the allowlist.',
        {
          allowedFields: ['weekday', 'timeSlotIds'],
          rejectedFields: extraFields,
        },
      );
    }

    const weekday = parseWeekday(day.weekday);
    if (seenWeekdays.has(weekday)) {
      throw bookingValidationError('days must not contain duplicate weekdays.');
    }
    seenWeekdays.add(weekday);

    return {
      weekday,
      timeSlotIds: parseTimeSlotIdsOrEmpty(day.timeSlotIds),
    };
  });

  return { days: normaliseAvailabilityDays(days) };
}

/**
 * Monta a grade configurada marcando como indisponiveis os horarios ocupados
 * por reservas ativas (`requested`/`confirmed`).
 */
export function buildTimeSlots(
  availability: ProviderAvailabilitySlotState,
): TimeSlotResponseDto[] {
  const configured = new Set(availability.configuredSlotIds);
  const occupied = new Set(availability.occupiedSlotIds);

  return BOOKING_TIME_SLOTS.filter((slot) => configured.has(slot)).map(
    (slot) => ({
      id: slot,
      label: slot,
      isAvailable: !occupied.has(slot),
    }),
  );
}

function parseWeekday(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 6
  ) {
    throw bookingValidationError('weekday must be an integer from 0 to 6.');
  }
  return value;
}

function parseTimeSlotIdsOrEmpty(value: unknown): BookingTimeSlot[] {
  if (Array.isArray(value) && value.length === 0) return [];
  return parseTimeSlotIdsField(value);
}

function normaliseAvailabilityDays(
  days: ProviderAvailabilityDayInput[],
): ProviderAvailabilityDayInput[] {
  const byWeekday = new Map<number, BookingTimeSlot[]>();
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    byWeekday.set(weekday, []);
  }
  for (const day of days) {
    byWeekday.set(day.weekday, day.timeSlotIds);
  }
  return [...byWeekday.entries()].map(([weekday, timeSlotIds]) => ({
    weekday,
    timeSlotIds,
  }));
}
