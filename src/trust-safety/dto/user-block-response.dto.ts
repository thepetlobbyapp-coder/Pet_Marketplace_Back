import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserBlockRecord } from './trust-safety-fields';

/** Safe block contract. Does not expose the blocked user's email or profile. */
export class UserBlockResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  blockedUserId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  conversationId!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  static fromRecord(record: UserBlockRecord): UserBlockResponseDto {
    return {
      id: record.id,
      blockedUserId: record.blocked_user_id,
      conversationId: record.conversation_id,
      createdAt: record.created_at,
    };
  }
}
