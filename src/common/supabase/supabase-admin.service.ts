import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
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
import { serverSupabaseOptions } from './supabase-client-options';
import type { UpdateMeInput } from '../../users/dto/update-me-request.dto';
import type { CreatePetInput } from '../../pets/dto/create-pet-request.dto';
import type { UpdatePetInput } from '../../pets/dto/update-pet-request.dto';
import type { PetRecord } from '../../pets/dto/pet-fields';

const DEFAULT_ROLE: Role = 'tutor';
const VALID_ROLES: readonly Role[] = ['tutor', 'provider', 'admin'];

/** Colunas seguras de `public.pets` — exclui `tutor_profile_id`/`deleted_at`. */
const PET_COLUMNS =
  'id,name,species,breed,size,age_range,notes,created_at,updated_at' as const;

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
      this.client = createClient<Database>(
        url,
        serviceRoleKey,
        serverSupabaseOptions,
      );
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

    const { data: existingUser, error: existingError } = await client
      .from('users')
      .select('id,email')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingError) {
      this.logger.error(
        { code: existingError.code },
        'Failed to sync authenticated user.',
      );
      throw new AuthBackendUnavailableException();
    }

    if (existingUser) {
      if (existingUser.email !== email) {
        const updateEmail = await client
          .from('users')
          .update({ email, updated_at: new Date().toISOString() })
          .eq('id', authUser.id)
          .select('id');

        if (updateEmail.error) {
          this.logger.error(
            { code: updateEmail.error.code },
            'Failed to update authenticated user email.',
          );
          throw new AuthBackendUnavailableException();
        }
      }
    } else {
      const insert = await client
        .from('users')
        .insert({
          id: authUser.id,
          email,
          locale: this.resolveLocale(authUser),
        })
        .select('id');

      if (insert.error) {
        this.logger.error(
          { code: insert.error.code },
          'Failed to create authenticated user.',
        );
        throw new AuthBackendUnavailableException();
      }
    }

    return this.loadAuthUserById(authUser.id);
  }

  async updateOwnUser(userId: string, input: UpdateMeInput): Promise<AuthUser> {
    const client = this.getClient();
    const { error } = await client
      .from('users')
      .update({
        locale: input.locale,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .is('deleted_at', null)
      .select('id')
      .single();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to update public user.');
      throw new AuthBackendUnavailableException();
    }

    return this.loadAuthUserById(userId);
  }

  /**
   * Pets do tutor. Toda query é escopada por `tutor_profile_id` e ignora
   * registros com `deleted_at`, garantindo que o tutor só vê os próprios pets.
   */
  async listPets(tutorProfileId: string): Promise<PetRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('pets')
      .select(PET_COLUMNS)
      .eq('tutor_profile_id', tutorProfileId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list pets.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? [];
  }

  async createPet(
    tutorProfileId: string,
    input: CreatePetInput,
  ): Promise<PetRecord> {
    const client = this.getClient();
    const { data, error } = await client
      .from('pets')
      .insert({
        tutor_profile_id: tutorProfileId,
        name: input.name,
        species: input.species,
        size: input.size,
        breed: input.breed,
        age_range: input.ageRange,
        notes: input.notes,
      })
      .select(PET_COLUMNS)
      .single();

    if (error || !data) {
      this.logger.error({ code: error?.code }, 'Failed to create pet.');
      throw new AuthBackendUnavailableException();
    }

    return data;
  }

  /** Atualiza um pet do tutor. `null` = pet inexistente ou de outro tutor. */
  async updatePet(
    tutorProfileId: string,
    petId: string,
    input: UpdatePetInput,
  ): Promise<PetRecord | null> {
    const client = this.getClient();
    const patch: Database['public']['Tables']['pets']['Update'] = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) patch.name = input.name;
    if (input.species !== undefined) patch.species = input.species;
    if (input.size !== undefined) patch.size = input.size;
    if (input.breed !== undefined) patch.breed = input.breed;
    if (input.ageRange !== undefined) patch.age_range = input.ageRange;
    if (input.notes !== undefined) patch.notes = input.notes;

    const { data, error } = await client
      .from('pets')
      .update(patch)
      .eq('id', petId)
      .eq('tutor_profile_id', tutorProfileId)
      .is('deleted_at', null)
      .select(PET_COLUMNS)
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to update pet.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? null;
  }

  /** Soft delete via `deleted_at`. `false` = pet inexistente ou de outro tutor. */
  async softDeletePet(
    tutorProfileId: string,
    petId: string,
  ): Promise<boolean> {
    const client = this.getClient();
    const { data, error } = await client
      .from('pets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', petId)
      .eq('tutor_profile_id', tutorProfileId)
      .is('deleted_at', null)
      .select('id');

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to delete pet.');
      throw new AuthBackendUnavailableException();
    }

    return (data?.length ?? 0) > 0;
  }

  private async loadAuthUserById(userId: string): Promise<AuthUser> {
    const client = this.getClient();
    const { data: user, error: userError } = await client
      .from('users')
      .select('id,email,status,locale,created_at,updated_at,deleted_at')
      .eq('id', userId)
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

  private async loadSafeProfiles(
    userId: string,
  ): Promise<AuthUser['profiles']> {
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
