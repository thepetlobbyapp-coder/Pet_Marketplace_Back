import type { PinoLogger } from 'nestjs-pino';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type { Role } from '../src/common/auth/auth-user';

const USER_ID = '56e4ff57-5355-47bb-904b-27ebde394bf7';
const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const PROVIDER_PROFILE_ID = '6f426a74-4c91-4a6c-a7e9-60529879cc66';

describe('SupabaseAdminService auth bootstrap (e2e)', () => {
  function buildService(client: unknown): SupabaseAdminService {
    const config = {
      get: (key: string) => (key === 'APP_DEFAULT_LOCALE' ? 'en-GB' : null),
    };
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

  it('creates public user, fallback tutor role, and tutor profile on first auth sync', async () => {
    const state = createState({ user: null, roles: [], tutorProfile: null });
    const service = buildService(buildClient(state));

    const user = await service.syncAndLoadAuthUser(
      authUser('new-tutor@example.test'),
    );

    expect(user.roles).toEqual(['tutor']);
    expect(user.profiles?.tutor).toEqual({
      id: TUTOR_PROFILE_ID,
      displayName: 'Pet tutor',
      defaultAddressId: null,
    });
    expect(state.user?.locale).toBe('en-GB');
    expect(state.tutorProfile).toMatchObject({
      user_id: USER_ID,
      display_name: 'Pet tutor',
    });
  });

  it('does not create a tutor profile for users without the tutor role', async () => {
    const state = createState({
      roles: ['provider'],
      tutorProfile: null,
      providerProfile: providerProfileRow(),
    });
    const service = buildService(buildClient(state));

    const user = await service.syncAndLoadAuthUser(
      authUser('provider@example.test'),
    );

    expect(user.roles).toEqual(['provider']);
    expect(user.profiles?.tutor).toBeUndefined();
    expect(user.profiles?.provider).toEqual({
      bio: null,
      categoryId: null,
      id: PROVIDER_PROFILE_ID,
      displayName: 'Existing Provider',
      isAvailable: null,
      listingId: null,
      pricePerHour: null,
      status: 'active',
      service: null,
      serviceRadiusKm: 5,
      ratingAverage: 4.9,
      ratingCount: 1,
    });
    expect(state.tutorProfile).toBeNull();
  });

  it('does not expose a stale tutor profile for provider-only users', async () => {
    const state = createState({
      roles: ['provider'],
      tutorProfile: {
        id: TUTOR_PROFILE_ID,
        user_id: USER_ID,
        display_name: 'Legacy Tutor',
      },
      providerProfile: providerProfileRow(),
    });
    const service = buildService(buildClient(state));

    const user = await service.syncAndLoadAuthUser(
      authUser('provider@example.test'),
    );

    expect(user.roles).toEqual(['provider']);
    expect(user.profiles?.tutor).toBeUndefined();
    expect(user.profiles?.provider?.id).toBe(PROVIDER_PROFILE_ID);
    expect(state.tutorProfile?.display_name).toBe('Legacy Tutor');
  });

  it('creates a paused provider profile when a provider role has no profile', async () => {
    const state = createState({
      roles: ['provider'],
      tutorProfile: null,
      providerProfile: null,
    });
    const service = buildService(buildClient(state));

    const user = await service.syncAndLoadAuthUser(
      authUser('provider-without-profile@example.test'),
    );

    expect(user.roles).toEqual(['provider']);
    expect(user.profiles?.tutor).toBeUndefined();
    expect(user.profiles?.provider).toEqual({
      bio: null,
      categoryId: null,
      id: PROVIDER_PROFILE_ID,
      displayName: 'Pet provider',
      isAvailable: null,
      listingId: null,
      pricePerHour: null,
      status: 'paused',
      service: null,
      serviceRadiusKm: 5,
      ratingAverage: null,
      ratingCount: 0,
    });
    expect(state.providerProfile).toMatchObject({
      user_id: USER_ID,
      display_name: 'Pet provider',
      status: 'paused',
    });
  });

  it('ignores client metadata attempts to grant provider role during auth sync', async () => {
    const state = createState({ user: null, roles: [], tutorProfile: null });
    const service = buildService(buildClient(state));

    const user = await service.syncAndLoadAuthUser(
      authUser('metadata-role@example.test', {
        app_metadata: { role: 'provider' },
        user_metadata: { roles: ['provider', 'admin'] },
      }),
    );

    expect(user.roles).toEqual(['tutor']);
    expect(user.profiles?.provider).toBeUndefined();
    expect(state.roles).toEqual(['tutor']);
  });
});

function authUser(
  email: string,
  metadata: {
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } = {},
): SupabaseAuthUser {
  return {
    id: USER_ID,
    email,
    app_metadata: metadata.app_metadata ?? {},
    user_metadata: metadata.user_metadata ?? {},
  } as SupabaseAuthUser;
}

interface FakeState {
  user: {
    id: string;
    email: string;
    status: 'active';
    locale: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    avatar_url: string | null;
  } | null;
  roles: Role[];
  tutorProfile: {
    id: string;
    user_id: string;
    display_name: string;
  } | null;
  providerProfile: {
    id: string;
    user_id: string;
    display_name: string;
    bio: string | null;
    status: 'active' | 'paused' | 'blocked' | 'deleted';
    service_radius_km: number;
    rating_average: number | null;
    rating_count: number;
  } | null;
  providerListing: {
    id: string;
    provider_profile_id: string;
    category: 'boarding' | 'sitting' | 'transport' | 'walk';
    service_label: string;
    avatar_url: string | null;
    price_per_hour: number;
    is_available: boolean;
    deleted_at: string | null;
  } | null;
}

function createState(
  overrides: Partial<
    Pick<
      FakeState,
      'user' | 'roles' | 'tutorProfile' | 'providerProfile' | 'providerListing'
    >
  > = {},
): FakeState {
  return {
    user: userRow('existing@example.test'),
    roles: ['tutor'],
    tutorProfile: {
      id: TUTOR_PROFILE_ID,
      user_id: USER_ID,
      display_name: 'Existing Tutor',
    },
    providerProfile: null,
    providerListing: null,
    ...overrides,
  };
}

function providerProfileRow(): NonNullable<FakeState['providerProfile']> {
  return {
    id: PROVIDER_PROFILE_ID,
    user_id: USER_ID,
    display_name: 'Existing Provider',
    bio: null,
    status: 'active',
    service_radius_km: 5,
    rating_average: 4.9,
    rating_count: 1,
  };
}

function userRow(email: string): NonNullable<FakeState['user']> {
  return {
    id: USER_ID,
    email,
    status: 'active',
    locale: 'en-GB',
    created_at: '2026-05-18T20:00:00.000Z',
    updated_at: '2026-05-18T20:00:00.000Z',
    deleted_at: null,
    avatar_url: null,
  };
}

function buildClient(state: FakeState) {
  return {
    from: jest.fn((table: string) => buildQuery(table, state)),
    rpc: jest.fn((name: string, args: unknown) => executeRpc(name, args, state)),
  };
}

async function executeRpc(
  name: string,
  args: unknown,
  state: FakeState,
) {
  if (name === 'ensure_tutor_profile') {
    const payload = args as { p_display_name: string; p_user_id: string };
    if (!state.roles.includes('tutor')) state.roles.push('tutor');
    state.tutorProfile = {
      id: TUTOR_PROFILE_ID,
      user_id: payload.p_user_id,
      display_name: payload.p_display_name,
    };

    return Promise.resolve({
      data: [
        {
          id: state.tutorProfile.id,
          display_name: state.tutorProfile.display_name,
          created_at: '2026-05-18T20:00:00.000Z',
          updated_at: '2026-05-18T20:00:00.000Z',
        },
      ],
      error: null,
    });
  }

  if (name === 'ensure_provider_profile') {
    const payload = args as { p_display_name: string; p_user_id: string };
    if (!state.roles.includes('provider')) state.roles.push('provider');
    state.providerProfile = {
      id: PROVIDER_PROFILE_ID,
      user_id: payload.p_user_id,
      display_name: payload.p_display_name,
      bio: null,
      status: 'paused',
      service_radius_km: 5,
      rating_average: null,
      rating_count: 0,
    };

    return Promise.resolve({
      data: [
        {
          id: state.providerProfile.id,
          display_name: state.providerProfile.display_name,
          status: state.providerProfile.status,
          service_radius_km: state.providerProfile.service_radius_km,
          rating_average: state.providerProfile.rating_average,
          rating_count: state.providerProfile.rating_count,
          created_at: '2026-05-18T20:00:00.000Z',
          updated_at: '2026-05-18T20:00:00.000Z',
        },
      ],
      error: null,
    });
  }

  throw new Error(`Unexpected RPC: ${name}`);
}

function buildQuery(table: string, state: FakeState) {
  const query = {
    operation: 'select',
    payload: null as unknown,
    filters: {} as Record<string, unknown>,
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
    insert(payload: unknown) {
      this.operation = 'insert';
      this.payload = payload;
      return this;
    },
    update(payload: unknown) {
      this.operation = 'update';
      this.payload = payload;
      return this;
    },
    upsert(payload: unknown) {
      this.operation = 'upsert';
      this.payload = payload;
      return this;
    },
    single() {
      return execute(table, state, this, 'single');
    },
    maybeSingle() {
      return execute(table, state, this, 'maybeSingle');
    },
    then(
      resolve: (value: unknown) => unknown,
      reject: (reason?: unknown) => unknown,
    ) {
      return execute(table, state, this, 'many').then(resolve, reject);
    },
  };

  return query;
}

async function execute(
  table: string,
  state: FakeState,
  query: ReturnType<typeof buildQuery>,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  if (table === 'users') {
    return executeUsers(state, query, mode);
  }
  if (table === 'user_roles') {
    return executeUserRoles(state, query, mode);
  }
  if (table === 'tutor_profiles') {
    return executeTutorProfiles(state, query, mode);
  }
  if (table === 'provider_profiles') {
    return executeProviderProfiles(state, mode);
  }
  if (table === 'providers') {
    return executeProviders(state, query, mode);
  }

  throw new Error(`Unexpected table access: ${table}`);
}

function executeProviderProfiles(
  state: FakeState,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  const data = state.providerProfile
    ? {
        id: state.providerProfile.id,
        display_name: state.providerProfile.display_name,
        bio: state.providerProfile.bio,
        status: state.providerProfile.status,
        service_radius_km: state.providerProfile.service_radius_km,
        rating_average: state.providerProfile.rating_average,
        rating_count: state.providerProfile.rating_count,
      }
    : null;
  return Promise.resolve({
    data: mode === 'many' && data ? [data] : data,
    error: null,
  });
}

function executeProviders(
  state: FakeState,
  query: ReturnType<typeof buildQuery>,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  const providerProfileId = query.filters.provider_profile_id;
  const deletedAt = query.filters.deleted_at;
  const row =
    state.providerListing &&
    state.providerListing.provider_profile_id === providerProfileId &&
    (!('deleted_at' in query.filters) ||
      state.providerListing.deleted_at === deletedAt)
      ? {
          id: state.providerListing.id,
          category: state.providerListing.category,
          service_label: state.providerListing.service_label,
          avatar_url: state.providerListing.avatar_url,
          price_per_hour: state.providerListing.price_per_hour,
          is_available: state.providerListing.is_available,
        }
      : null;

  return Promise.resolve({
    data: mode === 'many' && row ? [row] : row,
    error: null,
  });
}

function executeUsers(
  state: FakeState,
  query: ReturnType<typeof buildQuery>,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  if (query.operation === 'insert') {
    const payload = query.payload as { email: string; locale: string };
    state.user = userRow(payload.email);
    state.user.locale = payload.locale;
    return Promise.resolve({ data: [{ id: USER_ID }], error: null });
  }

  if (query.operation === 'update') {
    const payload = query.payload as { email?: string };
    if (state.user && payload.email) state.user.email = payload.email;
    return Promise.resolve({ data: [{ id: USER_ID }], error: null });
  }

  if (mode === 'single') {
    return Promise.resolve({ data: state.user, error: null });
  }
  if (mode === 'many') {
    return Promise.resolve({
      data: state.user ? [{ id: state.user.id }] : [],
      error: null,
    });
  }
  return Promise.resolve({ data: state.user, error: null });
}

function executeUserRoles(
  state: FakeState,
  query: ReturnType<typeof buildQuery>,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  if (query.operation === 'upsert') {
    const payload = query.payload as { role: Role };
    if (!state.roles.includes(payload.role)) state.roles.push(payload.role);
    return Promise.resolve({ data: { role: payload.role }, error: null });
  }

  const rows = state.roles.map((role) => ({ role }));
  return Promise.resolve({
    data: mode === 'single' || mode === 'maybeSingle' ? rows[0] : rows,
    error: null,
  });
}

function executeTutorProfiles(
  state: FakeState,
  query: ReturnType<typeof buildQuery>,
  mode: 'single' | 'maybeSingle' | 'many',
) {
  if (query.operation === 'insert') {
    if (state.tutorProfile) {
      return Promise.resolve({
        data: null,
        error: { code: '23505' },
      });
    }
    const payload = query.payload as { user_id: string; display_name: string };
    state.tutorProfile = {
      id: TUTOR_PROFILE_ID,
      user_id: payload.user_id,
      display_name: payload.display_name,
    };
    return Promise.resolve({
      data: {
        id: state.tutorProfile.id,
        display_name: state.tutorProfile.display_name,
      },
      error: null,
    });
  }

  const data = state.tutorProfile
    ? {
        id: state.tutorProfile.id,
        display_name: state.tutorProfile.display_name,
      }
    : null;
  return Promise.resolve({
    data: mode === 'many' && data ? [data] : data,
    error: null,
  });
}
