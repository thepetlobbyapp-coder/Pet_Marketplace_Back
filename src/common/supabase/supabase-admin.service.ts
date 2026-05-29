import {
  HttpStatus,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import {
  createClient,
  type SupabaseClient,
  type User as SupabaseAuthUser,
} from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';
import type { Env } from '../../config/env.schema';
import type {
  TutorProfileInput,
  TutorProfileRecord,
} from '../../users/dto/tutor-profile.dto';
import type {
  ProviderProfileInput,
  ProviderProfileRecord,
} from '../../users/dto/provider-profile.dto';
import { AVATAR_SIGNED_URL_TTL_SECONDS } from '../../users/dto/avatar.dto';
import type { AccountDeletionRequestRecord } from '../../users/dto/account-deletion-request-response.dto';
import type {
  AuthUser,
  ProviderProfileSummary,
  Role,
  TutorProfileSummary,
  UserStatus,
} from '../auth/auth-user';
import {
  AuthBackendUnavailableException,
  DomainException,
} from '../errors/domain.exception';
import type { Database } from './database.types';
import { serverSupabaseOptions } from './supabase-client-options';
import type { UpdateMeInput } from '../../users/dto/update-me-request.dto';
import type { CreatePetInput } from '../../pets/dto/create-pet-request.dto';
import type { UpdatePetInput } from '../../pets/dto/update-pet-request.dto';
import type { PetRecord } from '../../pets/dto/pet-fields';
import type { CreateAddressInput } from '../../addresses/dto/create-address-request.dto';
import type { UpdateAddressInput } from '../../addresses/dto/update-address-request.dto';
import type {
  AddressRecord,
  AddressWithDefaultRecord,
} from '../../addresses/dto/address-fields';
import { addressValidationError } from '../../addresses/dto/address-fields';
import {
  providerNotFound,
  type ProviderRecord,
} from '../../providers/dto/provider-fields';
import type { ListProvidersFilter } from '../../providers/dto/list-providers-query.dto';
import {
  BOOKING_STATUSES,
  assertBookingTransition,
  bookingSlotTaken,
  bookingValidationError,
  type BookingRecord,
  type BookingListQuery,
  type BookingPerspective,
  type BookingViewerRole,
  type BookingStatus,
} from '../../bookings/dto/booking-fields';
import type { CreateBookingInput } from '../../bookings/dto/create-booking-request.dto';
import type {
  ProviderAvailabilityDayInput,
  ProviderAvailabilitySlotState,
  ProviderWeeklyAvailabilityInput,
} from '../../bookings/dto/availability.dto';
import {
  CONVERSATION_COLD_START_HOURLY_LIMIT,
  CONVERSATION_COLD_START_WINDOW_MS,
  conversationColdStartRateLimited,
  type ConversationRecord,
  type MessageRecord,
} from '../../conversations/dto/conversation-fields';
import type { CreateReportInput } from '../../trust-safety/dto/create-report-request.dto';
import {
  conversationBlocked,
  type ReportRecord,
  type UserBlockRecord,
} from '../../trust-safety/dto/trust-safety-fields';
import type { UpdateReportInput } from '../../trust-safety/dto/update-report-request.dto';
import type {
  AdminAuditLogRecord,
  AdminBookingRecord,
  AdminDashboardRecord,
  AdminProviderRecord,
  AdminUserRecord,
} from '../../admin/dto/admin-records';
import type { UpdateAdminUserStatusInput } from '../../admin/dto/update-admin-user-status-request.dto';
import { ErrorCode } from '../errors/error-codes';
import {
  buildPaginatedResult,
  decodePaginationCursor,
  encodePaginationCursor,
  type CursorPaginationQuery,
  type PaginatedResult,
  readCursorDate,
  readCursorIsoDateTime,
  readCursorNullableIsoDateTime,
  readCursorUuid,
} from '../pagination/cursor-pagination';

const DEFAULT_ROLE: Role = 'tutor';
const VALID_ROLES: readonly Role[] = ['tutor', 'provider', 'admin'];

/** Colunas seguras de `public.pets` — exclui `tutor_profile_id`/`deleted_at`. */
const PET_COLUMNS =
  'id,name,species,breed,size,age_range,notes,created_at,updated_at' as const;
const TUTOR_PROFILE_COLUMNS = 'id,display_name,created_at,updated_at' as const;
const PROVIDER_PROFILE_COLUMNS =
  'id,display_name,bio,base_address_id,status,service_radius_km,rating_average,rating_count,created_at,updated_at' as const;
const ADDRESS_COLUMNS =
  'id,label,country_code,city,postcode,public_area_label,location_precision,created_at,updated_at' as const;
/** Colunas seguras de `public.bookings` — exclui `tutor_profile_id`. */
const ACCOUNT_DELETION_REQUEST_COLUMNS =
  'id,status,requested_at,estimated_completion_at,processing_started_at,completed_at,updated_at' as const;
const BOOKING_COLUMNS =
  'id,provider_id,pet_id,service_label,booking_date,time_slot_id,status,price_per_hour_snapshot,estimated_total_amount,currency,created_at,updated_at' as const;
const BOOKING_INTERNAL_COLUMNS = `${BOOKING_COLUMNS},tutor_profile_id` as const;
/** Status de booking que ainda ocupam o slot (não cancelado/concluído). */
const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  'requested',
  'confirmed',
];
/** Colunas seguras de `public.conversations` — exclui `tutor_profile_id`. */
const CONVERSATION_COLUMNS =
  'id,provider_id,last_message_text,last_message_at,last_message_from_provider,created_at' as const;
const MESSAGE_COLUMNS = 'id,from_provider,body,created_at' as const;
const REPORT_COLUMNS =
  'id,status,category,target_type,target_id,created_at,updated_at' as const;
const USER_BLOCK_COLUMNS =
  'id,blocked_user_id,conversation_id,created_at' as const;
const ADMIN_USER_COLUMNS =
  'id,email,status,created_at,updated_at,deleted_at' as const;
const ADMIN_PROVIDER_COLUMNS =
  'id,display_name,status,created_at,updated_at' as const;
const ADMIN_BOOKING_COLUMNS =
  'id,service_label,booking_date,time_slot_id,status,created_at,updated_at' as const;
const ADMIN_AUDIT_LOG_COLUMNS =
  'id,actor_user_id,action,target_type,target_id,created_at' as const;
const ADMIN_OPEN_REPORT_STATUSES = ['open', 'in_review'] as const;

interface SupabaseCountResult {
  count: number | null;
  error: { code?: string } | null;
}

interface ConversationParticipantContext {
  actor: 'provider' | 'tutor';
  id: string;
  providerId: string;
  providerUserId: string;
  tutorProfileId: string;
  tutorUserId: string;
}

