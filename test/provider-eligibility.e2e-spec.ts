import type { PinoLogger } from 'nestjs-pino';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import { ErrorCode } from '../src/common/errors/error-codes';
import type { AuthUser, Role } from '../src/common/auth/auth-user';

const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';
const PROVIDER_PROFILE_ID = '99999999-8888-4777-8666-000000000001';
const PROVIDER_USER_ID = '46e4ff57-5355-47bb-904b-27ebde394bf7';
const PET_ID = '11111111-2222-4333-8444-555555555555';
const BOOKING_ID = '33333333-4444-4555-8666-777777777777';
const CONVERSATION_ID = '44444444-5555-4666-8777-888888888888';

const PROVIDER_USER: AuthUser = {
  id: PROVIDER_USER_ID,
  email: 'provider@example.test',
  roles: ['provider'],
  status: 'active',
  profiles: {
    provider: {
      id: PROVIDER_PROFILE_ID,
      displayName: 'Provider Test',
      bio: null,
      categoryId: 'walk',
      isAvailable: true,
      listingId: PROVIDER_ID,
      pricePerHour: 25,
      service: 'Dog walking',
      status: 'active',
      serviceRadiusKm: 5,
      ratingAverage: null,
      ratingCount: 0,
    },
  },
};

const TUTOR_AND_PROVIDER_USER: AuthUser = {
  ...PROVIDER_USER,
  profiles: {
    ...PROVIDER_USER.profiles,
    tutor: {
      id: TUTOR_PROFILE_ID,
      displayName: 'Tutor Provider Test',
    },
  },
};

