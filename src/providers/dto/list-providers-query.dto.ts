import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PROVIDER_CATEGORIES,
  PROVIDERS_DEFAULT_LIMIT,
  PROVIDERS_MAX_LIMIT,
  PROVIDERS_MAX_OFFSET,
  PROVIDERS_SEARCH_MAX_LENGTH,
  providerValidationError,
  type ProviderCategory,
} from './provider-fields';

/** Filtro validado de `GET /providers`. */
export interface ListProvidersFilter {
  categoryId: ProviderCategory | null;
  q: string | null;
  limit: number;
  offset: number;
}

/** Documentação Swagger dos parâmetros de query — validação é manual abaixo. */
export class ListProvidersQueryDto {
  @ApiPropertyOptional({
    enum: PROVIDER_CATEGORIES,
    description: 'Filtra por categoria fixa do marketplace.',
  })
  categoryId?: ProviderCategory;

  @ApiPropertyOptional({
    maxLength: PROVIDERS_SEARCH_MAX_LENGTH,
    description: 'Busca textual por nome do prestador ou serviço.',
  })
  q?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PROVIDERS_MAX_LIMIT,
    default: PROVIDERS_DEFAULT_LIMIT,
  })
  limit?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  offset?: number;
}

/**
 * Converte a query crua (`ParsedQs` — só strings) no filtro tipado.
 * Parâmetros desconhecidos são ignorados; os conhecidos são validados.
 */
export function parseListProvidersQuery(value: unknown): ListProvidersFilter {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw providerValidationError('Query string must be an object.');
  }
  const query = value as Record<string, unknown>;

  return {
    categoryId: parseCategory(query.categoryId),
    q: parseSearch(query.q),
    limit: parseLimit(query.limit),
    offset: parseOffset(query.offset),
  };
}

function parseCategory(value: unknown): ProviderCategory | null {
  if (value === undefined || value === '') return null;
  if (
    typeof value !== 'string' ||
    !(PROVIDER_CATEGORIES as readonly string[]).includes(value)
  ) {
    throw providerValidationError(
      `categoryId must be one of: ${PROVIDER_CATEGORIES.join(', ')}.`,
    );
  }
  return value as ProviderCategory;
}

function parseSearch(value: unknown): string | null {
  if (value === undefined) return null;
  if (typeof value !== 'string') {
    throw providerValidationError('q must be a string.');
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > PROVIDERS_SEARCH_MAX_LENGTH) {
    throw providerValidationError(
      `q must be at most ${PROVIDERS_SEARCH_MAX_LENGTH} characters.`,
    );
  }
  return trimmed;
}

function parseLimit(value: unknown): number {
  if (value === undefined || value === '') return PROVIDERS_DEFAULT_LIMIT;
  const limit = parseInteger(value, 'limit');
  if (limit < 1 || limit > PROVIDERS_MAX_LIMIT) {
    throw providerValidationError(
      `limit must be between 1 and ${PROVIDERS_MAX_LIMIT}.`,
    );
  }
  return limit;
}

function parseOffset(value: unknown): number {
  if (value === undefined || value === '') return 0;
  const offset = parseInteger(value, 'offset');
  if (offset < 0 || offset > PROVIDERS_MAX_OFFSET) {
    throw providerValidationError(
      `offset must be between 0 and ${PROVIDERS_MAX_OFFSET}.`,
    );
  }
  return offset;
}

function parseInteger(value: unknown, field: 'limit' | 'offset'): number {
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) {
    throw providerValidationError(`${field} must be an integer.`);
  }
  return Number.parseInt(value, 10);
}
