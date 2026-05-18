import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, type ErrorCodeValue } from './error-codes';

/**
 * Erro de regra de negócio (HTTP 422 por padrão, ver docs/05 §2).
 * Usar quando a entrada é válida mas a regra de domínio impede a operação.
 */
export class DomainException extends HttpException {
  constructor(
    public readonly code: ErrorCodeValue,
    message: string,
    public readonly details: Record<string, unknown> = {},
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super(message, status);
  }
}

/** Backend de Auth/DB indisponível (sem chaves Supabase) — 503 (D-009). */
export class AuthBackendUnavailableException extends DomainException {
  constructor() {
    super(
      ErrorCode.AUTH_BACKEND_UNAVAILABLE,
      'Authentication backend is not configured.',
      {},
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
