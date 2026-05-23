import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/**
 * Bloco 4F — campos e validações compartilhados da Providers API.
 * Categorias fixas do marketplace (design.md §9 — chips de categoria).
 */
export const PROVIDER_CATEGORIES = [
  'walk',
  'sitting',
  'transport',
  'boarding',
] as const;
export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];

/** Paginação padrão da listagem de prestadores. */
export const PROVIDERS_DEFAULT_LIMIT = 20;
export const PROVIDERS_MAX_LIMIT = 50;
export const PROVIDERS_MAX_OFFSET = 10_000;
export const PROVIDERS_SEARCH_MAX_LENGTH = 80;

/**
 * Linha segura devolvida pelas RPCs `providers_list_near`/`providers_get_one`.
 * Já é o contrato projetado — sem telefone, endereço completo nem coordenadas.
 * `distance_meters` é APROXIMADO: arredondado a dezenas de metros pela RPC e
 * `null` quando tutor ou prestador não têm localização (regra de privacidade).
 */
export interface ProviderRecord {
  id: string;
  name: string;
  service_label: string;
  category: ProviderCategory;
  avatar_url: string | null;
  rating: number | null;
  review_count: number;
  distance_meters: number | null;
  is_available: boolean;
  price_per_hour: number;
  bio: string | null;
}

export function providerValidationError(
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

export function providerNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Provider not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}
