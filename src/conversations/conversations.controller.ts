import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { parseCursorPaginationQuery } from '../common/pagination/cursor-pagination';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import {
  ConversationListResponseDto,
  ConversationResponseDto,
} from './dto/conversation-response.dto';
import {
  MessageListResponseDto,
  MessageResponseDto,
} from './dto/message-response.dto';
import { parseCreateMessageBody } from './dto/create-message-request.dto';
import { parseCreateConversationBody } from './dto/create-conversation-request.dto';
import {
  conversationNotFound,
  parseConversationId,
} from './dto/conversation-fields';

const CONVERSATIONS_DEFAULT_LIMIT = 20;
const CONVERSATIONS_MAX_LIMIT = 50;
const MESSAGES_DEFAULT_LIMIT = 50;
const MESSAGES_MAX_LIMIT = 100;

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
  @ApiOkResponse({ type: ConversationListResponseDto })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: unknown,
  ): Promise<ConversationListResponseDto> {
    const pagination = parseCursorPaginationQuery(query, {
      defaultLimit: CONVERSATIONS_DEFAULT_LIMIT,
      maxLimit: CONVERSATIONS_MAX_LIMIT,
    });
    if (!user.profiles?.tutor && !user.profiles?.provider) {
      return { items: [], nextCursor: null };
    }
    const page = await this.admin.listConversationsForUser(user, pagination);
    return ConversationListResponseDto.fromRecords(page.items, page.nextCursor);
  }

  /**
   * Abre (ou retoma) a conversa direta entre o tutor autenticado e um
   * provider. Idempotente: chamadas repetidas com o mesmo `providerId`
   * devolvem a mesma linha, sem clobber de `booking_id` ou de mensagens
   * existentes. Sem token → 401; provider inexistente → 404 genérico;
   * qualquer block (em qualquer direção) → 403; teto de cold-start → 429.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ConversationResponseDto })
  async openWithProvider(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ): Promise<ConversationResponseDto> {
    const tutorProfileId = requireTutorProfileId(user);
    const input = parseCreateConversationBody(body);
    const conversation = await this.admin.openConversation(
      user.id,
      tutorProfileId,
      input.providerId,
    );
    if (conversation === null) throw conversationNotFound();
    return ConversationResponseDto.fromRecord(conversation);
  }

  @Get(':id/messages')
  @ApiOkResponse({ type: MessageListResponseDto })
  async listMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: unknown,
  ): Promise<MessageListResponseDto> {
    const conversationId = parseConversationId(id);
    const pagination = parseCursorPaginationQuery(query, {
      defaultLimit: MESSAGES_DEFAULT_LIMIT,
      maxLimit: MESSAGES_MAX_LIMIT,
    });
    if (!hasCareProfile(user)) throw conversationNotFound();
    const messages = await this.admin.listMessagesForUser(
      user,
      conversationId,
      pagination,
    );
    if (messages === null) throw conversationNotFound();
    return MessageListResponseDto.fromRecords(
      messages.items,
      messages.nextCursor,
    );
  }

  @Post(':id/messages')
  @ApiOkResponse({ type: MessageResponseDto })
  async createMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<MessageResponseDto> {
    const conversationId = parseConversationId(id);
    const input = parseCreateMessageBody(body);
    if (!hasCareProfile(user)) throw conversationNotFound();
    const message = await this.admin.createMessageForUser(
      user,
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

function hasCareProfile(user: AuthUser): boolean {
  return Boolean(user.profiles?.tutor || user.profiles?.provider);
}
