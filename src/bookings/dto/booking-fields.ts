import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/**
 * Bloco 4G — campos e validações compartilhados da Bookings API.
 * Fase 1: apenas o ciclo de vida da reserva. Sem pagamento, sem proteção
 * financeira (design.md §8 "Payment" e §11 "Payments").
 */
export const BOOKING_STATUSES = [
  'requested',
  'confirmed',
  'cancelled',
  'completed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/**
 * Grade fixa de horários do prestador (08:00–19:00, de hora em hora).
 * Não há tabela de disponibilidade nesta fase: a grade é gerada pelo backend
 * e um slot fica indisponível quando há reserva ativa nele.
 */
export const BOOKING_TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
] as const;
export type BookingTimeSlot = (typeof BOOKING_TIME_SLOTS)[number];

/** Quem dispara uma transição de status. */
export type BookingActor = 'tutor' | 'provider';
export type BookingViewerRole = BookingActor | 'both';
export type BookingPerspective = BookingActor;

export interface BookingListQuery {
  cursor: string | null;
  limit: number;
  perspective: BookingPerspective | null;
  status: BookingStatus | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVICE_MAX_LENGTH = 160;

/** Linha segura de `public.bookings` — sem `tutor_profile_id`. */
export interface BookingRecord {
  id: string;
  provider_id: string;
  pet_id: string;
  /**
   * Internal-only participant id used to decorate participant-safe responses.
   * DTO projection must never expose this field.
   */
  tutor_profile_id?: string;
  service_label: string;
  booking_date: string;
  time_slot_id: string;
  time_slot_ids?: string[] | null;
  status: BookingStatus;
  price_per_hour_snapshot?: number | null;
  estimated_total_amount?: number | null;
  currency?: string | null;
  viewer_role?: BookingViewerRole | null;
  provider_name?: string | null;
  tutor_name?: string | null;
  pet_name?: string | null;
  counterpart_name?: string | null;
  counterpart_avatar_url?: string | null;
  counterpart_role?: BookingPerspective | null;
  booking_group_key?: string | null;
  created_at: string;
  updated_at: string;
}

export function bookingValidationError(
  message: string,
  details: Record<string, unknown> = {},
): DomainException {
  return new DomainException(
    ErrorCode.VALIDATION_ERROR,
    message,
    details,
    HttpStatus.BAD_REQUEST,
  );
}

export function bookingNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Booking not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}

/** Slot já reservado por outra booking ativa — mapeado para HTTP 409. */
export function bookingSlotTaken(): DomainException {
  return new DomainException(
    ErrorCode.CONFLICT,
    'The selected time slot is no longer available.',
    {},
    HttpStatus.CONFLICT,
  );
}

/**
 * Garante o objeto e bloqueia qualquer campo fora da allowlist — impede
 * gravar `status`, `tutorProfileId`, campos de pagamento etc. indevidamente.
 */
export function asAllowlistedBody(
  value: unknown,
  allowedFields: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw bookingValidationError('Request body must be an object.');
  }
  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key),
  );
  if (rejectedFields.length > 0) {
    throw bookingValidationError(
      'Request contains fields outside the booking allowlist.',
      { allowedFields: [...allowedFields], rejectedFields },
    );
  }
  return body;
}

export function parseUuidField(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw bookingValidationError(`${field} must be a valid UUID.`);
  }
  return value;
}

/** Aceita apenas `YYYY-MM-DD` correspondente a uma data real do calendário. */
export function parseDateField(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw bookingValidationError('date must be in YYYY-MM-DD format.');
  }
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw bookingValidationError('date is not a valid calendar date.');
  }
  return value;
}

export function parseTimeSlotField(value: unknown): BookingTimeSlot {
  if (
    typeof value !== 'string' ||
    !(BOOKING_TIME_SLOTS as readonly string[]).includes(value)
  ) {
    throw bookingValidationError(
      `timeSlotId must be one of: ${BOOKING_TIME_SLOTS.join(', ')}.`,
    );
  }
  return value as BookingTimeSlot;
}

export function parseTimeSlotIdsField(value: unknown): BookingTimeSlot[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw bookingValidationError('timeSlotIds must be a non-empty array.');
  }
  if (value.length > BOOKING_TIME_SLOTS.length) {
    throw bookingValidationError('timeSlotIds contains too many slots.');
  }

  const seen = new Set<string>();
  const slots = value.map((item) => {
    const slot = parseTimeSlotField(item);
    if (seen.has(slot)) {
      throw bookingValidationError('timeSlotIds must not contain duplicates.');
    }
    seen.add(slot);
    return slot;
  });

  return [...slots].sort(
    (left, right) =>
      BOOKING_TIME_SLOTS.indexOf(left) - BOOKING_TIME_SLOTS.indexOf(right),
  );
}

export function parseServiceField(value: unknown): string {
  if (typeof value !== 'string') {
    throw bookingValidationError('service is required and must be a string.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw bookingValidationError('service must not be empty.');
  }
  if (trimmed.length > SERVICE_MAX_LENGTH) {
    throw bookingValidationError(
      `service must be at most ${SERVICE_MAX_LENGTH} characters.`,
    );
  }
  return trimmed;
}

export function parseStatusField(value: unknown): BookingStatus {
  if (
    typeof value !== 'string' ||
    !(BOOKING_STATUSES as readonly string[]).includes(value)
  ) {
    throw bookingValidationError(
      `status must be one of: ${BOOKING_STATUSES.join(', ')}.`,
    );
  }
  return value as BookingStatus;
}

export function parseOptionalStatusField(value: unknown): BookingStatus | null {
  if (value === undefined || value === '') return null;
  return parseStatusField(value);
}

export function parseOptionalBookingPerspectiveField(
  value: unknown,
): BookingPerspective | null {
  if (value === undefined || value === '') return null;
  if (value !== 'tutor' && value !== 'provider') {
    throw bookingValidationError('perspective must be tutor or provider.');
  }
  return value;
}

/**
 * Matriz de transições da Fase 1.
 * - O tutor da reserva pode cancelar.
 * - O prestador da reserva pode confirmar, concluir ou cancelar.
 * - `cancelled` e `completed` são terminais.
 */
const BOOKING_TRANSITIONS: Record<
  BookingStatus,
  { to: BookingStatus; actors: BookingActor[] }[]
> = {
  requested: [
    { to: 'confirmed', actors: ['provider'] },
    { to: 'cancelled', actors: ['tutor', 'provider'] },
  ],
  confirmed: [
    { to: 'completed', actors: ['provider'] },
    { to: 'cancelled', actors: ['tutor', 'provider'] },
  ],
  cancelled: [],
  completed: [],
};

/** Valida a transição de status; lança 409 quando proibida. */
export function assertBookingTransition(
  current: BookingStatus,
  next: BookingStatus,
  actor: BookingActor,
): void {
  const rule = BOOKING_TRANSITIONS[current].find((entry) => entry.to === next);
  if (!rule || !rule.actors.includes(actor)) {
    throw new DomainException(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      `Cannot change booking status from ${current} to ${next}.`,
      { currentStatus: current, requestedStatus: next, actor },
      HttpStatus.CONFLICT,
    );
  }
}
