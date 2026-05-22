import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/**
 * Bloco 4B — campos e validações compartilhados da Pets API do tutor.
 * Espelha as enums do schema `public.pets` (migration 20260518_002).
 */
export const PET_SPECIES = ['dog', 'cat', 'other'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_SIZES = ['small', 'medium', 'large', 'giant', 'unknown'] as const;
export type PetSize = (typeof PET_SIZES)[number];

/** Allowlist estrita de campos editáveis pelo tutor. Nada fora disto entra. */
export const PET_ALLOWED_FIELDS = [
  'name',
  'species',
  'breed',
  'size',
  'ageRange',
  'notes',
] as const;
export type PetField = (typeof PET_ALLOWED_FIELDS)[number];

/** Linha segura de `public.pets` — sem `tutor_profile_id`/`deleted_at`. */
export interface PetRecord {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  size: PetSize;
  age_range: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const TEXT_LIMITS: Record<'name' | 'breed' | 'ageRange' | 'notes', number> = {
  name: 120,
  breed: 120,
  ageRange: 60,
  notes: 2000,
};

export function petValidationError(
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

/**
 * Garante que o corpo é um objeto e que nenhum campo está fora da allowlist.
 * Bloqueia tentativas de gravar `tutor_profile_id`, `id`, `deleted_at` etc.
 */
export function asAllowlistedBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw petValidationError('Request body must be an object.');
  }

  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !(PET_ALLOWED_FIELDS as readonly string[]).includes(key),
  );

  if (rejectedFields.length > 0) {
    throw petValidationError(
      'Request contains fields outside the pet allowlist.',
      { allowedFields: [...PET_ALLOWED_FIELDS], rejectedFields },
    );
  }

  return body;
}

export function parseRequiredName(value: unknown): string {
  if (typeof value !== 'string') {
    throw petValidationError('name is required and must be a string.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw petValidationError('name must not be empty.');
  }
  if (trimmed.length > TEXT_LIMITS.name) {
    throw petValidationError(
      `name must be at most ${TEXT_LIMITS.name} characters.`,
    );
  }
  return trimmed;
}

export function parseSpecies(value: unknown): PetSpecies {
  if (
    typeof value !== 'string' ||
    !(PET_SPECIES as readonly string[]).includes(value)
  ) {
    throw petValidationError(
      `species must be one of: ${PET_SPECIES.join(', ')}.`,
    );
  }
  return value as PetSpecies;
}

export function parseSize(value: unknown): PetSize {
  if (
    typeof value !== 'string' ||
    !(PET_SIZES as readonly string[]).includes(value)
  ) {
    throw petValidationError(`size must be one of: ${PET_SIZES.join(', ')}.`);
  }
  return value as PetSize;
}

/** breed | ageRange | notes: string ou null. String vazia normaliza para null. */
export function parseOptionalText(
  value: unknown,
  field: 'breed' | 'ageRange' | 'notes',
): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw petValidationError(`${field} must be a string or null.`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > TEXT_LIMITS[field]) {
    throw petValidationError(
      `${field} must be at most ${TEXT_LIMITS[field]} characters.`,
    );
  }
  return trimmed;
}
