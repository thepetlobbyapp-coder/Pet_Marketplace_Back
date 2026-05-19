import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  type SupabaseClient,
  type User as SupabaseAuthUser,
} from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';
import type { Env } from '../../config/env.schema';
import type {
  AuthUser,
  ProviderProfileSummary,
  Role,
  TutorProfileSummary,
} from '../auth/auth-user';
import { AuthBackendUnavailableException } from '../errors/domain.exception';
import type { Database } from './database.types';

const DEFAULT_ROLE: Role = 'tutor';
const VALID_ROLES: readonly Role[] = ['tutor', 'provider', 'admin'];

@Injectable()
export class SupabaseAdminService implements OnModuleInit {
  private client: SupabaseClient<Database> | null = null;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupabaseAdminService.name);
  }

  onModuleInit(): void {
    const url = this.config.get('SUPABASE_URL', { infer: true });
    const serviceRoleKey = this.config.get('SUPABASE_SERVICE_ROLE_KEY', {
      infer: true,
    });

    if (url && serviceRoleKey) {
      this.client = createClient<Database>(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.logger.info('Supabase service-role client initialised.');
    } else {
      this.logger.warn(
        'Supabase service-role key missing - DB integration is unavailable.',
      );
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async syncAndLoadAuthUser(authUser: SupabaseAuthUser): Promise<AuthUser> {
    const client = this.getClient();
    const email = authUser.email;
    if (!email) {
      throw new UnauthorizedException('Authenticated user has no email.');
    }

    const upsert = await client
      .from('users')
      .upsert(
        {
          id: authUser.id,
          email,
          locale: this.resolveLocale(authUser),
        },
        { onConflict: 'id' },
      )
      .select('id');

    if (upsert.error) {
      this.logger.error(
        { code: upsert.error.code },
        'Failed to sync authenticated user.',
      );
      throw new AuthBackendUnavailableException();
    }

    const { data: user, error: userError } = await client
      .from('users')
      .select('id,email,status,locale,created_at,updated_at,deleted_at')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      this.logger.error(
        { code: userError?.code },
        'Failed to load public user.',
      );
      throw new AuthBackendUnavailableException();
    }

    return {
      id: user.id,
      email: user.email,
      roles: await this.loadOrCreateRoles(user.id),
      status: user.deleted_at ? 'deleted' : user.status,
      locale: user.locale,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      profiles: await this.loadSafeProfiles(user.id),
    };
  }

  private getClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new AuthBackendUnavailableException();
    }
    return this.client;
  }

  private resolveLocale(authUser: SupabaseAuthUser): string {
    return (
      this.readString(authUser.user_metadata.locale) ??
      this.readString(authUser.app_metadata.locale) ??
      this.config.get('APP_DEFAULT_LOCALE', { infer: true })
    );
  }

  private async loadOrCreateRoles(userId: string): Promise<Role[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load user roles.');
      throw new AuthBackendUnavailableException();
    }

    const roles = (data ?? [])
      .map((row) => row.role)
      .filter((role): role is Role => VALID_ROLES.includes(role));

    if (roles.length > 0) {
      return roles;
    }

    const fallback = await client
      .from('user_roles')
      .upsert(
        {
          user_id: userId,
          role: DEFAULT_ROLE,
        },
        { onConflict: 'user_id,role' },
      )
      .select('role')
      .single();

    if (fallback.error || !fallback.data) {
      this.logger.error(
        { code: fallback.error?.code },
        'Failed to create fallback user role.',
      );
      throw new AuthBackendUnavailableException();
    }

    return [fallback.data.role];
  }

  private async loadSafeProfiles(userId: string): Promise<AuthUser['profiles']> {
    const [tutor, provider] = await Promise.all([
      this.loadTutorProfile(userId),
      this.loadProviderProfile(userId),
    ]);

    return {
      ...(tutor ? { tutor } : {}),
      ...(provider ? { provider } : {}),
    };
  }

  private async loadTutorProfile(
    userId: string,
  ): Promise<TutorProfileSummary | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('tutor_profiles')
      .select('id,display_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load tutor profile.');
      throw new AuthBackendUnavailableException();
    }

    if (!data) return null;
    return {
      id: data.id,
      displayName: data.display_name,
    };
  }

  private async loadProviderProfile(
    userId: string,
  ): Promise<ProviderProfileSummary | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('provider_profiles')
      .select(
        'id,display_name,status,service_radius_km,rating_average,rating_count',
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load provider profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    if (!data) return null;
    return {
      id: data.id,
      displayName: data.display_name,
      status: data.status,
      serviceRadiusKm: data.service_radius_km,
      ratingAverage: data.rating_average,
      ratingCount: data.rating_count,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }
}
