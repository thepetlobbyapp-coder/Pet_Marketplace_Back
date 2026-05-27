import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { AuthUser } from '../common/auth/auth-user';
import { AuditLogger } from '../audit/audit.logger';

/**
 * Bloco 1: logout é placeholder. A revogação real de sessão/token segue
 * a estratégia final do Bloco 4 (docs/05 §4). O client descarta o token.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly audit: AuditLogger) {}

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthUser): Promise<void> {
    await this.audit.record({
      actorUserId: user.id,
      action: 'auth.logout',
      entityType: 'user',
      entityId: user.id,
    });
  }
}
