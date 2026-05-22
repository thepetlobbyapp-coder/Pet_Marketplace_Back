import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/app-config.module';
import { AppLoggerModule } from './common/logger/logger.module';
import { CommonModule } from './common/common.module';
import { AuditModule } from './audit/audit.module';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { AuthGuard } from './common/auth/auth.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';

/**
 * Composição raiz — Bloco 1.
 * Ordem dos APP_GUARD: Throttler → Auth → Roles.
 * Limite global padrão de rate limit (docs/02 §12.3); limites por rota
 * acompanham cada bloco que cria a rota.
 */
@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    CommonModule,
    AuditModule,
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    PetsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
