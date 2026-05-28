import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';

const CURSOR_MAX_LENGTH = 2048;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER_PATTERN = /^\d+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CursorPaginationConfig {
  defaultLimit: number;
  maxLimit: number;
}

export interface CursorPaginationQuery {
  limit: number;
  cursor: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function parseCursorPaginationQuery(
  value: unknown,
  config: CursorPaginationConfig,
): CursorPaginationQuery {
  if (value !== undefined && (!value || typeof value !== 'object')) {
    throw paginationValidationError('Query string must be an object.');
  }
  if (Array.isArray(value)) {
    throw paginationValidationError('Query string must be an object.');
  }

  const query = (value ?? {}) as Record<string, unknown>;

  return {
    limit: parseLimit(query.limit, config),
    cursor: parseCursor(query.cursor),
  };
}

export function buildPaginatedResult<T>(
  rows: readonly T[],
  limit: number,
  encodeCursor: (item: T) => string,
): PaginatedResult<T> {
  const items = rows.slice(0, limit);
  const nextCursor =
    rows.length > limit && items.length > 0
      ? encodeCursor(items[items.length - 1]!)
      : null;

  return { items, nextCursor };
}

export function encodePaginationCursor(
  payload: Record<string, unknown>,
): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodePaginationCursor(
  cursor: string,
  expectedKind: string,
): Record<string, unknown> {
  try {
    const payload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as unknown;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('invalid cursor payload');
    }

    const record = payload as Record<string, unknown>;
    if (record.kind !== expectedKind) {
      throw new Error('cursor kind mismatch');
    }

    return record;
  } catch {
    throw paginationValidationError('cursor is invalid.');
  }
}

export function readCursorDate(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = readCursorString(payload, field);
  if (
    !DATE_PATTERN.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw paginationValidationError('cursor is invalid.');
  }

  return value;
}

export function readCursorIsoDateTime(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = readCursorString(payload, field);
  if (Number.isNaN(Date.parse(value))) {
    throw paginationValidationError('cursor is invalid.');
  }

  return value;
}

export function readCursorNullableIsoDateTime(
  payload: Record<string, unknown>,
  field: string,
): string | null {
  const value = payload[field];
  if (value === null) return null;
  return readCursorIsoDateTime(payload, field);
}

export function readCursorUuid(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = readCursorString(payload, field);
  if (!UUID_PATTERN.test(value)) {
    throw paginationValidationError('cursor is invalid.');
  }

  return value;
}

function parseLimit(value: unknown, config: CursorPaginationConfig): number {
  if (value === undefined || value === '') return config.defaultLimit;
  if (typeof value !== 'string' || !INTEGER_PATTERN.test(value)) {
    throw paginationValidationError('limit must be an integer.');
  }

  const limit = Number.parseInt(value, 10);
  if (limit < 1 || limit > config.maxLimit) {
    throw paginationValidationError(
      `limit must be between 1 and ${config.maxLimit}.`,
      { maxLimit: config.maxLimit },
    );
  }

  return limit;
}

function parseCursor(value: unknown): string | null {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > CURSOR_MAX_LENGTH) {
    throw paginationValidationError('cursor is invalid.');
  }

  return value;
}

function readCursorString(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = payload[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw paginationValidationError('cursor is invalid.');
  }

  return value;
}

function paginationValidationError(
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
