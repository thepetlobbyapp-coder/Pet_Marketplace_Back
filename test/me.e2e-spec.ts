import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';

const ACTIVE_USER: AuthUser = {
  id: '56e4ff57-5355-47bb-904b-27ebde394bf7',
  email: 'admin@teste.com',
  roles: ['tutor'],
  status: 'active',
  locale: 'en-GB',
  createdAt: '2026-05-18T20:00:00.000Z',
  updatedAt: '2026-05-18T20:00:00.000Z',
  profiles: {
    tutor: {
      id: '1b6fe9f3-514f-475c-9286-38c19e576116',
      displayName: 'Admin Test',
    },
    provider: {
      id: '2a0a2ea6-1f58-4690-94ce-d55728954e0e',
      displayName: 'Admin Provider',
      status: 'active',
      serviceRadiusKm: 5,
      ratingAverage: null,
      ratingCount: 0,
    },
  },
};

describe('Me (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  beforeEach(() => {
    resolvedUser = ACTIVE_USER;
    supabaseMock.resolveUser.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/me returns the safe authenticated user contract', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      id: ACTIVE_USER.id,
      email: ACTIVE_USER.email,
      roles: ['tutor'],
      status: 'active',
      locale: 'en-GB',
      createdAt: ACTIVE_USER.createdAt,
      updatedAt: ACTIVE_USER.updatedAt,
      profiles: ACTIVE_USER.profiles,
    });
    expect(supabaseMock.resolveUser).toHaveBeenCalledWith('test-token');
    expectForbiddenFieldsAbsent(res.body);
  });

  it('GET /api/v1/me preserves multiple database-backed roles', async () => {
    resolvedUser = {
      ...ACTIVE_USER,
      roles: ['tutor', 'admin'],
    };

    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.roles).toEqual(['tutor', 'admin']);
  });

  it.each(['blocked', 'deleted'] as const)(
    'GET /api/v1/me rejects %s users before the controller response',
    async (status) => {
      resolvedUser = {
        ...ACTIVE_USER,
        status,
      };

      await request(app.getHttpServer())
        .get('/api/v1/me')
        .set('Authorization', 'Bearer test-token')
        .expect(403);
    },
  );
});

function expectForbiddenFieldsAbsent(value: unknown): void {
  const forbidden = new Set([
    'token',
    'accessToken',
    'refreshToken',
    'phone',
    'address',
    'addresses',
    'line1',
    'formattedAddress',
    'location',
    'coordinates',
    'lat',
    'lng',
    'latitude',
    'longitude',
  ]);
  const seen = collectKeys(value);
  for (const key of seen) {
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
