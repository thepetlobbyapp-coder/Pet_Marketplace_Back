import { ApiProperty } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  conversationValidationError,
  parseProviderId,
} from './conversation-fields';

/** Entrada validada para abrir/retomar uma conversa direta com um provider. */
export interface CreateConversationInput {
  providerId: string;
}

const CREATE_CONVERSATION_ALLOWED_FIELDS = ['providerId'] as const;

export class CreateConversationRequestDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Identificador do provider com quem o tutor deseja iniciar (ou retomar) a conversa direta.',
  })
  providerId!: string;
}

export function parseCreateConversationBody(
  value: unknown,
): CreateConversationInput {
  const body = asAllowlistedBody(value, CREATE_CONVERSATION_ALLOWED_FIELDS);

  if (!('providerId' in body)) {
    throw conversationValidationError('providerId is required.');
  }

  return { providerId: parseProviderId(body.providerId) };
}
