import {
  HttpStatus,
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
  TutorProfileInput,
  TutorProfileRecord,
} from '../../users/dto/tutor-profile.dto';
import type {
  ProviderProfileInput,
  ProviderProfileRecord,
} from '../../users/dto/provider-profile.dto';
import type { AccountDeletionRequestRecord } from '../../users/dto/account-deletion-request-response.dto';
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
import type {
  BookingRecord,
  BookingStatus,
} from '../../bookings/dto/booking-fields';
import {
  assertBookingTransition,
  bookingSlotTaken,
} from '../../bookings/dto/booking-fields';
import type { CreateBookingInput } from '../../bookings/dto/create-booking-request.dto';
import type {
  ConversationRecord,
  MessageRecord,
} from '../../conversations/dto/conversation-fields';
import {
  CONVERSATION_COLD_START_HOURLY_LIMIT as COLD_START_LIMIT,
  CONVERSATION_COLD_START_WINDOW_MS as COLD_START_WINDOW_MS,
  conversationColdStartRateLimited,
} from '../../conversations/dto/conversation-fields';
import type { CreateReportInput } from '../../trust-safety/dto/create-report-request.dto';
import {
  conversationBlocked,
  type ReportRecord,
  type UserBlockRecord,
} from '../../trust-safety/dto/trust-safety-fields';
import type { UpdateReportInput } from '../../trust-safety/dto/update-report-request.dto';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';

const DEFAULT_ROLE: Role = 'tutor';
const VALID_ROLES: readonly Role[] = ['tutor', 'provider', 'admin'];

/** Colunas seguras de `public.pets` — exclui `tutor_profile_id`/`deleted_at`. */
const PET_COLUMNS =
  'id,name,species,breed,size,age_range,notes,created_at,updated_at' as const;
const TUTOR_PROFILE_COLUMNS = 'id,display_name,created_at,updated_at' as const;
const PROVIDER_PROFILE_COLUMNS =
  'id,display_name,status,service_radius_km,rating_average,rating_count,created_at,updated_at' as const;
const ADDRESS_COLUMNS =
  'id,label,country_code,city,postcode,public_area_label,location_precision,created_at,updated_at' as const;
/** Colunas seguras de `public.bookings` — exclui `tutor_profile_id`. */
const ACCOUNT_DELETION_REQUEST_COLUMNS =
  'id,status,requested_at,estimated_completion_at,processing_started_at,completed_at,updated_at' as const;
const BOOKING_COLUMNS =
  'id,provider_id,pet_id,service_label,booking_date,time_slot_id,status,created_at,updated_at' as const;
/** Status de booking que ainda ocupam o slot (não cancelado/concluído). */
const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  'requested',
  'confirmed',
];
/** Colunas seguras de `public.conversations` — exclui `tutor_profile_id`. */
const CONVERSATION_COLUMNS =
  'id,provider_id,last_message_text,last_message_at,last_message_from_provider' as const;
const MESSAGE_COLUMNS = 'id,from_provider,body,created_at' as const;
const REPORT_COLUMNS =
  'id,status,category,target_type,target_id,created_at,updated_at' as const;
const USER_BLOCK_COLUMNS =
  'id,blocked_user_id,conversation_id,created_at' as const;

interface ConversationParticipantContext {
  id: string;
  providerId: string;
  providerUserId: string;
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
    const { data, error } = await client
      .from('tutor_profiles')
      .insert({
        user_id: userId,
        display_name: input.displayName,
      })
      .select(TUTOR_PROFILE_COLUMNS)
      .single();

    if (error) {
      if (error.code === '23505') return null;
      this.logger.error(
        { code: error.code },
        'Failed to create tutor profile.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data;
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
      p_display_name: input.displayName,
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
    return row;
  }

  async updateOwnProviderProfile(
    userId: string,
    input: ProviderProfileInput,
  ): Promise<ProviderProfileRecord | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('provider_profiles')
      .update({
        display_name: input.displayName,
      })
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

    return data ?? null;
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

    return (data ?? []) as ProviderRecord[];
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

    const rows = (data ?? []) as ProviderRecord[];
    return rows[0] ?? null;
  }

