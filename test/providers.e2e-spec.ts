import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type { ProviderRecord } from '../src/providers/dto/provider-fields';
import type { ListProvidersFilter } from '../src/providers/dto/list-providers-query.dto';

const USER_ID = '56e4ff57-5355-47bb-904b-27ebde394bf7';
const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';

const ACTIVE_USER: AuthUser = {
  id: USER_ID,
  email: 'tutor@teste.com',
  roles: ['tutor'],
  status: 'active',
  locale: 'en-GB',
  profiles: {
    tutor: { id: '1b6fe9f3-514f-475c-9286-38c19e576116', displayName: 'Tutor Test' },
  },
};

const PROVIDER_ROW: ProviderRecord = {
  id: PROVIDER_ID,
  name: 'Anna Walker',
  service_label: 'Dog walking · 30 min',
  category: 'walk',
  avatar_url: 'https://cdn.example.com/a.png',
  rating: 4.7,
  review_count: 23,
  distance_meters: 340,
  is_available: true,
  price_per_hour: 18.5,
  bio: 'Friendly local dog walker.',
};

const EXPECTED_PROVIDER = {
  id: PROVIDER_ID,
  name: 'Anna Walker',
  service: 'Dog walking · 30 min',
  categoryId: 'walk',
  avatarUrl: 'https://cdn.example.com/a.png',
  rating: 4.7,
  reviewCount: 23,
  distanceMeters: 340,
  isAvailable: true,
  pricePerHour: 18.5,
  bio: 'Friendly local dog walker.',
};

describe('Providers (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let detailResult: ProviderRecord | null;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    listProviders: jest.fn(
      async (_userId: string, _filter: ListProvidersFilter) => [PROVIDER_ROW],
    ),
    getProvider: jest.fn(
      async (_userId: string, _providerId: string) => detailResult,
    ),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      .overrideProvider(SupabaseAdminService)
      .useValue(supabaseAdminMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  beforeEach(() => {
    resolvedUser = ACTIVE_USER;
    detailResult = PROVIDER_ROW;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.listProviders.mockClear();
    supabaseAdminMock.getProvider.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/providers returns the safe provider contract', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/providers')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([EXPECTED_PROVIDER]);
    expect(supabaseAdminMock.listProviders).toHaveBeenCalledWith(USER_ID, {
      categoryId: null,
      q: null,
      limit: 20,
      offset: 0,
    });
    expectSafeProviderPayload(res.body);
  });

  it('GET /api/v1/providers forwards the parsed filters to the service', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/providers')
      .query({ categoryId: 'sitting', q: ' Anna ', limit: '5', offset: '10' })
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(supabaseAdminMock.listProviders).toHaveBeenCalledWith(USER_ID, {
      categoryId: 'sitting',
      q: 'Anna',
      limit: 5,
      offset: 10,
    });
  });

  it('GET /api/v1/providers exposes an approximate distance, never coordinates', async () => {
    detailResult = PROVIDER_ROW;
    const res = await request(app.getHttpServer())
      .get('/api/v1/providers')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body[0].distanceMeters).toBe(340);
    expect(res.body[0]).not.toHaveProperty('latitude');
    expect(res.body[0]).not.toHaveProperty('location');
  });

  it.each([
    ['unknown category', { categoryId: 'grooming' }],
    ['limit above max', { limit: '999' }],
    ['limit below min', { limit: '0' }],
    ['non-integer limit', { limit: 'abc' }],
    ['negative offset', { offset: '-1' }],
  ])('GET /api/v1/providers rejects %s', async (_caseName, query) => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/providers')
      .query(query)
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.listProviders).not.toHaveBeenCalled();
  });

  it('GET /api/v1/providers requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/providers').expect(401);
  });

  it('GET /api/v1/providers/:id returns a single provider detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/providers/${PROVIDER_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual(EXPECTED_PROVIDER);
    expect(supabaseAdminMock.getProvider).toHaveBeenCalledWith(
      USER_ID,
      PROVIDER_ID,
    );
    expectSafeProviderPayload(res.body);
  });

  it('GET /api/v1/providers/:id clamps rating and tolerates a missing distance', async () => {
    detailResult = {
      ...PROVIDER_ROW,
      rating: 7.2,
      distance_meters: null,
      avatar_url: null,
      bio: null,
    };

    const res = await request(app.getHttpServer())
      .get(`/api/v1/providers/${PROVIDER_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.rating).toBe(5);
    expect(res.body.distanceMeters).toBeNull();
    expect(res.body.avatarUrl).toBeNull();
    expect(res.body.bio).toBeNull();
  });

  it('GET /api/v1/providers/:id returns 404 when the provider does not exist', async () => {
    detailResult = null;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/providers/${PROVIDER_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/v1/providers/:id rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/providers/not-a-uuid')
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.getProvider).not.toHaveBeenCalled();
  });
});

/** Garante que nenhum dado sensível ou de localização exata vaze na resposta. */
function expectSafeProviderPayload(value: unknown): void {
  const forbidden = new Set([
    'phone',
    'phoneNumber',
    'email',
    'address',
    'line1',
    'formattedAddress',
    'formatted_address',
    'postcode',
    'location',
    'coordinates',
    'lat',
    'lng',
    'latitude',
    'longitude',
    'providerProfileId',
    'provider_profile_id',
    'baseAddressId',
    'base_address_id',
    'userId',
    'user_id',
    'token',
    'accessToken',
    'refreshToken',
    'serviceRole',
    'metadata',
  ]);

  for (const key of collectKeys(value)) {
    expect(forbidden.has(key)).toBe(false);
  }
}

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectKeys(item));
  }
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested),
  ]);
}
