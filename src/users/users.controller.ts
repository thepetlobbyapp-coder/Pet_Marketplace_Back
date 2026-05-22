import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { MeResponseDto } from './dto/me-response.dto';
import {
  parseUpdateMeBody,
  UpdateMeRequestDto,
} from './dto/update-me-request.dto';

/**
 * Bloco 1: apenas GET /me (lê o contexto autenticado).
 * PATCH /me e POST /me/delete-request são do Bloco 4 (docs/05 §4) e NÃO
 * são expostos agora para não criar rota incompleta (regra Play Store).
 */
@ApiTags('users')
@Controller('me')
export class UsersController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  @ApiOkResponse({
    description:
      'Authenticated user, database-backed roles, and safe profile summaries.',
    type: MeResponseDto,
  })
  me(@CurrentUser() user: AuthUser): MeResponseDto {
    return MeResponseDto.fromAuthUser(user);
  }

  @Patch()
  @ApiOkResponse({
    description:
      'Updated authenticated user with backend-owned roles and status.',
    type: MeResponseDto,
  })
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateMeRequestDto,
  ): Promise<MeResponseDto> {
    const input = parseUpdateMeBody(body);
    const updatedUser = await this.admin.updateOwnUser(user.id, input);
    return MeResponseDto.fromAuthUser(updatedUser);
  }
}
