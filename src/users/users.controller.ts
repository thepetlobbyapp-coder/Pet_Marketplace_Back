import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { MeResponseDto } from './dto/me-response.dto';

/**
 * Bloco 1: apenas GET /me (lê o contexto autenticado).
 * PATCH /me e POST /me/delete-request são do Bloco 4 (docs/05 §4) e NÃO
 * são expostos agora para não criar rota incompleta (regra Play Store).
 */
@ApiTags('users')
@Controller('me')
export class UsersController {
  @Get()
  @ApiOkResponse({
    description: 'Authenticated user, database-backed roles, and safe profile summaries.',
    type: MeResponseDto,
  })
  me(@CurrentUser() user: AuthUser): MeResponseDto {
    return MeResponseDto.fromAuthUser(user);
  }
}
