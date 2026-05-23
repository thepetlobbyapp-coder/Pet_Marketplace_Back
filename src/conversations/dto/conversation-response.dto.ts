import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ConversationRecord } from './conversation-fields';

/**
 * Contrato seguro de uma conversa (Bloco 4H).
 * Não expõe `tutor_profile_id` nem o `booking_id` de origem.
 */
export class ConversationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Texto da última mensagem.' })
  lastMessage!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'date-time',
    description: 'Momento da última mensagem.',
  })
  lastTime!: string | null;

  @ApiProperty({ description: 'Verdadeiro quando a última mensagem é do prestador.' })
  unread!: boolean;

  static fromRecord(record: ConversationRecord): ConversationResponseDto {
    return {
      id: record.id,
      providerId: record.provider_id,
      lastMessage: record.last_message_text,
      lastTime: record.last_message_at,
      unread: record.last_message_from_provider === true,
    };
  }
}
