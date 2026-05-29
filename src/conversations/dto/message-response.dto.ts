import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MessageRecord } from './conversation-fields';

/** Contrato seguro de uma mensagem (Bloco 4H). */
export class MessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Verdadeiro quando a mensagem é do prestador.' })
  fromProvider!: boolean;

  @ApiProperty()
  text!: string;

  @ApiProperty({ format: 'date-time' })
  time!: string;

  static fromRecord(record: MessageRecord): MessageResponseDto {
    return {
      id: record.id,
      fromProvider: record.from_provider === true,
      text: record.body,
      time: record.created_at,
    };
  }
}

export class MessageListResponseDto {
  @ApiProperty({ type: [MessageResponseDto] })
  items!: MessageResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: MessageRecord[],
    nextCursor: string | null,
  ): MessageListResponseDto {
    return {
      items: records.map((record) => MessageResponseDto.fromRecord(record)),
      nextCursor,
    };
  }
}
