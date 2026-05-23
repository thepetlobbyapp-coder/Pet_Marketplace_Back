import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { parseCreateMessageBody } from './dto/create-message-request.dto';
import {
  conversationNotFound,
  parseConversationId,
} from './dto/conversation-fields';

/**
 * Bloco 4H: Conversations API do tutor autenticado.
 * Fase 1 — chat só por REST, sem entrega em tempo real. Toda operação é
 * escopada ao `tutor_profile` do usuário; conversa de outro tutor responde
 * com 404 genérico (não revela existência).
 */
@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  @ApiOkResponse({ type: ConversationResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AuthUser,
  ): Promise<ConversationResponseDto[]> {
    const tutorProfileId = user.profiles?.tutor?.id;
    if (!tutorProfileId) return [];
    const conversations = await this.admin.listConversations(tutorProfileId);
    return conversations.map((conversation) =>
      ConversationResponseDto.fromRecord(conversation),
    );
  }

  @Get(':id/messages')
  @ApiOkResponse({ type: MessageResponseDto, isArray: true })
  async listMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<MessageResponseDto[]> {
    const tutorProfileId = requireTutorProfileId(user);
    const conversationId = parseConversationId(id);
    const messages = await this.admin.listMessages(
      tutorProfileId,
      conversationId,
    );
    if (messages === null) throw conversationNotFound();
    return messages.map((message) => MessageResponseDto.fromRecord(message));
  }

  @Post(':id/messages')
  @ApiOkResponse({ type: MessageResponseDto })
  async createMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<MessageResponseDto> {
    const tutorProfileId = requireTutorProfileId(user);
    const conversationId = parseConversationId(id);
    const input = parseCreateMessageBody(body);
    const message = await this.admin.createMessage(
      tutorProfileId,
      conversationId,
      input.text,
    );
    if (message === null) throw conversationNotFound();
    return MessageResponseDto.fromRecord(message);
  }
}

/**
 * Sem `tutor_profile` o usuário não participa de nenhuma conversa: respondemos
 * com o mesmo 404 genérico, sem revelar a causa exata.
 */
function requireTutorProfileId(user: AuthUser): string {
  const tutorProfileId = user.profiles?.tutor?.id;
  if (!tutorProfileId) throw conversationNotFound();
  return tutorProfileId;
}