  /**
   * Horários ocupados de um prestador num dia. `null` = prestador inexistente
   * ou removido. Só conta reservas ativas (`requested`/`confirmed`).
   */
  async getProviderAvailability(
    providerId: string,
    date: string,
  ): Promise<string[] | null> {
    const client = this.getClient();

    const provider = await client
      .from('providers')
      .select('id,deleted_at')
      .eq('id', providerId)
      .maybeSingle();

    if (provider.error) {
      this.logger.error(
        { code: provider.error.code },
        'Failed to load provider for availability.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!provider.data || provider.data.deleted_at) return null;

    const { data, error } = await client
      .from('bookings')
      .select('time_slot_id')
      .eq('provider_id', providerId)
      .eq('booking_date', date)
      .in('status', [...ACTIVE_BOOKING_STATUSES]);

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to load availability.');
      throw new AuthBackendUnavailableException();
    }

    return (data ?? []).map((row) => row.time_slot_id);
  }

  /** Reservas do tutor autenticado, escopadas pelo `tutor_profile_id`. */
  async listBookings(tutorProfileId: string): Promise<BookingRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('tutor_profile_id', tutorProfileId)
      .order('booking_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list bookings.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? [];
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

    const provider = await client
      .from('providers')
      .select('id,provider_profile_id,deleted_at')
      .eq('id', input.providerId)
      .maybeSingle();

    if (provider.error) {
      this.logger.error(
        { code: provider.error.code },
        'Failed to load provider for booking.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!provider.data || provider.data.deleted_at) {
      throw providerNotFound();
    }

    const providerProfile = await client
      .from('provider_profiles')
      .select('status')
      .eq('id', provider.data.provider_profile_id)
      .maybeSingle();

    if (providerProfile.error) {
      this.logger.error(
        { code: providerProfile.error.code },
        'Failed to load provider profile for booking.',
      );
      throw new AuthBackendUnavailableException();
    }
    if (!providerProfile.data || providerProfile.data.status !== 'active') {
      throw providerNotFound();
    }

    const { data, error } = await client
      .from('bookings')
      .insert({
        tutor_profile_id: tutorProfileId,
        provider_id: input.providerId,
        pet_id: input.petId,
        service_label: input.service,
        booking_date: input.date,
        time_slot_id: input.timeSlotId,
      })
      .select(BOOKING_COLUMNS)
      .single();

    if (error || !data) {
      if (error?.code === '23505') throw bookingSlotTaken();
      this.logger.error({ code: error?.code }, 'Failed to create booking.');
      throw new AuthBackendUnavailableException();
    }

    return data;
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

    const tutorProfileId = user.profiles?.tutor?.id;
    const providerProfileId = user.profiles?.provider?.id;
    let actor: 'tutor' | 'provider' | null = null;
    if (tutorProfileId && booking.data.tutor_profile_id === tutorProfileId) {
      actor = 'tutor';
    } else if (
      providerProfileId &&
      provider.data?.provider_profile_id === providerProfileId
    ) {
      actor = 'provider';
    }
    if (!actor) return null;

    assertBookingTransition(booking.data.status, nextStatus, actor);

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

    return data;
  }

  /** Conversas do tutor, mais recentes primeiro. */
  async listConversations(
    tutorProfileId: string,
  ): Promise<ConversationRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('conversations')
      .select(CONVERSATION_COLUMNS)
      .eq('tutor_profile_id', tutorProfileId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list conversations.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? [];
  }

  /**
   * Abre (ou retoma) a conversa direta entre o tutor e um provider.
   *
   * Contrato:
   * - `null` quando o provider nÃ£o existe (ou estÃ¡ soft-deleted) - controller
   *   traduz para 404 genÃ©rico, sem revelar a causa exata.
   * - LanÃ§a `conversationBlocked()` se hÃ¡ bloqueio em qualquer direÃ§Ã£o.
   * - LanÃ§a `conversationColdStartRateLimited()` se o tutor jÃ¡ abriu
   *   `CONVERSATION_COLD_START_HOURLY_LIMIT` conversas cold-start na janela.
   * - Idempotente: se a conversa jÃ¡ existe (vinda de cold-start anterior OU
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
      return null;
    }

    if (await this.isConversationBlocked(tutorUserId, providerUserId)) {
      throw conversationBlocked();
    }

    return this.openColdStartConversation(tutorProfileId, providerId);
  }

  /**
   * Resolve `user_id` do provider ativo (role provider, nÃ£o soft-deleted,
   * perfil `active`). `null` quando o listing nÃ£o Ã© um provider pÃºblico vÃ¡lido.
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
      Date.now() - COLD_START_WINDOW_MS,
    ).toISOString();

    const { data, error } = await client.rpc('conversations_open_cold_start', {
      p_tutor_profile_id: tutorProfileId,
      p_provider_id: providerId,
      p_limit: COLD_START_LIMIT,
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

    return {
      id: row.id,
      provider_id: row.provider_id,
      last_message_text: row.last_message_text,
      last_message_at: row.last_message_at,
      last_message_from_provider: row.last_message_from_provider ?? false,
    };
  }

  /**
   * Mensagens de uma conversa do tutor. `null` = conversa inexistente ou de
   * outro tutor (o controller traduz para 404 genérico).
   */
  async listMessages(
    tutorProfileId: string,
    conversationId: string,
  ): Promise<MessageRecord[] | null> {
    const client = this.getClient();
    const owned = await this.loadOwnedConversationId(
      tutorProfileId,
      conversationId,
    );
    if (!owned) return null;

    const { data, error } = await client
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list messages.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? [];
  }

  /**
   * Cria uma mensagem do tutor e atualiza o resumo da conversa.
   * `null` = conversa inexistente ou de outro tutor.
   */
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
        { code: error.code, action: input.action, targetType: input.targetType },
        'Failed to append audit log.',
      );
      throw new AuthBackendUnavailableException();
    }
  }

  async listAdminReports(): Promise<ReportRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('reports')
      .select(REPORT_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error({ code: error.code }, 'Failed to list reports.');
      throw new AuthBackendUnavailableException();
    }

    return data ?? [];
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
      id: conversation.id,
      providerId: conversation.provider_id,
      providerUserId: profile.user_id,
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

  get storageClient(): SupabaseClient<Database> {
    return this.getClient();
  }

  async getAvatarPath(userId: string): Promise<string | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('users')
      .select('avatar_url')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      if (
        error.code === 'PGRST204' ||
        error.code === '42703' ||
        error.message.toLowerCase().includes('avatar_url')
      ) {
        this.logger.warn(
          { code: error.code },
          'Avatar column is not available in the current database schema.',
        );
        return null;
      }

      this.logger.error(
        { code: error.code },
        'Failed to read user avatar path.',
      );
      throw new AuthBackendUnavailableException();
    }

    return data?.avatar_url ?? null;
  }

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

  private estimateDeletionCompletionAt(): string {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + thirtyDaysMs).toISOString();
  }
}

function toEwktPoint(longitude: number, latitude: number): string {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}
