import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator';

/**
 * Health check público. Não expõe versões, env, string de conexão ou
 * detalhes internos (docs/05 §14).
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOkResponse({ description: 'Service is up.' })
  check(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.floor(process.uptime()) };
  }
}
