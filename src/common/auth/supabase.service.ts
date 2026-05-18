import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';
import type { Env } from '../../config/env.schema';
import {
  type AuthUser,
  type Role,
  type UserStatus,
} from './auth-user';

const VALID_ROLES: readonly Role[] = ['tutor', 'provider', 'admin'];

/**
 * Verificação de token Supabase. O backend é a autoridade de RBAC (D-006).
 * Sem chaves Supabase => modo degradado (isConfigured=false), Auth fica
 * BLOCKED em runtime e o AuthGuard responde 503 (D-009).
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupabaseService.name);
  }

  onModuleInit(): void {
    const url = this.config.get('SUPABASE_URL', { infer: true });
    const anon = this.config.get('SUPABASE_ANON_KEY', { infer: true });
    if (url && anon) {
      this.client = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.logger.info('Supabase client initialised.');
    } else {
      this.logger.warn(
        'Supabase keys missing — Auth/DB running in degraded mode (503).',
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** Resolve o usuário a partir do access token. null = token inválido. */
  async resolveUser(accessToken: string): Promise<AuthUser | null> {
    if (!this.client) return null;
    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error || !data.user) return null;

    const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
    const rawRoles = Array.isArray(meta.roles) ? meta.roles : [];
    const roles = rawRoles.filter((r): r is Role =>
      VALID_ROLES.includes(r as Role),
    );
    const status: UserStatus =
      meta.status === 'blocked' ? 'blocked' : 'active';

    return {
      id: data.user.id,
      email: data.user.email,
      roles,
      status,
    };
  }
}