describe('provider eligibility invariants (e2e)', () => {
  function buildService(client: unknown): SupabaseAdminService {
    const config = { get: () => undefined };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    } as unknown as PinoLogger;
    const service = new SupabaseAdminService(
      config as unknown as ConstructorParameters<
        typeof SupabaseAdminService
      >[0],
      logger,
    );
    (service as unknown as { client: unknown }).client = client;
    return service;
  }

  it('does not expose availability for an active provider profile without provider role', async () => {
    const client = buildClient({ providerRoles: ['tutor'] });
    const service = buildService(client);

    const result = await service.getProviderAvailability(
      PROVIDER_ID,
      '2026-06-01',
    );

    expect(result).toBeNull();
    expect(client.from).not.toHaveBeenCalledWith('bookings');
  });

  it('does not create bookings for an active provider profile without provider role', async () => {
    const client = buildClient({ providerRoles: ['tutor'] });
    const service = buildService(client);

    await expect(
      service.createBooking(TUTOR_PROFILE_ID, {
        date: '2026-06-01',
        petId: PET_ID,
        providerId: PROVIDER_ID,
        service: 'Dog walking',
        timeSlotId: '09:00',
        timeSlotIds: ['09:00'],
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });

    expect(client.from).not.toHaveBeenCalledWith('bookings');
  });

  it('keeps availability available for active profiles with provider role', async () => {
    const client = buildClient({ providerRoles: ['provider'] });
    const service = buildService(client);

    const result = await service.getProviderAvailability(
      PROVIDER_ID,
      '2026-06-01',
    );

    expect(result).toEqual({
      configuredSlotIds: ['09:00', '10:00'],
      occupiedSlotIds: ['09:00'],
    });
    expect(client.from).toHaveBeenCalledWith('booking_slots');
  });

  it('does not expose availability when the provider owner is blocked', async () => {
    const client = buildClient({
      providerRoles: ['provider'],
      providerUserStatus: 'blocked',
    });
    const service = buildService(client);

    const result = await service.getProviderAvailability(
      PROVIDER_ID,
      '2026-06-01',
    );

    expect(result).toBeNull();
    expect(client.from).not.toHaveBeenCalledWith('bookings');
  });

  it('does not create bookings when the provider owner is deleted', async () => {
    const client = buildClient({
      providerRoles: ['provider'],
      providerUserDeletedAt: '2026-05-26T12:00:00.000Z',
    });
    const service = buildService(client);

    await expect(
      service.createBooking(TUTOR_PROFILE_ID, {
        date: '2026-06-01',
        petId: PET_ID,
        providerId: PROVIDER_ID,
        service: 'Dog walking',
        timeSlotId: '09:00',
        timeSlotIds: ['09:00'],
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });

    expect(client.from).not.toHaveBeenCalledWith('bookings');
  });

  it('does not let a provider without provider role update an existing booking', async () => {
    const client = buildClient({ providerRoles: ['tutor'] });
    const service = buildService(client);

    const result = await service.updateBookingStatus(
      PROVIDER_USER,
      BOOKING_ID,
      'confirmed',
    );

    expect(result).toBeNull();
    expect(client.state.bookingUpdated).toBe(false);
  });

  it('uses the provider actor when a dual participant confirms a booking', async () => {
    const client = buildClient({ providerRoles: ['provider'] });
    const service = buildService(client);

    const result = await service.updateBookingStatus(
      TUTOR_AND_PROVIDER_USER,
      BOOKING_ID,
      'confirmed',
    );

    expect(result?.status).toBe('confirmed');
    expect(client.state.bookingUpdated).toBe(true);
  });

  it('does not let an existing conversation accept messages after provider role is removed', async () => {
    const client = buildClient({ providerRoles: ['tutor'] });
    const service = buildService(client);

    const result = await service.createMessage(
      '56e4ff57-5355-47bb-904b-27ebde394bf7',
      TUTOR_PROFILE_ID,
      CONVERSATION_ID,
      'Hello',
    );

    expect(result).toBeNull();
    expect(client.state.messageInserted).toBe(false);
  });
});

interface FakeOptions {
  providerRoles: Role[];
  providerUserStatus?: 'active' | 'blocked' | 'deleted';
  providerUserDeletedAt?: string | null;
}

interface FakeState {
  bookingUpdated: boolean;
  bookingUpdatePayload: { status?: string } | null;
  messageInserted: boolean;
}

function buildClient(options: FakeOptions) {
  const state: FakeState = {
    bookingUpdated: false,
    bookingUpdatePayload: null,
    messageInserted: false,
  };
  return {
    state,
    from: jest.fn((table: string) => buildQuery(table, options, state)),
  };
}

function buildQuery(table: string, options: FakeOptions, state: FakeState) {
  const query = {
    operation: 'select',
    filters: {} as Record<string, unknown>,
    payload: null as unknown,
    select() {
      return this;
    },
    eq(column: string, value: unknown) {
      this.filters[column] = value;
      return this;
    },
    is(column: string, value: unknown) {
      this.filters[column] = value;
      return this;
    },
    in(column: string, value: unknown) {
      this.filters[column] = value;
      return this;
    },
    insert() {
      this.operation = 'insert';
      return this;
    },
    update(payload: unknown) {
      this.operation = 'update';
      this.payload = payload;
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return execute(table, options, state, this, 'many');
    },
    single() {
      return execute(table, options, state, this, 'single');
    },
    maybeSingle() {
      return execute(table, options, state, this, 'maybeSingle');
    },
    then(
      resolve: (value: unknown) => unknown,
      reject: (reason?: unknown) => unknown,
    ) {
      return execute(table, options, state, this, 'many').then(resolve, reject);
    },
  };

  return query;
}

async function execute(
  table: string,
  options: FakeOptions,
  state: FakeState,
  query: ReturnType<typeof buildQuery>,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  if (table === 'pets') {
    return Promise.resolve({ data: { id: PET_ID }, error: null });
  }

  if (table === 'providers') {
    return Promise.resolve({
      data: {
        provider_profile_id: PROVIDER_PROFILE_ID,
        deleted_at: null,
        price_per_hour: 25,
      },
      error: null,
    });
  }

  if (table === 'provider_profiles') {
    return Promise.resolve({
      data: {
        user_id: PROVIDER_USER_ID,
        status: 'active',
      },
      error: null,
    });
  }

  if (table === 'user_roles') {
    const hasRequestedProviderRole =
      query.filters.user_id === PROVIDER_USER_ID &&
      query.filters.role === 'provider' &&
      options.providerRoles.includes('provider');

    return Promise.resolve({
      data: hasRequestedProviderRole ? { role: 'provider' } : null,
      error: null,
    });
  }

  if (table === 'users') {
    const status = options.providerUserStatus ?? 'active';
    const deletedAt = options.providerUserDeletedAt ?? null;
    const isEligibleOwner =
      query.filters.id === PROVIDER_USER_ID &&
      query.filters.status === 'active' &&
      query.filters.deleted_at === null &&
      status === 'active' &&
      deletedAt === null;

    return Promise.resolve({
      data: isEligibleOwner ? { id: PROVIDER_USER_ID } : null,
      error: null,
    });
  }

  if (table === 'bookings') {
    if (query.operation === 'update') {
      state.bookingUpdated = true;
      state.bookingUpdatePayload = query.payload as { status?: string };
    }
    if (query.operation === 'insert') {
      return Promise.resolve({
        data: {
          id: BOOKING_ID,
          provider_id: PROVIDER_ID,
          pet_id: PET_ID,
          service_label: 'Dog walking',
          booking_date: '2026-06-01',
          time_slot_id: '09:00',
          status: state.bookingUpdatePayload?.status ?? 'requested',
          created_at: '2026-05-22T10:00:00.000Z',
          updated_at: '2026-05-22T10:00:00.000Z',
        },
        error: null,
      });
    }

    if (query.filters.id === BOOKING_ID) {
      return Promise.resolve({
        data: {
          id: BOOKING_ID,
          provider_id: PROVIDER_ID,
          pet_id: PET_ID,
          tutor_profile_id: TUTOR_PROFILE_ID,
          service_label: 'Dog walking',
          booking_date: '2026-06-01',
          time_slot_id: '09:00',
          status: state.bookingUpdatePayload?.status ?? 'requested',
          created_at: '2026-05-22T10:00:00.000Z',
          updated_at: '2026-05-22T10:00:00.000Z',
        },
        error: null,
      });
    }

    const rows = [{ time_slot_id: '09:00' }];
    return Promise.resolve({
      data: mode === 'many' ? rows : rows[0],
      error: null,
    });
  }

  if (table === 'provider_availability_rules') {
    return Promise.resolve({
      data: [{ time_slot_id: '09:00' }, { time_slot_id: '10:00' }],
      error: null,
    });
  }

  if (table === 'booking_slots') {
    if (query.operation === 'update') {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({
      data: [{ booking_id: BOOKING_ID, time_slot_id: '09:00' }],
      error: null,
    });
  }

  if (table === 'conversations') {
    return Promise.resolve({
      data: {
        id: CONVERSATION_ID,
        provider_id: PROVIDER_ID,
      },
      error: null,
    });
  }

  if (table === 'messages') {
    state.messageInserted = true;
    return Promise.resolve({
      data: {
        id: '55555555-6666-4777-8888-999999999999',
        from_provider: false,
        body: 'Hello',
        created_at: '2026-05-22T10:30:00.000Z',
      },
      error: null,
    });
  }

  if (table === 'user_blocks') {
    return Promise.resolve({ data: [], error: null });
  }

  throw new Error(`Unexpected table access: ${table}`);
}
