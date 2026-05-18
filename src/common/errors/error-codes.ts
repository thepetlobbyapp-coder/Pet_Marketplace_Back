/**
 * Códigos de erro estáveis (contrato D-007). SCREAMING_SNAKE_CASE.
 * Mensagens em inglês britânico (app é en-GB).
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_BACKEND_UNAVAILABLE: 'AUTH_BACKEND_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorBody {
  error: {
    code: ErrorCodeValue | string;
    message: string;
    details: Record<string, unknown>;
  };
}
