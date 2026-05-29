import type { PinoLogger } from 'nestjs-pino';
import { ErrorCode } from '../src/common/errors/error-codes';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';

const USER_ID = 'e88a5237-8ccb-43df-854b-26c95ef5e1ca';
const PROVIDER_PROFILE_ID = '2fbbb49d-b61b-40d1-9c9f-897504c174f0';
const PROVIDER_ID = '9b4e1bc5-9e81-48d6-beb4-3772eeef23a8';
const BASE_ADDRESS_ID = 'b2f0a2d4-5c6e-4f8a-9b1c-7d3e4f5a6b7c';

describe('provider listing restore (e2e)', () => {
  it('restores a soft-deleted provider listing when the owner saves provider data', async () => {
    const client = buildClient();
    const service = buildService(client);

    const result = await service.updateOwnProviderProfile(USER_ID, {
      bio: 'Synthetic provider record authorised for marketplace smoke validation.',
      categoryId: 'walk',
      displayName: 'Tutorname2',
      isAvailable: true,
      pricePerHour: 18.5,
      publish: true,
      service: 'Smoke dog walking',
      serviceRadiusKm: 5,
    });

    expect(result).toMatchObject({
      id: PROVIDER_PROFILE_ID,
      listing_id: PROVIDER_ID,
      category: 'walk',
      service_label: 'Smoke dog walking',
      price_per_hour: 18.5,
      is_available: true,
      status: 'active',
    });
    expect(client.state.insertedProviderListing).toBe(false);
    expect(client.state.providerListing.deleted_at).toBeNull();
    expect(client.state.lastProviderListingPatch).toMatchObject({
      deleted_at: null,
      category: 'walk',
      service_label: 'Smoke dog walking',
      price_per_hour: 18.5,
      is_available: true,
    });
  });

  it('refuses to publish a provider listing without a base address', async () => {
    const client = buildClient();
    client.state.providerProfile.base_address_id = null;
    const service = buildService(client);

    await expect(
      service.updateOwnProviderProfile(USER_ID, {
        categoryId: 'walk',
        displayName: 'Tutorname2',
        isAvailable: true,
        pricePerHour: 18.5,
        publish: true,
        service: 'Smoke dog walking',
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
    });

    expect(client.state.lastProviderListingPatch).toBeNull();
    expect(client.state.providerProfile.status).toBe('paused');
  });
});

function buildService(client: FakeClient): SupabaseAdminService {
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
    config as unknown as ConstructorParameters<typeof SupabaseAdminService>[0],
    logger,
  );
  (service as unknown as { client: FakeClient }).client = client;
  return service;
}

interface ProviderProfileState {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  base_address_id: string | null;
  service_radius_km: number;
  status: 'active' | 'paused' | 'blocked' | 'deleted';
  rating_average: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

interface ProviderListingState {
  id: string;
  provider_profile_id: string;
  category: 'walk' | 'sitting' | 'transport' | 'boarding';
  service_label: string;
  price_per_hour: number;
  is_available: boolean;
  deleted_at: string | null;
}

interface FakeState {
  insertedProviderListing: boolean;
  lastProviderListingPatch: Partial<ProviderListingState> | null;
  providerListing: ProviderListingState;
  providerProfile: ProviderProfileState;
}

interface FakeClient {
  state: FakeState;
  from: jest.Mock<FakeQuery, [string]>;
}

interface FakeQuery {
  operation: 'select' | 'update' | 'insert';
  filters: Record<string, unknown>;
  payload: unknown;
  select: (_columns?: string) => FakeQuery;
  eq: (column: string, value: unknown) => FakeQuery;
  is: (column: string, value: unknown) => FakeQuery;
  update: (payload: unknown) => FakeQuery;
  insert: (payload: unknown) => FakeQuery;
  maybeSingle: () => Promise<{ data: unknown; error: null }>;
}

function buildClient(): FakeClient {
  const state: FakeState = {
    insertedProviderListing: false,
    lastProviderListingPatch: null,
    providerProfile: {
      id: PROVIDER_PROFILE_ID,
      user_id: USER_ID,
      display_name: 'Tutorname2',
      bio: 'Synthetic provider record authorised for marketplace smoke validation.',
      base_address_id: BASE_ADDRESS_ID,
      service_radius_km: 5,
      status: 'paused',
      rating_average: 4.8,
      rating_count: 7,
      created_at: '2026-05-24T17:36:54.80962+00:00',
      updated_at: '2026-05-28T02:21:40.202323+00:00',
    },
    providerListing: {
      id: PROVIDER_ID,
      provider_profile_id: PROVIDER_PROFILE_ID,
      category: 'walk',
      service_label: 'Smoke dog walking',
      price_per_hour: 18.5,
      is_available: true,
      deleted_at: '2026-05-27T02:27:05.232822+00:00',
    },
  };

  return {
    state,
    from: jest.fn((table: string) => buildQuery(table, state)),
  };
}

function buildQuery(table: string, state: FakeState): FakeQuery {
  const query: FakeQuery = {
    operation: 'select',
    filters: {},
    payload: null,
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
    update(payload: unknown) {
      this.operation = 'update';
      this.payload = payload;
      return this;
    },
    insert(payload: unknown) {
      this.operation = 'insert';
      this.payload = payload;
      return this;
    },
    maybeSingle() {
      return execute(table, state, this);
    },
  };

  return query;
}

async function execute(
  table: string,
  state: FakeState,
  query: FakeQuery,
): Promise<{ data: unknown; error: null }> {
  if (table === 'provider_profiles') {
    if (query.operation === 'update') {
      const patch = query.payload as Partial<ProviderProfileState>;
      state.providerProfile = { ...state.providerProfile, ...patch };
      return { data: state.providerProfile, error: null };
    }
    return { data: state.providerProfile, error: null };
  }

  if (table === 'providers') {
    if (query.operation === 'insert') {
      state.insertedProviderListing = true;
      return {
        data: { id: 'should-not-insert-when-soft-deleted-row-exists' },
        error: null,
      };
    }

    if (query.operation === 'update') {
      const patch = query.payload as Partial<ProviderListingState>;
      state.lastProviderListingPatch = patch;
      state.providerListing = { ...state.providerListing, ...patch };
      return { data: { id: state.providerListing.id }, error: null };
    }

    const wantsOnlyActive =
      Object.prototype.hasOwnProperty.call(query.filters, 'deleted_at') &&
      query.filters.deleted_at === null;
    if (wantsOnlyActive && state.providerListing.deleted_at !== null) {
      return { data: null, error: null };
    }
    return { data: state.providerListing, error: null };
  }

  throw new Error(`Unexpected table access: ${table}`);
}
