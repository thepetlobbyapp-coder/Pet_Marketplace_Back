import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ConversationRecord } from './conversation-fields';

/**
 * Safe conversation contract. It never exposes tutor_profile_id or booking_id.
 */
export class ConversationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  providerId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Last message text.',
  })
  lastMessage!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'date-time',
    description: 'Last message timestamp.',
  })
  lastTime!: string | null;

  @ApiProperty({
    description: 'True when the latest message is from the other participant.',
  })
  unread!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Public name of the other participant.',
  })
  counterpartName!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'uri',
    description: 'Public or signed avatar URL of the other participant.',
  })
  counterpartAvatarUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Auxiliary service or role label for the other participant.',
  })
  counterpartService!: string | null;

  @ApiProperty({
    description: 'True when the authenticated viewer is the provider.',
  })
  viewerIsProvider!: boolean;

  static fromRecord(record: ConversationRecord): ConversationResponseDto {
    const viewerIsProvider = record.viewer_is_provider === true;

    return {
      id: record.id,
      providerId: record.provider_id,
      lastMessage: record.last_message_text,
      lastTime: record.last_message_at,
      unread: viewerIsProvider
        ? record.last_message_from_provider === false
        : record.last_message_from_provider === true,
      counterpartName: record.counterpart_name ?? null,
      counterpartAvatarUrl: record.counterpart_avatar_url ?? null,
      counterpartService: record.counterpart_service_label ?? null,
      viewerIsProvider,
    };
  }
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationResponseDto] })
  items!: ConversationResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  static fromRecords(
    records: ConversationRecord[],
    nextCursor: string | null,
  ): ConversationListResponseDto {
    return {
      items: records.map((record) =>
        ConversationResponseDto.fromRecord(record),
      ),
      nextCursor,
    };
  }
}