interface AppendAuditLogInput {
  action: string;
  actorUserId: string | null;
  metadata: Record<string, string | number | boolean | null>;
  targetId: string | null;
  targetType: string | null;
}

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

  async getOwnDeletionRequest(
    userId: string,
  ): Promise<AccountDeletionRequestRecord | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('account_deletion_requests')
      .select(ACCOUNT_DELETION_REQUEST_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load account deletion request.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data ?? null;
  }

  async requestOwnAccountDeletion(
    userId: string,
  ): Promise<AccountDeletionRequestRecord> {
    const client = this.getClient();
    const existingRequest = await this.getOwnDeletionRequest(userId);
    if (existingRequest) return existingRequest;

    const { data, error } = await client
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        estimated_completion_at: this.estimateDeletionCompletionAt(),
      })
      .select(ACCOUNT_DELETION_REQUEST_COLUMNS)
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        const createdByConcurrentRequest =
          await this.getOwnDeletionRequest(userId);
        if (createdByConcurrentRequest) return createdByConcurrentRequest;
      }

      this.logger.error(
        { code: error?.code },
        'Failed to create account deletion request.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data;
  }

  async requestPublicAccountDeletionByEmail(email: string): Promise<{
    userId: string | null;
    requestId: string | null;
  }> {
    const client = this.getClient();
    const { data: user, error } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to resolve public account deletion request.',
      );
      throw new AuthBackendUnavailableException();
    }

    if (!user) {
      return { userId: null, requestId: null };
    }

    const request = await this.requestOwnAccountDeletion(user.id);
    return { userId: user.id, requestId: request.id };
  }

  async createOwnTutorProfile(
    userId: string,
    input: TutorProfileInput,
  ): Promise<TutorProfileRecord | null> {
    const client = this.getClient();
    const { data, error } = await client.rpc('ensure_tutor_profile', {
      p_user_id: userId,
      p_display_name: input.displayName,
    });

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to create tutor profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    const row = data?.[0];
    if (!row) return null;
    return row;
  }

  async updateOwnTutorProfile(
    userId: string,
    input: TutorProfileInput,
  ): Promise<TutorProfileRecord | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('tutor_profiles')
      .update({
        display_name: input.displayName,
      })
      .eq('user_id', userId)
      .select(TUTOR_PROFILE_COLUMNS)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to update tutor profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data ?? null;
  }

  async createOwnProviderProfile(
    userId: string,
    input: ProviderProfileInput,
  ): Promise<ProviderProfileRecord | null> {
    const client = this.getClient();
    const { data, error } = await client.rpc('ensure_provider_profile', {
      p_user_id: userId,
      p_display_name: input.displayName ?? 'Pet provider',
    });

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to create provider profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    const row = data?.[0];
    if (!row) return null;
    await this.upsertOwnProviderListing(userId, row.id, input);
    if (input.publish !== undefined) {
      const status = await client
        .from('provider_profiles')
        .update({ status: input.publish ? 'active' : 'paused' })
        .eq('id', row.id)
        .select('id')
        .maybeSingle();
      if (status.error) {
        this.logger.error(
          { code: status.error.code },
          'Failed to update provider publish status.',
        );
        throw new AuthBackendUnavailableException();
      }
    }
    return (
      (await this.loadProviderProfileRecord(userId)) ?? {
        ...row,
        base_address_id: input.baseAddressId ?? null,
        bio: input.bio ?? null,
        category: null,
        is_available: null,
        listing_id: null,
        price_per_hour: null,
        service_label: null,
      }
    );
  }

  async updateOwnProviderProfile(
    userId: string,
    input: ProviderProfileInput,
  ): Promise<ProviderProfileRecord | null> {
    const client = this.getClient();
    const existing = await this.loadProviderProfileRecord(userId);
    if (!existing) return null;

    if (input.baseAddressId !== undefined && input.baseAddressId !== null) {
      const address = await this.loadOwnAddress(userId, input.baseAddressId);
      if (!address) {
        throw new DomainException(
          ErrorCode.NOT_FOUND,
          'Provider base address not found.',
          {},
          HttpStatus.NOT_FOUND,
        );
      }
    }

    await this.upsertOwnProviderListing(userId, existing.id, input);

    const patch: Database['public']['Tables']['provider_profiles']['Update'] =
      {};
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.bio !== undefined) patch.bio = input.bio;
    if (input.baseAddressId !== undefined) {
      patch.base_address_id = input.baseAddressId;
    }
    if (input.serviceRadiusKm !== undefined) {
      patch.service_radius_km = input.serviceRadiusKm;
    }
    if (input.publish !== undefined) {
      patch.status = input.publish ? 'active' : 'paused';
    }

    if (Object.keys(patch).length === 0) {
      return this.loadProviderProfileRecord(userId);
    }

    const { data, error } = await client
      .from('provider_profiles')
      .update(patch)
      .eq('user_id', userId)
      .select(PROVIDER_PROFILE_COLUMNS)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to update provider profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    if (!data) return null;

    return this.loadProviderProfileRecord(userId);
  }

  async listOwnAddresses(userId: string): Promise<AddressWithDefaultRecord[]> {
    const client = this.getClient();
    const [addressesResult, defaultAddressId] = await Promise.all([
      client
        .from('addresses')
        .select(ADDRESS_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      this.loadTutorDefaultAddressId(userId),
    ]);

    if (addressesResult.error) {
      this.logger.error(
        { code: addressesResult.error.code },
        'Failed to list addresses.',
      );
      throw new AuthBackendUnavailableException();
    }

    return this.withDefaultAddressFlag(
      addressesResult.data ?? [],
      defaultAddressId,
    );
  }

  async createOwnAddress(
    userId: string,
    tutorProfileId: string | null,
    input: CreateAddressInput,
  ): Promise<AddressWithDefaultRecord> {
    const client = this.getClient();
    const { data, error } = await client
      .from('addresses')
      .insert({
        user_id: userId,
        label: input.label,
        country_code: input.countryCode,
        city: input.city,
        postcode: input.postcode,
        public_area_label: input.publicAreaLabel,
        location_precision: input.locationPrecision,
        location: toEwktPoint(input.longitude, input.latitude),
      })
      .select(ADDRESS_COLUMNS)
      .single();

    if (error || !data) {
      this.logger.error({ code: error?.code }, 'Failed to create address.');
      throw new AuthBackendUnavailableException();
    }

    const defaultAddressId =
      input.setAsDefaultTutorAddress && tutorProfileId
        ? await this.setTutorDefaultAddress(tutorProfileId, data.id)
        : await this.loadTutorDefaultAddressId(userId);

    return this.withDefaultAddressFlag([data], defaultAddressId)[0]!;
  }

  async updateOwnAddress(
    userId: string,
    tutorProfileId: string | null,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<AddressWithDefaultRecord | null> {
    const client = this.getClient();
    const existing = await this.loadOwnAddress(userId, addressId);
    if (!existing) return null;

    const nextPostcode =
      input.postcode !== undefined ? input.postcode : existing.postcode;
    const nextCity = input.city !== undefined ? input.city : existing.city;
    const nextPublicAreaLabel =
      input.publicAreaLabel !== undefined
        ? input.publicAreaLabel
        : existing.public_area_label;

    if (!nextPostcode && !nextCity && !nextPublicAreaLabel) {
      throw addressValidationError(
        'At least one of postcode, city or publicAreaLabel must remain readable.',
      );
    }

    const patch: Database['public']['Tables']['addresses']['Update'] = {
      updated_at: new Date().toISOString(),
    };

    if (input.label !== undefined) patch.label = input.label;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode;
    if (input.city !== undefined) patch.city = input.city;
    if (input.postcode !== undefined) patch.postcode = input.postcode;
    if (input.publicAreaLabel !== undefined) {
      patch.public_area_label = input.publicAreaLabel;
    }
    if (input.locationPrecision !== undefined) {
      patch.location_precision = input.locationPrecision;
    }
    if (input.latitude !== undefined && input.longitude !== undefined) {
      patch.location = toEwktPoint(input.longitude, input.latitude);
    }

    const { data, error } = await client
      .from('addresses')
      .update(patch)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select(ADDRESS_COLUMNS)
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to update address.');
      throw new AuthBackendUnavailableException();
    }

    if (!data) return null;

    const defaultAddressId =
      input.setAsDefaultTutorAddress && tutorProfileId
        ? await this.setTutorDefaultAddress(tutorProfileId, data.id)
        : await this.loadTutorDefaultAddressId(userId);

    return this.withDefaultAddressFlag([data], defaultAddressId)[0]!;
  }

  async deleteOwnAddress(userId: string, addressId: string): Promise<boolean> {
    const client = this.getClient();
    const existing = await this.loadOwnAddress(userId, addressId);
    if (!existing) return false;

    const activeProviderBase = await client
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('base_address_id', addressId)
      .eq('status', 'active')
      .maybeSingle();

    if (activeProviderBase.error) {
      this.logger.error(
        { code: activeProviderBase.error.code },
        'Failed to check active provider base address before delete.',
      );
      throw new AuthBackendUnavailableException();
    }

    if (activeProviderBase.data) {
      throw new DomainException(
        ErrorCode.CONFLICT,
        'Pause your provider listing before deleting its base address.',
        {},
        HttpStatus.CONFLICT,
      );
    }

    const { data, error } = await client
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to delete address.');
      throw new AuthBackendUnavailableException();
    }

    return Boolean(data);
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
  async softDeletePet(tutorProfileId: string, petId: string): Promise<boolean> {
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

  /**
   * Lista prestadores próximos do condomínio (endereço padrão) do tutor.
   * Delega à RPC `providers_list_near`, que já projeta o contrato seguro:
   * distância apenas APROXIMADA, sem telefone, endereço completo ou coordenadas.
   */
  async listProviders(
    userId: string,
    filter: ListProvidersFilter,
  ): Promise<ProviderRecord[]> {
    const client = this.getClient();
    const { data, error } = await client.rpc('providers_list_near', {
      p_user_id: userId,
      p_category: filter.categoryId,
      p_search: filter.q,
      p_limit: filter.limit,
      p_offset: filter.offset,
    });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list providers.');
      throw new AuthBackendUnavailableException();
    }

    return this.withProviderAvatarFallbacks((data ?? []) as ProviderRecord[]);
  }

  /** Detalhe de um prestador. `null` = inexistente, removido ou inativo. */
  async getProvider(
    userId: string,
    providerId: string,
  ): Promise<ProviderRecord | null> {
    const client = this.getClient();
    const { data, error } = await client.rpc('providers_get_one', {
      p_user_id: userId,
      p_provider_id: providerId,
    });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load provider.');
      throw new AuthBackendUnavailableException();
    }

    const rows = await this.withProviderAvatarFallbacks(
      (data ?? []) as ProviderRecord[],
    );
    return rows[0] ?? null;
  }

  /**
   * Horários ocupados de um prestador num dia. `null` = prestador inexistente
   * ou removido. Só conta reservas ativas (`requested`/`confirmed`).
   */
  private async withProviderAvatarFallbacks(
    records: ProviderRecord[],
  ): Promise<ProviderRecord[]> {
    const idsMissingAvatar = records
      .filter((record) => !record.avatar_url)
      .map((record) => record.id);
    if (idsMissingAvatar.length === 0) return records;

    const avatarUrls = await this.loadProviderOwnerAvatarUrls(idsMissingAvatar);
    if (avatarUrls.size === 0) return records;

    return records.map((record) =>
      record.avatar_url
        ? record
        : { ...record, avatar_url: avatarUrls.get(record.id) ?? null },
    );
  }

  private async loadProviderOwnerAvatarUrls(
    providerIds: readonly string[],
  ): Promise<Map<string, string>> {
    const avatarUrls = new Map<string, string>();
    const uniqueProviderIds = [...new Set(providerIds)];
    if (uniqueProviderIds.length === 0) return avatarUrls;

    const client = this.getClient();
    const providers = await client
      .from('providers')
      .select('id,provider_profile_id')
      .in('id', uniqueProviderIds);

    if (providers.error) {
      this.logger.error(
        { code: providers.error.code },
        'Failed to load provider owner avatar providers.',
      );
      throw new AuthBackendUnavailableException();
    }

    const profileIds = [
      ...new Set((providers.data ?? []).map((row) => row.provider_profile_id)),
    ];
    if (profileIds.length === 0) return avatarUrls;

    const profiles = await client
      .from('provider_profiles')
      .select('id,user_id')
      .in('id', profileIds);

    if (profiles.error) {
      this.logger.error(
        { code: profiles.error.code },
        'Failed to load provider owner avatar profiles.',
      );
      throw new AuthBackendUnavailableException();
    }

    const profileUserIds = new Map(
      (profiles.data ?? []).map((row) => [row.id, row.user_id] as const),
    );
    const userIds = [...new Set([...profileUserIds.values()])];
    if (userIds.length === 0) return avatarUrls;

    const users = await client
      .from('users')
      .select('id,avatar_url')
      .in('id', userIds)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (users.error) {
      this.logger.error(
        { code: users.error.code },
        'Failed to load provider owner avatar users.',
      );
      throw new AuthBackendUnavailableException();
    }

    const userAvatarPaths = new Map(
      (users.data ?? [])
        .filter((row) => Boolean(row.avatar_url))
        .map((row) => [row.id, row.avatar_url as string] as const),
    );
    if (userAvatarPaths.size === 0) return avatarUrls;

    const signedUrlsByPath = new Map<string, string>();
    for (const path of new Set(userAvatarPaths.values())) {
      const signedUrl = await this.createAvatarSignedUrl(path);
      if (signedUrl) signedUrlsByPath.set(path, signedUrl);
    }

    for (const provider of providers.data ?? []) {
      const userId = profileUserIds.get(provider.provider_profile_id);
      const path = userId ? userAvatarPaths.get(userId) : null;
      const signedUrl = path ? signedUrlsByPath.get(path) : null;
      if (signedUrl) avatarUrls.set(provider.id, signedUrl);
    }

    return avatarUrls;
  }

  private async createAvatarSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await this.storageClient.storage
      .from('avatars')
      .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      this.logger.warn(
        { code: error?.name },
        'Failed to sign avatar fallback.',
      );
      return null;
    }

    return data.signedUrl;
  }

  async getProviderAvailability(
    providerId: string,
    date: string,
  ): Promise<ProviderAvailabilitySlotState | null> {
    const client = this.getClient();

    const providerUserId = await this.loadActiveProviderUserId(providerId);
    if (!providerUserId) return null;

    const provider = await client
      .from('providers')
      .select('provider_profile_id')
      .eq('id', providerId)
      .is('deleted_at', null)
      .maybeSingle();

    if (provider.error) {
      this.logger.error(
        { code: provider.error.code },
        'Failed to load provider profile for availability.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!provider.data) return null;

    const weekday = weekdayForDate(date);
    const rules = await client
      .from('provider_availability_rules')
      .select('time_slot_id')
      .eq('provider_profile_id', provider.data.provider_profile_id)
      .eq('weekday', weekday)
      .eq('is_active', true);

    if (rules.error) {
      this.logger.error(
        { code: rules.error.code },
        'Failed to load provider weekly availability.',
      );
      throw new AuthBackendUnavailableException();
    }

    const slots = await client
      .from('booking_slots')
      .select('time_slot_id')
      .eq('provider_id', providerId)
      .eq('booking_date', date)
      .in('status', [...ACTIVE_BOOKING_STATUSES]);

    if (slots.error) {
      this.logger.error(
        { code: slots.error.code },
        'Failed to load availability.',
      );
      throw new AuthBackendUnavailableException();
    }

    return {
      configuredSlotIds: (rules.data ?? []).map((row) => row.time_slot_id),
      occupiedSlotIds: (slots.data ?? []).map((row) => row.time_slot_id),
    };
  }

  async getOwnProviderWeeklyAvailability(
    user: AuthUser,
  ): Promise<ProviderAvailabilityDayInput[]> {
    const providerProfileId = requireProviderProfileId(user);
    return this.loadProviderWeeklyAvailability(providerProfileId);
  }

  async updateOwnProviderWeeklyAvailability(
    user: AuthUser,
    input: ProviderWeeklyAvailabilityInput,
  ): Promise<ProviderAvailabilityDayInput[]> {
    const providerProfileId = requireProviderProfileId(user);
    const client = this.getClient();

    const deleted = await client
      .from('provider_availability_rules')
      .delete()
      .eq('provider_profile_id', providerProfileId);

    if (deleted.error) {
      this.logger.error(
        { code: deleted.error.code },
        'Failed to clear provider weekly availability.',
      );
      throw new AuthBackendUnavailableException();
    }

    const rows = input.days.flatMap((day) =>
      day.timeSlotIds.map((timeSlotId) => ({
        provider_profile_id: providerProfileId,
        time_slot_id: timeSlotId,
        weekday: day.weekday,
      })),
    );

    if (rows.length > 0) {
      const inserted = await client
        .from('provider_availability_rules')
        .insert(rows);

      if (inserted.error) {
        this.logger.error(
          { code: inserted.error.code },
          'Failed to save provider weekly availability.',
        );
        throw new AuthBackendUnavailableException();
      }
    }

    return this.loadProviderWeeklyAvailability(providerProfileId);
  }

  private async loadProviderWeeklyAvailability(
    providerProfileId: string,
  ): Promise<ProviderAvailabilityDayInput[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('provider_availability_rules')
      .select('weekday,time_slot_id')
      .eq('provider_profile_id', providerProfileId)
      .eq('is_active', true)
      .order('weekday', { ascending: true })
      .order('time_slot_id', { ascending: true });

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load provider weekly availability.',
      );
      throw new AuthBackendUnavailableException();
    }

    const byWeekday = new Map<number, string[]>();
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      byWeekday.set(weekday, []);
    }
    for (const row of data ?? []) {
      byWeekday.get(row.weekday)?.push(row.time_slot_id);
    }

    return [...byWeekday.entries()].map(([weekday, timeSlotIds]) => ({
      weekday,
      timeSlotIds: timeSlotIds as ProviderAvailabilityDayInput['timeSlotIds'],
    }));
  }

  /** Reservas do usuario autenticado, como tutor ou cuidador. */
  async listBookingsForUser(
    user: AuthUser,
    query: BookingListQuery,
  ): Promise<PaginatedResult<BookingRecord>> {
    const pages: BookingRecord[][] = [];
    const includeTutor =
      query.perspective === null || query.perspective === 'tutor';
    const includeProvider =
      query.perspective === null || query.perspective === 'provider';

    if (includeTutor && user.profiles?.tutor?.id) {
      const tutorPage = await this.listBookings(user.profiles.tutor.id, query);
      pages.push(
        tutorPage.items.map((record) => ({
          ...record,
          viewer_role: combineBookingViewerRole(record.viewer_role, 'tutor'),
        })),
      );
    }

    if (
      includeProvider &&
      user.profiles?.provider?.id &&
      user.profiles.provider.status === 'active'
    ) {
      const providerPage = await this.listProviderBookings(
        user.profiles.provider.id,
        query,
      );
      pages.push(
        providerPage.items.map((record) => ({
          ...record,
          viewer_role: combineBookingViewerRole(record.viewer_role, 'provider'),
        })),
      );
    }

    const merged = mergeBookingParticipantViews(pages.flat())
      .sort(compareBookingRecords)
      .slice(0, query.limit + 1);

    const decorated = await this.attachBookingParticipantSummaries(
      merged,
      query.perspective,
    );

    return buildPaginatedResult(decorated, query.limit, encodeBookingCursor);
  }

  /** Reservas do tutor autenticado, escopadas pelo `tutor_profile_id`. */
  async listBookings(
    tutorProfileId: string,
    input: BookingListQuery | CursorPaginationQuery,
  ): Promise<PaginatedResult<BookingRecord>> {
    const listQuery = normaliseBookingListQuery(input);
    const client = this.getClient();
    let dbQuery = client
      .from('bookings')
      .select(BOOKING_INTERNAL_COLUMNS)
      .eq('tutor_profile_id', tutorProfileId);

    if (listQuery.status) {
      dbQuery = dbQuery.eq('status', listQuery.status);
    }

    if (listQuery.cursor) {
      const cursor = decodeBookingCursor(listQuery.cursor);
      dbQuery = dbQuery.or(
        [
          `booking_date.lt.${cursor.bookingDate}`,
          `and(booking_date.eq.${cursor.bookingDate},created_at.lt.${cursor.createdAt})`,
          `and(booking_date.eq.${cursor.bookingDate},created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await dbQuery
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, listQuery.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list bookings.');
      throw new AuthBackendUnavailableException();
    }

    const records = await this.attachBookingSlotIds(data ?? []);

    return buildPaginatedResult(records, listQuery.limit, encodeBookingCursor);
  }

  private async listProviderBookings(
    providerProfileId: string,
    listQuery: BookingListQuery,
  ): Promise<PaginatedResult<BookingRecord>> {
    const client = this.getClient();
    const providerIds = await this.loadProviderIdsForProfile(providerProfileId);
    if (providerIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    let dbQuery = client
      .from('bookings')
      .select(BOOKING_INTERNAL_COLUMNS)
      .in('provider_id', providerIds);

    if (listQuery.status) {
      dbQuery = dbQuery.eq('status', listQuery.status);
    }

    if (listQuery.cursor) {
      const cursor = decodeBookingCursor(listQuery.cursor);
      dbQuery = dbQuery.or(
        [
          `booking_date.lt.${cursor.bookingDate}`,
          `and(booking_date.eq.${cursor.bookingDate},created_at.lt.${cursor.createdAt})`,
          `and(booking_date.eq.${cursor.bookingDate},created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await dbQuery
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, listQuery.limit);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to list provider bookings.',
      );
      throw new AuthBackendUnavailableException();
    }

    const records = await this.attachBookingSlotIds(data ?? []);

    return buildPaginatedResult(records, listQuery.limit, encodeBookingCursor);
  }

  private async attachBookingSlotIds(
    records: BookingRecord[],
  ): Promise<BookingRecord[]> {
    if (records.length === 0) return records;
    const client = this.getClient();
    const bookingIds = records.map((record) => record.id);
    const { data, error } = await client
      .from('booking_slots')
      .select('booking_id,time_slot_id')
      .in('booking_id', bookingIds)
      .order('time_slot_id', { ascending: true });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load booking slots.');
      throw new AuthBackendUnavailableException();
    }

    const slotsByBooking = new Map<string, string[]>();
    for (const row of data ?? []) {
      const slots = slotsByBooking.get(row.booking_id) ?? [];
      slots.push(row.time_slot_id);
      slotsByBooking.set(row.booking_id, slots);
    }

    return records.map((record) => ({
      ...record,
      time_slot_ids: slotsByBooking.get(record.id) ?? [record.time_slot_id],
    }));
  }

  private async attachBookingParticipantSummaries(
    records: BookingRecord[],
    perspective: BookingPerspective | null = null,
  ): Promise<BookingRecord[]> {
    if (records.length === 0) return records;

    const [providerCounterparts, tutorCounterparts, petNames] =
      await Promise.all([
        this.loadBookingProviderCounterparts(
          records.map((record) => record.provider_id),
        ),
        this.loadBookingTutorCounterparts(
          records
            .map((record) => record.tutor_profile_id)
            .filter((id): id is string => Boolean(id)),
        ),
        this.loadBookingPetNames(records.map((record) => record.pet_id)),
      ]);

    return records.map((record) => {
      const provider = providerCounterparts.get(record.provider_id);
      const tutor = record.tutor_profile_id
        ? tutorCounterparts.get(record.tutor_profile_id)
        : null;
      const counterpartRole = resolveBookingCounterpartRole(
        record,
        perspective,
      );
      const counterpart =
        counterpartRole === 'provider'
          ? provider
          : counterpartRole === 'tutor'
            ? tutor
            : null;

      return {
        ...record,
        pet_name: petNames.get(record.pet_id) ?? null,
        provider_name: provider?.displayName ?? null,
        tutor_name: tutor?.displayName ?? null,
        counterpart_name: counterpart?.displayName ?? null,
        counterpart_avatar_url: counterpart?.avatarUrl ?? null,
        counterpart_role: counterpartRole,
        booking_group_key: buildBookingGroupKey(record),
      };
    });
  }

  private async loadBookingProviderCounterparts(
    providerIds: readonly string[],
  ): Promise<Map<string, { avatarUrl: string | null; displayName: string }>> {
    const uniqueIds = [...new Set(providerIds)].filter(Boolean);
    const counterparts = new Map<
      string,
      { avatarUrl: string | null; displayName: string }
    >();
    if (uniqueIds.length === 0) return counterparts;

    const client = this.getClient();
    const providers = await client
      .from('providers')
      .select('id,provider_profile_id,service_label,avatar_url')
      .in('id', uniqueIds);

    if (providers.error) {
      this.logger.error(
        { code: providers.error.code },
        'Failed to load booking provider counterparts.',
      );
      throw new AuthBackendUnavailableException();
    }

    const profileIds = [
      ...new Set((providers.data ?? []).map((row) => row.provider_profile_id)),
    ].filter(Boolean);
    const profiles = profileIds.length
      ? await client
          .from('provider_profiles')
          .select('id,display_name,user_id')
          .in('id', profileIds)
      : null;

    if (profiles?.error) {
      this.logger.error(
        { code: profiles.error.code },
        'Failed to load booking provider profile counterparts.',
      );
      throw new AuthBackendUnavailableException();
    }

    const profilesById = new Map(
      (profiles?.data ?? []).map((row) => [row.id, row] as const),
    );
    const userAvatarUrls = await this.loadSignedUserAvatarUrls(
      (profiles?.data ?? []).map((row) => row.user_id),
      'Failed to load booking provider avatar users.',
    );

    for (const provider of providers.data ?? []) {
      const profile = profilesById.get(provider.provider_profile_id);
      counterparts.set(provider.id, {
        avatarUrl:
          sanitisePublicAvatarUrl(provider.avatar_url) ??
          (profile ? (userAvatarUrls.get(profile.user_id) ?? null) : null),
        displayName:
          profile?.display_name ?? provider.service_label ?? 'Provider',
      });
    }

    return counterparts;
  }

  private async loadBookingTutorCounterparts(
    tutorProfileIds: readonly string[],
  ): Promise<Map<string, { avatarUrl: string | null; displayName: string }>> {
    const uniqueIds = [...new Set(tutorProfileIds)].filter(Boolean);
    const counterparts = new Map<
      string,
      { avatarUrl: string | null; displayName: string }
    >();
    if (uniqueIds.length === 0) return counterparts;

    const { data, error } = await this.getClient()
      .from('tutor_profiles')
      .select('id,display_name,user_id')
      .in('id', uniqueIds);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load booking tutor counterparts.',
      );
      throw new AuthBackendUnavailableException();
    }

    const userAvatarUrls = await this.loadSignedUserAvatarUrls(
      (data ?? []).map((row) => row.user_id),
      'Failed to load booking tutor avatar users.',
    );

    for (const tutor of data ?? []) {
      counterparts.set(tutor.id, {
        avatarUrl: userAvatarUrls.get(tutor.user_id) ?? null,
        displayName: tutor.display_name,
      });
    }

    return counterparts;
  }

  private async loadBookingPetNames(
    petIds: readonly string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(petIds)].filter(Boolean);
    const names = new Map<string, string>();
    if (uniqueIds.length === 0) return names;

    const { data, error } = await this.getClient()
      .from('pets')
      .select('id,name')
      .in('id', uniqueIds);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load booking pet names.',
      );
      throw new AuthBackendUnavailableException();
    }

    for (const pet of data ?? []) {
      names.set(pet.id, pet.name);
    }

    return names;
  }

  /**
   * Cria uma reserva `requested`. Garante que o pet é do tutor e que o
   * prestador está ativo; mapeia colisão de slot (23505) para HTTP 409.
   */
  async createBooking(
    tutorProfileId: string,
    input: CreateBookingInput,
  ): Promise<BookingRecord> {
    const client = this.getClient();

    const pet = await client
      .from('pets')
      .select('id')
      .eq('id', input.petId)
      .eq('tutor_profile_id', tutorProfileId)
      .is('deleted_at', null)
      .maybeSingle();

    if (pet.error) {
      this.logger.error({ code: pet.error.code }, 'Failed to load pet.');
      throw new AuthBackendUnavailableException();
    }
    if (!pet.data) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Pet not found for this tutor.',
        {},
        HttpStatus.NOT_FOUND,
      );
    }

    const providerUserId = await this.loadActiveProviderUserId(
      input.providerId,
    );
    if (!providerUserId) {
      throw providerNotFound();
    }

    const provider = await client
      .from('providers')
      .select('price_per_hour')
      .eq('id', input.providerId)
      .is('deleted_at', null)
      .maybeSingle();

    if (provider.error) {
      this.logger.error(
        { code: provider.error.code },
        'Failed to load provider price for booking.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!provider.data) throw providerNotFound();

    const availability = await this.getProviderAvailability(
      input.providerId,
      input.date,
    );
    if (!availability) throw providerNotFound();
    const configured = new Set(availability.configuredSlotIds);
    const occupied = new Set(availability.occupiedSlotIds);
    const hasUnconfiguredSlot = input.timeSlotIds.some(
      (slot) => !configured.has(slot),
    );
    if (hasUnconfiguredSlot) {
      throw bookingValidationError(
        'Selected time slots are not in this provider availability.',
      );
    }
    const hasOccupiedSlot = input.timeSlotIds.some((slot) =>
      occupied.has(slot),
    );
    if (hasOccupiedSlot) throw bookingSlotTaken();

    const { data, error } = await client.rpc('create_booking_with_slots', {
      p_booking_date: input.date,
      p_currency: 'GBP',
      p_pet_id: input.petId,
      p_price_per_hour: provider.data.price_per_hour,
      p_provider_id: input.providerId,
      p_service_label: input.service,
      p_time_slot_ids: input.timeSlotIds,
      p_tutor_profile_id: tutorProfileId,
    });

    const row = data?.[0];

    if (error || !row) {
      if (error?.code === '23505') throw bookingSlotTaken();
      this.logger.error({ code: error?.code }, 'Failed to create booking.');
      throw new AuthBackendUnavailableException();
    }

    // Garante que o tutor e o provider compartilhem uma conversa vinculada
    // ao booking. Se já existir cold-start sem `booking_id`, anexa esta
    // reserva. Se já existir vinculada a outro booking, mantém. Se nada
    // existir, cria nova. Falha aqui é registrada mas NUNCA derruba o
    // booking — UX cai no botão "Conversar" do perfil do provider.
    await this.attachConversationToBooking(
      tutorProfileId,
      input.providerId,
      row.id,
    );

    return row;
  }

  /**
   * Conecta a conversa do par (tutor, provider) ao booking recém-criado.
   * Best-effort: erros são logados, mas a reserva é o efeito primário.
   */
  private async attachConversationToBooking(
    tutorProfileId: string,
    providerId: string,
    bookingId: string,
  ): Promise<void> {
    const client = this.getClient();

    try {
      const existing = await client
        .from('conversations')
        .select('id,booking_id')
        .eq('tutor_profile_id', tutorProfileId)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (existing.error) {
        this.logger.error(
          { code: existing.error.code },
          'Failed to locate conversation for booking attach.',
        );
        return;
      }

      if (existing.data) {
        if (existing.data.booking_id !== null) return;
        const updated = await client
          .from('conversations')
          .update({
            booking_id: bookingId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id);
        if (updated.error) {
          this.logger.error(
            { code: updated.error.code },
            'Failed to attach booking_id to existing conversation.',
          );
        }
        return;
      }

      const inserted = await client
        .from('conversations')
        .insert({
          tutor_profile_id: tutorProfileId,
          provider_id: providerId,
          booking_id: bookingId,
        })
        .select('id');

      if (inserted.error && inserted.error.code !== '23505') {
        this.logger.error(
          { code: inserted.error.code },
          'Failed to create conversation for booking.',
        );
      }
    } catch (err) {
      this.logger.error(
        { err },
        'Unexpected failure while attaching conversation to booking.',
      );
    }
  }

  /**
   * Altera o status de uma reserva. `null` = reserva inexistente ou em que o
   * usuário não é participante. Transições inválidas lançam HTTP 409.
   */
  async updateBookingStatus(
    user: AuthUser,
    bookingId: string,
    nextStatus: BookingStatus,
  ): Promise<BookingRecord | null> {
    const client = this.getClient();

    const booking = await client
      .from('bookings')
      .select(`${BOOKING_COLUMNS},tutor_profile_id`)
      .eq('id', bookingId)
      .maybeSingle();

    if (booking.error) {
      this.logger.error(
        { code: booking.error.code },
        'Failed to load booking.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!booking.data) return null;

    const tutorProfileId = user.profiles?.tutor?.id;
    const providerProfileId = user.profiles?.provider?.id;
    const actorCandidates: ('tutor' | 'provider')[] = [];
    if (tutorProfileId && booking.data.tutor_profile_id === tutorProfileId) {
      actorCandidates.push('tutor');
    }

    if (providerProfileId) {
      const provider = await client
        .from('providers')
        .select('provider_profile_id')
        .eq('id', booking.data.provider_id)
        .maybeSingle();

      if (provider.error) {
        this.logger.error(
          { code: provider.error.code },
          'Failed to resolve booking provider.',
        );
        throw new AuthBackendUnavailableException();
      }

      if (provider.data?.provider_profile_id === providerProfileId) {
        const providerUserId = await this.loadActiveProviderUserId(
          booking.data.provider_id,
        );
        if (providerUserId !== user.id) return null;
        actorCandidates.push('provider');
      }
    }

    if (actorCandidates.length === 0) return null;

    let actor: 'tutor' | 'provider' | null = null;
    let forbiddenTransition: unknown = null;
    for (const candidate of actorCandidates) {
      try {
        assertBookingTransition(booking.data.status, nextStatus, candidate);
        actor = candidate;
        break;
      } catch (error) {
        forbiddenTransition ??= error;
      }
    }
    if (!actor) throw forbiddenTransition;

    const { data, error } = await client
      .from('bookings')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select(BOOKING_COLUMNS)
      .single();

    if (error || !data) {
      this.logger.error(
        { code: error?.code },
        'Failed to update booking status.',
      );
      throw new AuthBackendUnavailableException();
    }

    const slots = await client
      .from('booking_slots')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId);

    if (slots.error) {
      this.logger.error(
        { code: slots.error.code },
        'Failed to update booking slot statuses.',
      );
      throw new AuthBackendUnavailableException();
    }

    const [record] = await this.attachBookingSlotIds([data]);
    return record ?? data;
  }

  /**
   * Conversas do usuario autenticado, seja ele tutor ou cuidador.
   * Mantem o contrato publico unico da aba Chat, mas troca o ponto de vista
   * para que `unread` e o remetente da mensagem funcionem nos dois lados.
   */
  async listConversationsForUser(
    user: AuthUser,
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<ConversationRecord>> {
    const pages: ConversationRecord[][] = [];

    if (user.profiles?.tutor?.id) {
      const tutorPage = await this.listConversations(
        user.profiles.tutor.id,
        pagination,
      );
      pages.push(tutorPage.items);
    }

    if (user.profiles?.provider?.id) {
      const providerPage = await this.listProviderConversations(
        user.profiles.provider.id,
        pagination,
      );
      pages.push(providerPage.items);
    }

    const merged = pages
      .flat()
      .sort(compareConversationRecords)
      .slice(0, pagination.limit + 1);

    return buildPaginatedResult(
      merged,
      pagination.limit,
      encodeConversationCursor,
    );
  }

  /** Conversas do tutor, mais recentes primeiro. */
  async listConversations(
    tutorProfileId: string,
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<ConversationRecord>> {
    const client = this.getClient();
    let query = client
      .from('conversations')
      .select(CONVERSATION_COLUMNS)
      .eq('tutor_profile_id', tutorProfileId);

    if (pagination.cursor) {
      const cursor = decodeConversationCursor(pagination.cursor);
      query =
        cursor.lastMessageAt === null
          ? query.or(
              [
                `and(last_message_at.is.null,created_at.lt.${cursor.createdAt})`,
                `and(last_message_at.is.null,created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
              ].join(','),
            )
          : query.or(
              [
                `last_message_at.lt.${cursor.lastMessageAt}`,
                `and(last_message_at.eq.${cursor.lastMessageAt},created_at.lt.${cursor.createdAt})`,
                `and(last_message_at.eq.${cursor.lastMessageAt},created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
                'last_message_at.is.null',
              ].join(','),
            );
    }

    const { data, error } = await query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list conversations.');
      throw new AuthBackendUnavailableException();
    }

    const records = (data ?? []).map((row) => ({
      ...row,
      viewer_is_provider: false,
    }));
    const providerCounterparts =
      await this.loadProviderConversationCounterparts(
        records.map((row) => row.provider_id),
      );
    const recordsWithCounterparts = records.map((row): ConversationRecord => {
      const counterpart = providerCounterparts.get(row.provider_id);

      return {
        ...row,
        counterpart_name: counterpart?.displayName ?? null,
        counterpart_avatar_url: counterpart?.avatarUrl ?? null,
        counterpart_service_label: counterpart?.serviceLabel ?? null,
      };
    });

    return buildPaginatedResult(
      recordsWithCounterparts,
      pagination.limit,
      encodeConversationCursor,
    );
  }

  /** Conversas recebidas pelo cuidador dono do provider_profile. */
  private async listProviderConversations(
    providerProfileId: string,
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<ConversationRecord>> {
    const client = this.getClient();
    const providerIds = await this.loadProviderIdsForProfile(providerProfileId);
    if (providerIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    let query = client
      .from('conversations')
      .select(`${CONVERSATION_COLUMNS},tutor_profile_id`)
      .in('provider_id', providerIds);

    if (pagination.cursor) {
      const cursor = decodeConversationCursor(pagination.cursor);
      query =
        cursor.lastMessageAt === null
          ? query.or(
              [
                `and(last_message_at.is.null,created_at.lt.${cursor.createdAt})`,
                `and(last_message_at.is.null,created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
              ].join(','),
            )
          : query.or(
              [
                `last_message_at.lt.${cursor.lastMessageAt}`,
                `and(last_message_at.eq.${cursor.lastMessageAt},created_at.lt.${cursor.createdAt})`,
                `and(last_message_at.eq.${cursor.lastMessageAt},created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
                'last_message_at.is.null',
              ].join(','),
            );
    }

    const { data, error } = await query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to list provider conversations.',
      );
      throw new AuthBackendUnavailableException();
    }

    const rows = data ?? [];
    const tutorCounterparts = await this.loadTutorConversationCounterparts(
      rows.map((row) => row.tutor_profile_id),
    );
    const records = rows.map((row): ConversationRecord => {
      const counterpart = tutorCounterparts.get(row.tutor_profile_id);

      return {
        id: row.id,
        provider_id: row.provider_id,
        last_message_text: row.last_message_text,
        last_message_at: row.last_message_at,
        last_message_from_provider: row.last_message_from_provider,
        created_at: row.created_at,
        counterpart_name: counterpart?.displayName ?? 'Pet tutor',
        counterpart_avatar_url: counterpart?.avatarUrl ?? null,
        counterpart_service_label: 'Tutor conversation',
        viewer_is_provider: true,
      };
    });

    return buildPaginatedResult(
      records,
      pagination.limit,
      encodeConversationCursor,
    );
  }

  /**
   * Abre (ou retoma) a conversa direta entre o tutor e um provider.
   *
   * Contrato:
   * - `null` quando o provider não existe (ou está soft-deleted) — controller
   *   traduz para 404 genérico, sem revelar a causa exata.
   * - Lança `conversationBlocked()` se há bloqueio em qualquer direção.
   * - Lança `conversationColdStartRateLimited()` se o tutor já abriu
   *   `CONVERSATION_COLD_START_HOURLY_LIMIT` conversas cold-start na última
   *   janela (`CONVERSATION_COLD_START_WINDOW_MS`).
   * - Idempotente: se a conversa já existe (vinda de cold-start anterior OU
   *   anexada a um booking) devolve a mesma linha sem clobber.
   */
  async openConversation(
    tutorUserId: string,
    tutorProfileId: string,
    providerId: string,
  ): Promise<ConversationRecord | null> {
    const providerUserId = await this.loadActiveProviderUserId(providerId);
    if (!providerUserId) return null;

    if (providerUserId === tutorUserId) {
      // self-target — tratamos como 404 genérico para não revelar identidade.
      return null;
    }

    if (await this.isConversationBlocked(tutorUserId, providerUserId)) {
      throw conversationBlocked();
    }

    // Idempotencia e rate-limit ficam na RPC para serializar count+insert por
    // tutor e evitar estouro do limite sob concorrencia.
    return this.openColdStartConversation(tutorProfileId, providerId);
  }

  /**
   * Resolve `user_id` do provider ativo (role provider, não soft-deleted,
   * perfil `active`). `null` quando o listing não é um provider público válido.
   */
  private async loadActiveProviderUserId(
    providerId: string,
  ): Promise<string | null> {
    const client = this.getClient();
    const provider = await client
      .from('providers')
      .select('provider_profile_id,deleted_at')
      .eq('id', providerId)
      .maybeSingle();

    if (provider.error) {
      this.logger.error(
        { code: provider.error.code },
        'Failed to load provider for conversation open.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!provider.data || provider.data.deleted_at) return null;

    const profile = await client
      .from('provider_profiles')
      .select('user_id,status')
      .eq('id', provider.data.provider_profile_id)
      .maybeSingle();

    if (profile.error) {
      this.logger.error(
        { code: profile.error.code },
        'Failed to load provider profile for conversation open.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!profile.data || profile.data.status !== 'active') return null;

    const role = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.data.user_id)
      .eq('role', 'provider')
      .maybeSingle();

    if (role.error) {
      this.logger.error(
        { code: role.error.code },
        'Failed to load provider role for conversation open.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!role.data) return null;

    const owner = await client
      .from('users')
      .select('id')
      .eq('id', profile.data.user_id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    if (owner.error) {
      this.logger.error(
        { code: owner.error.code },
        'Failed to load provider owner for conversation open.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!owner.data) return null;

    return profile.data.user_id;
  }

  /**
   * Abertura cold-start atomica no banco. A RPC serializa por tutor com
   * advisory lock transacional, re-seleciona conversa existente antes do count
   * e aplica count+insert como uma secao critica.
   */
  private async openColdStartConversation(
    tutorProfileId: string,
    providerId: string,
  ): Promise<ConversationRecord> {
    const client = this.getClient();
    const windowStart = new Date(
      Date.now() - CONVERSATION_COLD_START_WINDOW_MS,
    ).toISOString();

    const { data, error } = await client.rpc('conversations_open_cold_start', {
      p_tutor_profile_id: tutorProfileId,
      p_provider_id: providerId,
      p_limit: CONVERSATION_COLD_START_HOURLY_LIMIT,
      p_window_start: windowStart,
    });

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to open cold-start conversation atomically.',
      );
      throw new AuthBackendUnavailableException();
    }

    const row = data?.[0];
    if (!row) {
      this.logger.error('Cold-start conversation RPC returned no rows.');
      throw new AuthBackendUnavailableException();
    }

    if (row.status === 'rate_limited') {
      throw conversationColdStartRateLimited();
    }

    if (row.status !== 'ok' || !row.id || !row.provider_id) {
      this.logger.error(
        { status: row.status },
        'Cold-start conversation RPC returned an invalid row.',
      );
      throw new AuthBackendUnavailableException();
    }

    const providerCounterparts =
      await this.loadProviderConversationCounterparts([row.provider_id]);
    const counterpart = providerCounterparts.get(row.provider_id);

    return {
      id: row.id,
      provider_id: row.provider_id,
      last_message_text: row.last_message_text,
      last_message_at: row.last_message_at,
      last_message_from_provider: row.last_message_from_provider ?? false,
      counterpart_name: counterpart?.displayName ?? null,
      counterpart_avatar_url: counterpart?.avatarUrl ?? null,
      counterpart_service_label: counterpart?.serviceLabel ?? null,
      viewer_is_provider: false,
    };
  }

  /**
   * Mensagens de uma conversa do tutor. `null` = conversa inexistente ou de
   * outro tutor (o controller traduz para 404 genérico).
   */
  async listMessagesForUser(
    user: AuthUser,
    conversationId: string,
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<MessageRecord> | null> {
    const context = await this.loadConversationParticipantContext(
      user,
      conversationId,
    );
    if (!context) return null;

    return this.listMessagesByConversationId(conversationId, pagination);
  }

  async listMessages(
    tutorProfileId: string,
    conversationId: string,
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<MessageRecord> | null> {
    const client = this.getClient();
    const owned = await this.loadOwnedConversationId(
      tutorProfileId,
      conversationId,
    );
    if (!owned) return null;

    let query = client
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', conversationId);

    if (pagination.cursor) {
      const cursor = decodeMessageCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.gt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list messages.');
      throw new AuthBackendUnavailableException();
    }

    return buildPaginatedResult(
      data ?? [],
      pagination.limit,
      encodeMessageCursor,
    );
  }

  private async listMessagesByConversationId(
    conversationId: string,
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<MessageRecord>> {
    const client = this.getClient();
    let query = client
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', conversationId);

    if (pagination.cursor) {
      const cursor = decodeMessageCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.gt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list messages.');
      throw new AuthBackendUnavailableException();
    }

    return buildPaginatedResult(
      data ?? [],
      pagination.limit,
      encodeMessageCursor,
    );
  }

  /**
   * Cria uma mensagem do tutor e atualiza o resumo da conversa.
   * `null` = conversa inexistente ou de outro tutor.
   */
  async createMessageForUser(
    user: AuthUser,
    conversationId: string,
    text: string,
  ): Promise<MessageRecord | null> {
    const context = await this.loadConversationParticipantContext(
      user,
      conversationId,
    );
    if (!context) return null;

    if (
      await this.isConversationBlocked(
        context.tutorUserId,
        context.providerUserId,
      )
    ) {
      throw conversationBlocked();
    }

    return this.insertConversationMessage({
      conversationId,
      fromProvider: context.actor === 'provider',
      text,
    });
  }

  async createMessage(
    tutorUserId: string,
    tutorProfileId: string,
    conversationId: string,
    text: string,
  ): Promise<MessageRecord | null> {
    const client = this.getClient();
    const context = await this.loadOwnedConversationContext(
      tutorProfileId,
      conversationId,
    );
    if (!context) return null;
    const providerUserId = await this.loadActiveProviderUserId(
      context.providerId,
    );
    if (providerUserId !== context.providerUserId) return null;

    if (await this.isConversationBlocked(tutorUserId, context.providerUserId)) {
      throw conversationBlocked();
    }

    const inserted = await client
      .from('messages')
      .insert({
        conversation_id: conversationId,
        from_provider: false,
        body: text,
      })
      .select(MESSAGE_COLUMNS)
      .single();

    if (inserted.error || !inserted.data) {
      this.logger.error(
        { code: inserted.error?.code },
        'Failed to create message.',
      );
      throw new AuthBackendUnavailableException();
    }

    const summary = await client
      .from('conversations')
      .update({
        last_message_text: text,
        last_message_at: inserted.data.created_at,
        last_message_from_provider: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (summary.error) {
      this.logger.error(
        { code: summary.error.code },
        'Failed to update conversation summary.',
      );
      throw new AuthBackendUnavailableException();
    }

    return inserted.data;
  }

  private async insertConversationMessage(input: {
    conversationId: string;
    fromProvider: boolean;
    text: string;
  }): Promise<MessageRecord> {
    const client = this.getClient();
    const inserted = await client
      .from('messages')
      .insert({
        conversation_id: input.conversationId,
        from_provider: input.fromProvider,
        body: input.text,
      })
      .select(MESSAGE_COLUMNS)
      .single();

    if (inserted.error || !inserted.data) {
      this.logger.error(
        { code: inserted.error?.code },
        'Failed to create message.',
      );
      throw new AuthBackendUnavailableException();
    }

    const summary = await client
      .from('conversations')
      .update({
        last_message_text: input.text,
        last_message_at: inserted.data.created_at,
        last_message_from_provider: input.fromProvider,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.conversationId);

    if (summary.error) {
      this.logger.error(
        { code: summary.error.code },
        'Failed to update conversation summary.',
      );
      throw new AuthBackendUnavailableException();
    }

    return inserted.data;
  }

  /** Retorna o id da conversa se ela pertence ao tutor; senão `null`. */
  async createTrustSafetyReport(
    user: AuthUser,
    input: CreateReportInput,
  ): Promise<ReportRecord | null> {
    const tutorProfileId = user.profiles?.tutor?.id;
    if (!tutorProfileId) return null;

    const conversationId =
      input.targetType === 'conversation'
        ? input.targetId
        : await this.loadMessageConversationId(input.targetId);
    if (!conversationId) return null;

    const context = await this.loadOwnedConversationContext(
      tutorProfileId,
      conversationId,
    );
    if (!context) return null;

    const client = this.getClient();
    const { data, error } = await client
      .from('reports')
      .insert({
        reporter_user_id: user.id,
        reported_user_id: context.providerUserId,
        target_type: input.targetType,
        target_id: input.targetId,
        conversation_id: context.id,
        message_id: input.targetType === 'message' ? input.targetId : null,
        category: input.category,
        description: input.description,
      })
      .select(REPORT_COLUMNS)
      .single();

    if (error || !data) {
      this.logger.error({ code: error?.code }, 'Failed to create report.');
      throw new AuthBackendUnavailableException();
    }

    return data;
  }

  async blockConversationParticipant(
    user: AuthUser,
    conversationId: string,
  ): Promise<UserBlockRecord | null> {
    const tutorProfileId = user.profiles?.tutor?.id;
    if (!tutorProfileId) return null;

    const context = await this.loadOwnedConversationContext(
      tutorProfileId,
      conversationId,
    );
    if (!context) return null;
    if (context.providerUserId === user.id) return null;

    const client = this.getClient();
    const { data, error } = await client
      .from('user_blocks')
      .upsert(
        {
          blocker_user_id: user.id,
          blocked_user_id: context.providerUserId,
          conversation_id: context.id,
          reason: 'chat_safety',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'blocker_user_id,blocked_user_id' },
      )
      .select(USER_BLOCK_COLUMNS)
      .single();

    if (error || !data) {
      this.logger.error({ code: error?.code }, 'Failed to block user.');
      throw new AuthBackendUnavailableException();
    }

    return data;
  }

  async getAdminDashboardSummary(): Promise<AdminDashboardRecord> {
    const client = this.getClient();
    const bookingCountRequests = BOOKING_STATUSES.map((status) =>
      client
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', status),
    );

    const [
      totalUsersResult,
      totalTutorsResult,
      totalProvidersResult,
      blockedUsersResult,
      openReportsResult,
      ...bookingCountResults
    ] = await Promise.all([
      client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
      client
        .from('tutor_profiles')
        .select('id', { count: 'exact', head: true }),
      client
        .from('provider_profiles')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'deleted'),
      client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'blocked')
        .is('deleted_at', null),
      client
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .in('status', [...ADMIN_OPEN_REPORT_STATUSES]),
      ...bookingCountRequests,
    ]);

    const bookingsByStatus: Record<BookingStatus, number> = {
      cancelled: 0,
      completed: 0,
      confirmed: 0,
      requested: 0,
    };

    for (const [index, status] of BOOKING_STATUSES.entries()) {
      const result = bookingCountResults[index];
      if (!result) {
        throw new AuthBackendUnavailableException();
      }
      bookingsByStatus[status] = this.readSupabaseCount(
        result,
        `Failed to count admin bookings with status ${status}.`,
      );
    }

    return {
      blocked_users: this.readSupabaseCount(
        blockedUsersResult,
        'Failed to count blocked admin users.',
      ),
      bookings_by_status: bookingsByStatus,
      open_reports: this.readSupabaseCount(
        openReportsResult,
        'Failed to count open admin reports.',
      ),
      total_providers: this.readSupabaseCount(
        totalProvidersResult,
        'Failed to count admin providers.',
      ),
      total_tutors: this.readSupabaseCount(
        totalTutorsResult,
        'Failed to count admin tutors.',
      ),
      total_users: this.readSupabaseCount(
        totalUsersResult,
        'Failed to count admin users.',
      ),
    };
  }

  async listAdminUsers(
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<AdminUserRecord>> {
    const client = this.getClient();
    let query = client.from('users').select(ADMIN_USER_COLUMNS);

    if (pagination.cursor) {
      const cursor = decodeAdminUserCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.lt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list admin users.');
      throw new AuthBackendUnavailableException();
    }

    const rows = data ?? [];
    const rolesByUserId = await this.loadRolesForUsers(
      rows.map((row) => row.id),
    );
    const records = rows.map((row): AdminUserRecord => {
      const roles = rolesByUserId.get(row.id) ?? [];

      return {
        created_at: row.created_at,
        email: row.email,
        id: row.id,
        roles,
        status: row.deleted_at ? 'deleted' : row.status,
        updated_at: row.updated_at,
      };
    });

    return buildPaginatedResult(
      records,
      pagination.limit,
      encodeAdminUserCursor,
    );
  }

  async updateAdminUserStatusWithAudit(
    adminUserId: string,
    targetUserId: string,
    input: UpdateAdminUserStatusInput,
  ): Promise<AdminUserRecord | null> {
    const client = this.getClient();
    const { data: existing, error: existingError } = await client
      .from('users')
      .select(ADMIN_USER_COLUMNS)
      .eq('id', targetUserId)
      .maybeSingle();

    if (existingError) {
      this.logger.error(
        { code: existingError.code },
        'Failed to load admin user before status update.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!existing) return null;

    const previousStatus: UserStatus = existing.deleted_at
      ? 'deleted'
      : existing.status;
    if (previousStatus === 'deleted') {
      throw new DomainException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Deleted users cannot be updated by admin status actions.',
        {},
        HttpStatus.CONFLICT,
      );
    }
    if (adminUserId === targetUserId && input.status === 'blocked') {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'Admins cannot block their own account.',
        {},
        HttpStatus.FORBIDDEN,
      );
    }

    const now = new Date().toISOString();
    const row =
      previousStatus === input.status
        ? existing
        : await this.persistAdminUserStatus(targetUserId, input.status, now);

    const operation = input.status === 'blocked' ? 'block' : 'reactivate';
    await this.appendAuditLog({
      action:
        input.status === 'blocked'
          ? 'admin.user_status_blocked'
          : 'admin.user_status_reactivated',
      actorUserId: adminUserId,
      metadata: {
        changed: previousStatus !== input.status,
        newStatus: input.status,
        operation,
        previousStatus,
      },
      targetId: targetUserId,
      targetType: 'user',
    });

    const rolesByUserId = await this.loadRolesForUsers([targetUserId]);
    return {
      created_at: row.created_at,
      email: row.email,
      id: row.id,
      roles: rolesByUserId.get(row.id) ?? [],
      status: row.deleted_at ? 'deleted' : row.status,
      updated_at: row.updated_at,
    };
  }

  private async persistAdminUserStatus(
    targetUserId: string,
    status: Exclude<UserStatus, 'deleted'>,
    updatedAt: string,
  ) {
    const client = this.getClient();
    const { data, error } = await client
      .from('users')
      .update({
        status,
        updated_at: updatedAt,
      })
      .eq('id', targetUserId)
      .is('deleted_at', null)
      .select(ADMIN_USER_COLUMNS)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to update admin user status.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!data) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Admin user not found.',
        {},
        HttpStatus.NOT_FOUND,
      );
    }

    return data;
  }

  async listAdminProviders(
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<AdminProviderRecord>> {
    const client = this.getClient();
    let query = client.from('provider_profiles').select(ADMIN_PROVIDER_COLUMNS);

    if (pagination.cursor) {
      const cursor = decodeAdminProviderCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.lt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to list admin providers.',
      );
      throw new AuthBackendUnavailableException();
    }

    const rows = data ?? [];
    const serviceCounts = await this.loadProviderServiceCounts(
      rows.map((row) => row.id),
    );
    const records = rows.map(
      (row): AdminProviderRecord => ({
        created_at: row.created_at,
        display_name: row.display_name,
        id: row.id,
        service_count: serviceCounts.get(row.id) ?? 0,
        status: row.status,
        updated_at: row.updated_at,
      }),
    );

    return buildPaginatedResult(
      records,
      pagination.limit,
      encodeAdminProviderCursor,
    );
  }

  async listAdminBookings(
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<AdminBookingRecord>> {
    const client = this.getClient();
    let query = client.from('bookings').select(ADMIN_BOOKING_COLUMNS);

    if (pagination.cursor) {
      const cursor = decodeAdminBookingCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.lt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list admin bookings.');
      throw new AuthBackendUnavailableException();
    }

    return buildPaginatedResult(
      data ?? [],
      pagination.limit,
      encodeAdminBookingCursor,
    );
  }

  async listAdminAuditLogs(
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<AdminAuditLogRecord>> {
    const client = this.getClient();
    let query = client.from('audit_logs').select(ADMIN_AUDIT_LOG_COLUMNS);

    if (pagination.cursor) {
      const cursor = decodeAdminAuditLogCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.lt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to list admin audit logs.',
      );
      throw new AuthBackendUnavailableException();
    }

    return buildPaginatedResult(
      data ?? [],
      pagination.limit,
      encodeAdminAuditLogCursor,
    );
  }

  async appendAuditLog(input: AppendAuditLogInput): Promise<void> {
    const client = this.getClient();
    const { error } = await client.from('audit_logs').insert({
      action: input.action,
      actor_user_id: input.actorUserId,
      metadata: input.metadata,
      target_id: input.targetId,
      target_type: input.targetType,
    });

    if (error) {
      this.logger.error(
        {
          code: error.code,
          action: input.action,
          targetType: input.targetType,
        },
        'Failed to append audit log.',
      );
      throw new AuthBackendUnavailableException();
    }
  }

  async listAdminReports(
    pagination: CursorPaginationQuery,
  ): Promise<PaginatedResult<ReportRecord>> {
    const client = this.getClient();
    let query = client.from('reports').select(REPORT_COLUMNS);

    if (pagination.cursor) {
      const cursor = decodeReportCursor(pagination.cursor);
      query = query.or(
        [
          `created_at.lt.${cursor.createdAt}`,
          `and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        ].join(','),
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(0, pagination.limit);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list reports.');
      throw new AuthBackendUnavailableException();
    }

    return buildPaginatedResult(
      data ?? [],
      pagination.limit,
      encodeReportCursor,
    );
  }

  async updateAdminReportStatusWithAudit(
    adminUserId: string,
    reportId: string,
    input: UpdateReportInput,
  ): Promise<ReportRecord | null> {
    const client = this.getClient();
    const { data, error } = await client
      .rpc('admin_update_report_status_with_audit', {
        p_admin_user_id: adminUserId,
        p_report_id: reportId,
        p_status: input.status,
        p_internal_note: input.internalNote,
      })
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to update report status with audit.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data ?? null;
  }

  private async loadOwnedConversationId(
    tutorProfileId: string,
    conversationId: string,
  ): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('tutor_profile_id', tutorProfileId)
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load conversation.');
      throw new AuthBackendUnavailableException();
    }

    return data?.id ?? null;
  }

  private async loadConversationParticipantContext(
    user: AuthUser,
    conversationId: string,
  ): Promise<ConversationParticipantContext | null> {
    const client = this.getClient();
    const { data: conversation, error: conversationError } = await client
      .from('conversations')
      .select('id,provider_id,tutor_profile_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) {
      this.logger.error(
        { code: conversationError.code },
        'Failed to load participant conversation context.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!conversation) return null;

    const provider = await client
      .from('providers')
      .select('provider_profile_id')
      .eq('id', conversation.provider_id)
      .maybeSingle();

    if (provider.error || !provider.data) {
      this.logger.error(
        { code: provider.error?.code },
        'Failed to load participant conversation provider.',
      );
      throw new AuthBackendUnavailableException();
    }

    const providerUserId = await this.loadActiveProviderUserId(
      conversation.provider_id,
    );
    if (!providerUserId) return null;
    const tutorUserId = await this.loadTutorUserId(
      conversation.tutor_profile_id,
    );
    if (!tutorUserId) return null;

    if (user.profiles?.tutor?.id === conversation.tutor_profile_id) {
      return {
        actor: 'tutor',
        id: conversation.id,
        providerId: conversation.provider_id,
        providerUserId,
        tutorProfileId: conversation.tutor_profile_id,
        tutorUserId,
      };
    }

    if (
      user.profiles?.provider?.id === provider.data.provider_profile_id &&
      providerUserId === user.id
    ) {
      return {
        actor: 'provider',
        id: conversation.id,
        providerId: conversation.provider_id,
        providerUserId,
        tutorProfileId: conversation.tutor_profile_id,
        tutorUserId,
      };
    }

    return null;
  }

  private async loadOwnedConversationContext(
    tutorProfileId: string,
    conversationId: string,
  ): Promise<ConversationParticipantContext | null> {
    const client = this.getClient();
    const { data: conversation, error: conversationError } = await client
      .from('conversations')
      .select('id,provider_id')
      .eq('id', conversationId)
      .eq('tutor_profile_id', tutorProfileId)
      .maybeSingle();

    if (conversationError) {
      this.logger.error(
        { code: conversationError.code },
        'Failed to load conversation context.',
      );
      throw new AuthBackendUnavailableException();
    }

    if (!conversation) return null;

    const { data: provider, error: providerError } = await client
      .from('providers')
      .select('provider_profile_id')
      .eq('id', conversation.provider_id)
      .maybeSingle();

    if (providerError || !provider) {
      this.logger.error(
        { code: providerError?.code },
        'Failed to load conversation provider.',
      );
      throw new AuthBackendUnavailableException();
    }

    const { data: profile, error: profileError } = await client
      .from('provider_profiles')
      .select('user_id')
      .eq('id', provider.provider_profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      this.logger.error(
        { code: profileError?.code },
        'Failed to load conversation provider profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    return {
      actor: 'tutor',
      id: conversation.id,
      providerId: conversation.provider_id,
      providerUserId: profile.user_id,
      tutorProfileId,
      tutorUserId: '',
    };
  }

  private async loadMessageConversationId(
    messageId: string,
  ): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('messages')
      .select('conversation_id')
      .eq('id', messageId)
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load message target.');
      throw new AuthBackendUnavailableException();
    }

    return data?.conversation_id ?? null;
  }

  private async isConversationBlocked(
    tutorUserId: string,
    providerUserId: string,
  ): Promise<boolean> {
    const client = this.getClient();
    const { data, error } = await client
      .from('user_blocks')
      .select('id')
      .in('blocker_user_id', [tutorUserId, providerUserId])
      .in('blocked_user_id', [tutorUserId, providerUserId])
      .limit(1);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load user block.');
      throw new AuthBackendUnavailableException();
    }

    return (data?.length ?? 0) > 0;
  }

  private async loadAuthUserById(userId: string): Promise<AuthUser> {
    const client = this.getClient();
    const { data: user, error: userError } = await client
      .from('users')
      .select(
        'id,email,status,locale,created_at,updated_at,deleted_at,avatar_url',
      )
      .eq('id', userId)
      .single();

    if (userError || !user) {
      this.logger.error(
        { code: userError?.code },
        'Failed to load public user.',
      );
      throw new AuthBackendUnavailableException();
    }

    const roles = await this.loadOrCreateRoles(user.id);

    return {
      id: user.id,
      email: user.email,
      roles,
      status: user.deleted_at ? 'deleted' : user.status,
      locale: user.locale,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      avatarPath: user.avatar_url ?? null,
      profiles: await this.loadSafeProfiles(user.id, {
        includeTutorProfile: roles.includes('tutor'),
        includeProviderProfile: roles.includes('provider'),
        ensureTutorProfile:
          roles.includes('tutor') &&
          user.status === 'active' &&
          !user.deleted_at,
        ensureProviderProfile:
          roles.includes('provider') &&
          user.status === 'active' &&
          !user.deleted_at,
      }),
    };
  }

  /**
   * Storage-flavoured Supabase client. Used by AvatarService; never exposed
   * to controllers directly to keep the storage path opaque to the contract.
   */
  get storageClient(): SupabaseClient<Database> {
    return this.getClient();
  }

  /** Read the stored avatar object path for a user, or null when unset. */
  async getAvatarPath(userId: string): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to read user avatar path.',
      );
      throw new AuthBackendUnavailableException();
    }
    return data?.avatar_url ?? null;
  }

  /** Persist (or clear) the avatar object path for a user. */
  async setAvatarPath(
    userId: string,
    avatarPath: string | null,
  ): Promise<void> {
    const client = this.getClient();
    const { error } = await client
      .from('users')
      .update({
        avatar_url: avatarPath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .is('deleted_at', null);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to persist user avatar path.',
      );
      throw new AuthBackendUnavailableException();
    }
  }

  private readSupabaseCount(
    result: SupabaseCountResult,
    message: string,
  ): number {
    if (result.error) {
      this.logger.error({ code: result.error.code }, message);
      throw new AuthBackendUnavailableException();
    }

    if (result.count === null) {
      this.logger.error(message);
      throw new AuthBackendUnavailableException();
    }

    return result.count;
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

  private async loadRolesForUsers(
    userIds: readonly string[],
  ): Promise<Map<string, Role[]>> {
    const rolesByUserId = new Map<string, Role[]>();
    if (userIds.length === 0) return rolesByUserId;

    const client = this.getClient();
    const { data, error } = await client
      .from('user_roles')
      .select('user_id,role')
      .in('user_id', [...userIds]);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load admin roles.');
      throw new AuthBackendUnavailableException();
    }

    for (const row of data ?? []) {
      if (!VALID_ROLES.includes(row.role)) continue;

      const roles = rolesByUserId.get(row.user_id) ?? [];
      roles.push(row.role);
      rolesByUserId.set(row.user_id, roles);
    }

    return rolesByUserId;
  }

  private async loadProviderServiceCounts(
    providerProfileIds: readonly string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (providerProfileIds.length === 0) return counts;

    const client = this.getClient();
    const { data, error } = await client
      .from('providers')
      .select('provider_profile_id')
      .in('provider_profile_id', [...providerProfileIds])
      .is('deleted_at', null);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load provider service counts.',
      );
      throw new AuthBackendUnavailableException();
    }

    for (const row of data ?? []) {
      counts.set(
        row.provider_profile_id,
        (counts.get(row.provider_profile_id) ?? 0) + 1,
      );
    }

    return counts;
  }

  private async loadProviderIdsForProfile(
    providerProfileId: string,
  ): Promise<string[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('providers')
      .select('id')
      .eq('provider_profile_id', providerProfileId)
      .is('deleted_at', null);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load provider ids for profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    return (data ?? []).map((row) => row.id);
  }

  private async loadProviderConversationCounterparts(
    providerIds: readonly string[],
  ): Promise<
    Map<
      string,
      {
        avatarUrl: string | null;
        displayName: string;
        serviceLabel: string | null;
      }
    >
  > {
    const counterparts = new Map<
      string,
      {
        avatarUrl: string | null;
        displayName: string;
        serviceLabel: string | null;
      }
    >();
    const uniqueIds = [...new Set(providerIds)].filter(Boolean);
    if (uniqueIds.length === 0) return counterparts;

    const client = this.getClient();
    const { data: providers, error: providersError } = await client
      .from('providers')
      .select('id,provider_profile_id,service_label,avatar_url')
      .in('id', uniqueIds)
      .is('deleted_at', null);

    if (providersError) {
      this.logger.error(
        { code: providersError.code },
        'Failed to load provider counterparts for conversations.',
      );
      throw new AuthBackendUnavailableException();
    }

    const profileIds = [
      ...new Set((providers ?? []).map((row) => row.provider_profile_id)),
    ];
    if (profileIds.length === 0) return counterparts;

    const { data: profiles, error: profilesError } = await client
      .from('provider_profiles')
      .select('id,display_name,user_id')
      .in('id', profileIds)
      .eq('status', 'active');

    if (profilesError) {
      this.logger.error(
        { code: profilesError.code },
        'Failed to load provider profile counterparts for conversations.',
      );
      throw new AuthBackendUnavailableException();
    }

    const profilesById = new Map(
      (profiles ?? []).map((row) => [row.id, row] as const),
    );
    const ownerAvatarUrls = await this.loadSignedUserAvatarUrls(
      (profiles ?? []).map((row) => row.user_id),
      'Failed to load provider avatar users for conversations.',
    );

    for (const provider of providers ?? []) {
      const profile = profilesById.get(provider.provider_profile_id);
      if (!profile) continue;

      counterparts.set(provider.id, {
        avatarUrl:
          provider.avatar_url ?? ownerAvatarUrls.get(profile.user_id) ?? null,
        displayName: profile.display_name,
        serviceLabel: provider.service_label ?? null,
      });
    }

    return counterparts;
  }

  private async loadTutorConversationCounterparts(
    tutorProfileIds: readonly string[],
  ): Promise<Map<string, { avatarUrl: string | null; displayName: string }>> {
    const counterparts = new Map<
      string,
      { avatarUrl: string | null; displayName: string }
    >();
    const uniqueIds = [...new Set(tutorProfileIds)].filter(Boolean);
    if (uniqueIds.length === 0) return counterparts;

    const client = this.getClient();
    const { data, error } = await client
      .from('tutor_profiles')
      .select('id,display_name,user_id')
      .in('id', uniqueIds);

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load tutor counterparts for conversations.',
      );
      throw new AuthBackendUnavailableException();
    }

    const userAvatarUrls = await this.loadSignedUserAvatarUrls(
      (data ?? []).map((row) => row.user_id),
      'Failed to load tutor avatar users for conversations.',
    );

    for (const row of data ?? []) {
      counterparts.set(row.id, {
        avatarUrl: userAvatarUrls.get(row.user_id) ?? null,
        displayName: row.display_name,
      });
    }

    return counterparts;
  }

  private async loadSignedUserAvatarUrls(
    userIds: readonly string[],
    errorMessage: string,
  ): Promise<Map<string, string>> {
    const avatarUrls = new Map<string, string>();
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) return avatarUrls;

    const client = this.getClient();
    const users = await client
      .from('users')
      .select('id,avatar_url')
      .in('id', uniqueIds)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (users.error) {
      this.logger.error({ code: users.error.code }, errorMessage);
      throw new AuthBackendUnavailableException();
    }

    const userAvatarPaths = new Map(
      (users.data ?? [])
        .filter((row) => Boolean(row.avatar_url))
        .map((row) => [row.id, row.avatar_url as string] as const),
    );
    if (userAvatarPaths.size === 0) return avatarUrls;

    const signedUrlsByPath = new Map<string, string>();
    for (const path of new Set(userAvatarPaths.values())) {
      const signedUrl = await this.createAvatarSignedUrl(path);
      if (signedUrl) signedUrlsByPath.set(path, signedUrl);
    }

    for (const [userId, path] of userAvatarPaths) {
      const signedUrl = signedUrlsByPath.get(path);
      if (signedUrl) avatarUrls.set(userId, signedUrl);
    }

    return avatarUrls;
  }

  private async loadTutorUserId(
    tutorProfileId: string,
  ): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('tutor_profiles')
      .select('user_id')
      .eq('id', tutorProfileId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load tutor owner for conversation.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data?.user_id ?? null;
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

    const fallbackProfile = await this.createOwnTutorProfile(userId, {
      displayName: 'Pet tutor',
    });
    if (!fallbackProfile) {
      this.logger.error('Fallback tutor profile RPC returned no rows.');
      throw new AuthBackendUnavailableException();
    }

    return [DEFAULT_ROLE];
  }

  private async loadSafeProfiles(
    userId: string,
    options: {
      ensureTutorProfile?: boolean;
      ensureProviderProfile?: boolean;
      includeTutorProfile?: boolean;
      includeProviderProfile?: boolean;
    } = {},
  ): Promise<AuthUser['profiles']> {
    const tutorProfilePromise: Promise<TutorProfileSummary | null> =
      options.includeTutorProfile
        ? options.ensureTutorProfile
          ? this.loadOrCreateTutorProfile(userId)
          : this.loadTutorProfile(userId)
        : Promise.resolve(null);

    const providerProfilePromise: Promise<ProviderProfileSummary | null> =
      options.includeProviderProfile
        ? options.ensureProviderProfile
          ? this.loadOrCreateProviderProfile(userId)
          : this.loadProviderProfile(userId)
        : Promise.resolve(null);

    const [tutor, provider] = await Promise.all([
      tutorProfilePromise,
      providerProfilePromise,
    ]);

    return {
      ...(tutor ? { tutor } : {}),
      ...(provider ? { provider } : {}),
    };
  }

  private async loadOrCreateTutorProfile(
    userId: string,
  ): Promise<TutorProfileSummary> {
    const existing = await this.loadTutorProfile(userId);
    if (existing) return existing;

    const data = await this.createOwnTutorProfile(userId, {
      displayName: 'Pet tutor',
    });

    if (!data) {
      this.logger.error('Failed to create fallback tutor profile.');
      throw new AuthBackendUnavailableException();
    }

    return {
      id: data.id,
      displayName: data.display_name,
      defaultAddressId: null,
    };
  }

  private async loadOrCreateProviderProfile(
    userId: string,
  ): Promise<ProviderProfileSummary> {
    const existing = await this.loadProviderProfile(userId);
    if (existing) return existing;

    const data = await this.createOwnProviderProfile(userId, {
      displayName: 'Pet provider',
    });

    if (!data) {
      this.logger.error('Failed to create fallback provider profile.');
      throw new AuthBackendUnavailableException();
    }

    return {
      bio: data.bio,
      categoryId: data.category ?? null,
      id: data.id,
      displayName: data.display_name,
      isAvailable: data.is_available ?? null,
      listingId: data.listing_id ?? null,
      pricePerHour: data.price_per_hour ?? null,
      service: data.service_label ?? null,
      status: data.status,
      serviceRadiusKm: data.service_radius_km,
      ratingAverage: data.rating_average,
      ratingCount: data.rating_count,
    };
  }

  private async loadTutorProfile(
    userId: string,
  ): Promise<TutorProfileSummary | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('tutor_profiles')
      .select('id,display_name,default_address_id')
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
      defaultAddressId: data.default_address_id ?? null,
    };
  }

  private async loadTutorDefaultAddressId(
    userId: string,
  ): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('tutor_profiles')
      .select('default_address_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load tutor default address.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data?.default_address_id ?? null;
  }

  private async loadOwnAddress(
    userId: string,
    addressId: string,
  ): Promise<AddressRecord | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('addresses')
      .select(ADDRESS_COLUMNS)
      .eq('id', addressId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load address.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? null;
  }

  private async setTutorDefaultAddress(
    tutorProfileId: string,
    addressId: string,
  ): Promise<string> {
    const client = this.getClient();
    const { error } = await client
      .from('tutor_profiles')
      .update({ default_address_id: addressId })
      .eq('id', tutorProfileId)
      .select('id')
      .single();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to set tutor default address.',
      );
      throw new AuthBackendUnavailableException();
    }

    return addressId;
  }

  private withDefaultAddressFlag(
    addresses: AddressRecord[],
    defaultAddressId: string | null,
  ): AddressWithDefaultRecord[] {
    return addresses.map((address) => ({
      ...address,
      isDefaultTutorAddress: address.id === defaultAddressId,
    }));
  }

  private async loadProviderProfileRecord(
    userId: string,
  ): Promise<ProviderProfileRecord | null> {
    const client = this.getClient();
    const { data: profile, error } = await client
      .from('provider_profiles')
      .select(PROVIDER_PROFILE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load provider profile record.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!profile) return null;

    const { data: listing, error: listingError } = await client
      .from('providers')
      .select(
        'id,category,service_label,avatar_url,price_per_hour,is_available',
      )
      .eq('provider_profile_id', profile.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (listingError) {
      this.logger.error(
        { code: listingError.code },
        'Failed to load provider listing record.',
      );
      throw new AuthBackendUnavailableException();
    }

    return {
      ...profile,
      listing_id: listing?.id ?? null,
      category: listing?.category ?? null,
      service_label: listing?.service_label ?? null,
      avatar_url: listing?.avatar_url ?? null,
      price_per_hour: listing?.price_per_hour ?? null,
      is_available: listing?.is_available ?? null,
    };
  }

  private async upsertOwnProviderListing(
    userId: string,
    providerProfileId: string,
    input: ProviderProfileInput,
  ): Promise<void> {
    if (input.baseAddressId !== undefined && input.baseAddressId !== null) {
      const address = await this.loadOwnAddress(userId, input.baseAddressId);
      if (!address) {
        throw new DomainException(
          ErrorCode.NOT_FOUND,
          'Provider base address not found.',
          {},
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (input.publish) {
      const effectiveBaseAddressId =
        input.baseAddressId !== undefined
          ? input.baseAddressId
          : await this.loadProviderBaseAddressId(providerProfileId);
      if (!effectiveBaseAddressId) {
        throw new DomainException(
          ErrorCode.VALIDATION_ERROR,
          'A base address is required before publishing your provider listing.',
          {},
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const hasListingInput =
      input.categoryId !== undefined ||
      input.service !== undefined ||
      input.pricePerHour !== undefined ||
      input.isAvailable !== undefined ||
      input.publish !== undefined;
    if (!hasListingInput) return;

    const client = this.getClient();
    const existing = await client
      .from('providers')
      .select('id,category,service_label,price_per_hour,is_available')
      .eq('provider_profile_id', providerProfileId)
      .maybeSingle();

    if (existing.error) {
      this.logger.error(
        { code: existing.error.code },
        'Failed to load provider listing before upsert.',
      );
      throw new AuthBackendUnavailableException();
    }

    const category = input.categoryId ?? existing.data?.category;
    const service = input.service ?? existing.data?.service_label;
    const pricePerHour = input.pricePerHour ?? existing.data?.price_per_hour;
    const isAvailable =
      input.isAvailable ?? existing.data?.is_available ?? true;

    if (
      !category ||
      !service ||
      pricePerHour === undefined ||
      pricePerHour === null
    ) {
      if (input.publish) {
        throw new DomainException(
          ErrorCode.VALIDATION_ERROR,
          'categoryId, service and pricePerHour are required before publishing.',
          {},
          HttpStatus.BAD_REQUEST,
        );
      }
      return;
    }

    const payload = {
      category,
      is_available: isAvailable,
      price_per_hour: pricePerHour,
      service_label: service,
    };

    const result = existing.data
      ? await client
          .from('providers')
          .update({ ...payload, deleted_at: null })
          .eq('id', existing.data.id)
          .select('id')
          .maybeSingle()
      : await client
          .from('providers')
          .insert({ ...payload, provider_profile_id: providerProfileId })
          .select('id')
          .maybeSingle();

    if (result.error) {
      this.logger.error(
        { code: result.error.code },
        'Failed to upsert provider listing.',
      );
      throw new AuthBackendUnavailableException();
    }
  }

  private async loadProviderBaseAddressId(
    providerProfileId: string,
  ): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('provider_profiles')
      .select('base_address_id')
      .eq('id', providerProfileId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        { code: error.code },
        'Failed to load provider base address.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data?.base_address_id ?? null;
  }

  private async loadProviderProfile(
    userId: string,
  ): Promise<ProviderProfileSummary | null> {
    const data = await this.loadProviderProfileRecord(userId);
    if (!data) return null;
    return {
      bio: data.bio,
      categoryId: data.category ?? null,
      id: data.id,
      displayName: data.display_name,
      isAvailable: data.is_available ?? null,
      listingId: data.listing_id ?? null,
      pricePerHour: data.price_per_hour ?? null,
      status: data.status,
      service: data.service_label ?? null,
      serviceRadiusKm: data.service_radius_km,
      ratingAverage: data.rating_average,
      ratingCount: data.rating_count,
    };
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private estimateDeletionCompletionAt(): string {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + thirtyDaysMs).toISOString();
  }
}

interface BookingCursor {
  bookingDate: string;
  createdAt: string;
  id: string;
}

interface ConversationCursor {
  lastMessageAt: string | null;
  createdAt: string;
  id: string;
}

interface CreatedAtCursor {
  createdAt: string;
  id: string;
}

function encodeBookingCursor(record: BookingRecord): string {
  return encodePaginationCursor({
    kind: 'bookings',
    bookingDate: record.booking_date,
    createdAt: record.created_at,
    id: record.id,
  });
}

function decodeBookingCursor(cursor: string): BookingCursor {
  const payload = decodePaginationCursor(cursor, 'bookings');
  return {
    bookingDate: readCursorDate(payload, 'bookingDate'),
    createdAt: readCursorIsoDateTime(payload, 'createdAt'),
    id: readCursorUuid(payload, 'id'),
  };
}

function encodeConversationCursor(record: ConversationRecord): string {
  if (!record.created_at) {
    throw new AuthBackendUnavailableException();
  }

  return encodePaginationCursor({
    kind: 'conversations',
    lastMessageAt: record.last_message_at,
    createdAt: record.created_at,
    id: record.id,
  });
}

function decodeConversationCursor(cursor: string): ConversationCursor {
  const payload = decodePaginationCursor(cursor, 'conversations');
  return {
    lastMessageAt: readCursorNullableIsoDateTime(payload, 'lastMessageAt'),
    createdAt: readCursorIsoDateTime(payload, 'createdAt'),
    id: readCursorUuid(payload, 'id'),
  };
}

function encodeMessageCursor(record: MessageRecord): string {
  return encodePaginationCursor({
    kind: 'messages',
    createdAt: record.created_at,
    id: record.id,
  });
}

function decodeMessageCursor(cursor: string): CreatedAtCursor {
  return decodeCreatedAtCursor(cursor, 'messages');
}

function encodeAdminUserCursor(record: AdminUserRecord): string {
  return encodeCreatedAtCursor('admin-users', record);
}

function decodeAdminUserCursor(cursor: string): CreatedAtCursor {
  return decodeCreatedAtCursor(cursor, 'admin-users');
}

function encodeAdminProviderCursor(record: AdminProviderRecord): string {
  return encodeCreatedAtCursor('admin-providers', record);
}

function decodeAdminProviderCursor(cursor: string): CreatedAtCursor {
  return decodeCreatedAtCursor(cursor, 'admin-providers');
}

function encodeAdminBookingCursor(record: AdminBookingRecord): string {
  return encodeCreatedAtCursor('admin-bookings', record);
}

function decodeAdminBookingCursor(cursor: string): CreatedAtCursor {
  return decodeCreatedAtCursor(cursor, 'admin-bookings');
}

function encodeAdminAuditLogCursor(record: AdminAuditLogRecord): string {
  return encodeCreatedAtCursor('admin-audit-logs', record);
}

function decodeAdminAuditLogCursor(cursor: string): CreatedAtCursor {
  return decodeCreatedAtCursor(cursor, 'admin-audit-logs');
}

function encodeReportCursor(record: ReportRecord): string {
  return encodeCreatedAtCursor('admin-reports', record);
}

function decodeReportCursor(cursor: string): CreatedAtCursor {
  return decodeCreatedAtCursor(cursor, 'admin-reports');
}

function encodeCreatedAtCursor(
  kind: string,
  record: { readonly created_at: string; readonly id: string },
): string {
  return encodePaginationCursor({
    kind,
    createdAt: record.created_at,
    id: record.id,
  });
}

function decodeCreatedAtCursor(
  cursor: string,
  expectedKind: string,
): CreatedAtCursor {
  const payload = decodePaginationCursor(cursor, expectedKind);
  return {
    createdAt: readCursorIsoDateTime(payload, 'createdAt'),
    id: readCursorUuid(payload, 'id'),
  };
}

function compareConversationRecords(
  left: ConversationRecord,
  right: ConversationRecord,
): number {
  const leftLast = left.last_message_at
    ? Date.parse(left.last_message_at)
    : Number.NEGATIVE_INFINITY;
  const rightLast = right.last_message_at
    ? Date.parse(right.last_message_at)
    : Number.NEGATIVE_INFINITY;
  if (leftLast !== rightLast) return rightLast - leftLast;

  const leftCreated = left.created_at ? Date.parse(left.created_at) : 0;
  const rightCreated = right.created_at ? Date.parse(right.created_at) : 0;
  if (leftCreated !== rightCreated) return rightCreated - leftCreated;

  return right.id.localeCompare(left.id);
}

function compareBookingRecords(
  left: BookingRecord,
  right: BookingRecord,
): number {
  const dateCompare = right.booking_date.localeCompare(left.booking_date);
  if (dateCompare !== 0) return dateCompare;

  const leftCreated = Date.parse(left.created_at);
  const rightCreated = Date.parse(right.created_at);
  if (leftCreated !== rightCreated) return rightCreated - leftCreated;

  return right.id.localeCompare(left.id);
}

function mergeBookingParticipantViews(
  records: BookingRecord[],
): BookingRecord[] {
  const byId = new Map<string, BookingRecord>();

  for (const record of records) {
    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, record);
      continue;
    }

    byId.set(record.id, {
      ...existing,
      ...record,
      viewer_role: combineBookingViewerRole(
        existing.viewer_role,
        record.viewer_role,
      ),
      time_slot_ids: [
        ...new Set([
          ...(existing.time_slot_ids ?? [existing.time_slot_id]),
          ...(record.time_slot_ids ?? [record.time_slot_id]),
        ]),
      ],
    });
  }

  return [...byId.values()];
}

function combineBookingViewerRole(
  current: BookingViewerRole | null | undefined,
  next: BookingViewerRole | null | undefined,
): BookingViewerRole | null {
  if (!current) return next ?? null;
  if (!next || current === next) return current;
  return 'both';
}

function normaliseBookingListQuery(
  query: BookingListQuery | CursorPaginationQuery,
): BookingListQuery {
  return {
    ...query,
    perspective: 'perspective' in query ? query.perspective : null,
    status: 'status' in query ? query.status : null,
  };
}

function resolveBookingCounterpartRole(
  record: BookingRecord,
  perspective: BookingPerspective | null,
): BookingPerspective | null {
  if (perspective === 'tutor') return 'provider';
  if (perspective === 'provider') return 'tutor';
  if (record.viewer_role === 'provider') return 'tutor';
  if (record.viewer_role === 'tutor') return 'provider';
  if (record.viewer_role === 'both') return 'provider';
  return null;
}

function buildBookingGroupKey(record: BookingRecord): string | null {
  if (!record.tutor_profile_id) return null;
  return createHash('sha256')
    .update(
      [
        'booking-group-v1',
        record.tutor_profile_id,
        record.provider_id,
        record.pet_id,
        record.booking_date,
      ].join(':'),
    )
    .digest('base64url')
    .slice(0, 32);
}

function sanitisePublicAvatarUrl(value: string | null): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

function requireProviderProfileId(user: AuthUser): string {
  const providerProfileId = user.profiles?.provider?.id;
  if (!user.roles.includes('provider') || !providerProfileId) {
    throw new DomainException(
      ErrorCode.NOT_FOUND,
      'Authenticated user has no provider profile.',
      {},
      HttpStatus.NOT_FOUND,
    );
  }
  return providerProfileId;
}

function weekdayForDate(date: string): number {
  const [year, month, day] = date.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function toEwktPoint(longitude: number, latitude: number): string {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}
