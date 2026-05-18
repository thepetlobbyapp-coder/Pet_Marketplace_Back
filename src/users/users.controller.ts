import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';

/**
 * Bloco 1: apenas GET /me (lê o contexto autenticado).
 * PATCH /me e POST /me/delete-request são do Bloco 4 (docs/05 §4) e NÃO
 * são expostos agora para não criar rota incompleta (regra Play Store).
 */
@ApiTags('users')
@Controller('me')
export class UsersController {
  @Get()
  @ApiOkResponse({ description: 'Authenticated user and linked roles.' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
