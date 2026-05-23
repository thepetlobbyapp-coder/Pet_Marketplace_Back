import { ApiProperty } from '@nestjs/swagger';
import {
  asAllowlistedBody,
  parseMessageText,
  conversationValidationError,
} from './conversation-fields';

/** Entrada validada para criar uma mensagem. */
export interface CreateMessageInput {
  text: string;
}

const CREATE_MESSAGE_ALLOWED_FIELDS = ['text'] as const;

export class CreateMessageRequestDto {
  @ApiProperty({ maxLength: 2000, example: 'Hi! Is 9am still available?' })
  text!: string;
}

export function parseCreateMessageBody(value: unknown): CreateMessageInput {
  const body = asAllowlistedBody(value, CREATE_MESSAGE_ALLOWED_FIELDS);

  if (!('text' in body)) {
    throw conversationValidationError('text is required.');
  }

  return { text: parseMessageText(body.text) };
}
