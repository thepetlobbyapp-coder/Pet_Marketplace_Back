import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/**
 * Bloco 4H — campos e validações compartilhados da Conversations API.
 * Fase 1: chat só por REST, sem entrega em tempo real.
 *
 * Privacidade: o corpo das mensagens é dado sensível do usuário. Erros de
 * validação NUNCA devolvem o texto enviado — apenas mensagens genéricas.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MESSAGE_MAX_LENGTH = 2000;

/**
 * Janela e teto do rate-limit de DM cold-start (Checkpoint chat-cold-start).
 * Cold-start = conversa criada via `POST /conversations` antes de qualquer
 * booking (`booking_id IS NULL`). O limite vale por `tutor_profile_id`.
 */
export const CONVERSATION_COLD_START_WINDOW_MS = 60 * 60 * 1000;
export const CONVERSATION_COLD_START_HOURLY_LIMIT = 5;

/** Linha segura de `public.conversations` — sem `tutor_profile_id`. */
export interface ConversationRecord {
  id: string;
  provider_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  last_message_from_provider: boolean;
  counterpart_avatar_url?: string | null;
  counterpart_name?: string | null;
  counterpart_service_label?: string | null;
  created_at?: string;
  viewer_is_provider?: boolean;
}

/** Linha segura de `public.messages`. */
export interface MessageRecord {
  id: string;
  from_provider: boolean;
  body: string;
  created_at: string;
}

export function conversationValidationError(
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
 * 404 genérico para conversa inexistente OU não pertencente ao tutor.
 * Genérico de propósito: não revela se o id existe para outro usuário.
 */
export function conversationNotFound(): DomainException {
  return new DomainException(
    ErrorCode.NOT_FOUND,
    'Conversation not found.',
    {},
    HttpStatus.NOT_FOUND,
  );
}

/**
 * 429 do rate-limit de DM cold-start. Mensagem genérica de propósito — o
 * teto e a janela são pública e estável, mas o uso atual do tutor não vaza.
 */
export function conversationColdStartRateLimited(): DomainException {
  return new DomainException(
    ErrorCode.RATE_LIMITED,
    'Too many new conversations started recently. Please try again later.',
    {
      limit: CONVERSATION_COLD_START_HOURLY_LIMIT,
      windowMs: CONVERSATION_COLD_START_WINDOW_MS,
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

export function parseConversationId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw conversationValidationError('Conversation id must be a valid UUID.');
  }
  return value;
}

export function parseProviderId(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw conversationValidationError('providerId must be a valid UUID.');
  }
  return value;
}

/** Garante objeto e bloqueia campos fora da allowlist. */
export function asAllowlistedBody(
  value: unknown,
  allowedFields: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conversationValidationError('Request body must be an object.');
  }
  const body = value as Record<string, unknown>;
  const rejectedFields = Object.keys(body).filter(
    (key) => !allowedFields.includes(key),
  );
  if (rejectedFields.length > 0) {
    throw conversationValidationError(
      'Request contains fields outside the message allowlist.',
      { allowedFields: [...allowedFields], rejectedFields },
    );
  }
  return body;
}

/**
 * Valida o texto da mensagem. Em caso de erro, devolve só o motivo e o
 * limite — nunca o conteúdo enviado (regra de privacidade).
 */
export function parseMessageText(value: unknown): string {
  if (typeof value !== 'string') {
    throw conversationValidationError('text is required and must be a string.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw conversationValidationError('text must not be empty.');
  }
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    throw conversationValidationError(
      `text must be at most ${MESSAGE_MAX_LENGTH} characters.`,
    );
  }
  return trimmed;
}
