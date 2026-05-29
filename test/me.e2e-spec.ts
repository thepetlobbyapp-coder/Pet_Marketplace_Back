import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type {
  TutorProfileInput,
  TutorProfileRecord,
} from '../src/users/dto/tutor-profile.dto';
import type {
  ProviderProfileInput,
  ProviderProfileRecord,
} from '../src/users/dto/provider-profile.dto';
import type { AccountDeletionRequestRecord } from '../src/users/dto/account-deletion-request-response.dto';

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
  },
};

const EXPECTED_ME_TUTOR_SUMMARY = {
  id: ACTIVE_USER.profiles?.tutor?.id,
  displayName: 'Admin Test',
  hasDefaultAddress: false,
};

const TUTOR_PROFILE_ROW: TutorProfileRecord = {
  id: '1b6fe9f3-514f-475c-9286-38c19e576116',
  display_name: 'Tutor Test',
  created_at: '2026-05-18T22:00:00.000Z',
  updated_at: '2026-05-18T22:00:00.000Z',
};

const EXPECTED_TUTOR_PROFILE = {
  id: TUTOR_PROFILE_ROW.id,
  displayName: 'Tutor Test',
  createdAt: TUTOR_PROFILE_ROW.created_at,
  updatedAt: TUTOR_PROFILE_ROW.updated_at,
};

const PROVIDER_PROFILE_ROW: ProviderProfileRecord = {
  id: '2a0a2ea6-1f58-4690-94ce-d55728954e0e',
  display_name: 'Provider Test',
  bio: null,
  base_address_id: null,
  status: 'paused',
  service_radius_km: 5,
  rating_average: null,
  rating_count: 0,
  created_at: '2026-05-18T22:30:00.000Z',
  updated_at: '2026-05-18T22:30:00.000Z',
  listing_id: '8a50a261-f0a8-4c79-90d5-22e55e0b2436',
  category: 'walk',
  service_label: 'Dog walking',
  avatar_url: null,
  price_per_hour: 25,
  is_available: true,
};

const EXPECTED_PROVIDER_PROFILE = {
  id: PROVIDER_PROFILE_ROW.id,
  displayName: 'Provider Test',
  bio: null,
  status: 'paused',
  serviceRadiusKm: 5,
  ratingAverage: null,
  ratingCount: 0,
  listingId: PROVIDER_PROFILE_ROW.listing_id,
  categoryId: 'walk',
  service: 'Dog walking',
  avatarUrl: null,
  pricePerHour: 25,
  isAvailable: true,
  createdAt: PROVIDER_PROFILE_ROW.created_at,
  updatedAt: PROVIDER_PROFILE_ROW.updated_at,
};

describe('Me (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let deletionRequest: AccountDeletionRequestRecord | null;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };
  const supabaseAdminMock = {
    appendAuditLog: jest.fn(async () => undefined),
    updateOwnUser: jest.fn(
      async (_userId: string, input: { locale: string }) => ({
        ...ACTIVE_USER,
        locale: input.locale,
        updatedAt: '2026-05-18T21:00:00.000Z',
      }),
    ),
    getOwnDeletionRequest: jest.fn(async () => deletionRequest),
    requestOwnAccountDeletion: jest.fn(async () => {
      deletionRequest ??= createDeletionRequestRow();
      return deletionRequest;
    }),
    createOwnTutorProfile: jest.fn(
      async (_userId: string, input: TutorProfileInput) => {
        const row = {
          ...TUTOR_PROFILE_ROW,
          display_name: input.displayName,
        };
        resolvedUser = withTutorProfile(input.displayName, resolvedUser);
        return row;
      },
    ),
    updateOwnTutorProfile: jest.fn(
      async (_userId: string, input: TutorProfileInput) => {
        const row = {
          ...TUTOR_PROFILE_ROW,
          display_name: input.displayName,
          updated_at: '2026-05-18T23:00:00.000Z',
        };
        resolvedUser = withTutorProfile(input.displayName, resolvedUser);
        return row;
      },
    ),
    createOwnProviderProfile: jest.fn(
      async (_userId: string, input: ProviderProfileInput) => {
        const displayName =
          input.displayName ?? PROVIDER_PROFILE_ROW.display_name;
        const row = {
          ...PROVIDER_PROFILE_ROW,
          display_name: displayName,
          bio: input.bio ?? PROVIDER_PROFILE_ROW.bio,
          category: input.categoryId ?? PROVIDER_PROFILE_ROW.category,
          is_available: input.isAvailable ?? PROVIDER_PROFILE_ROW.is_available,
          price_per_hour:
            input.pricePerHour ?? PROVIDER_PROFILE_ROW.price_per_hour,
          service_label: input.service ?? PROVIDER_PROFILE_ROW.service_label,
          service_radius_km:
            input.serviceRadiusKm ?? PROVIDER_PROFILE_ROW.service_radius_km,
          status: (input.publish === true
            ? 'active'
            : input.publish === false
              ? 'paused'
              : PROVIDER_PROFILE_ROW.status) as ProviderProfileRecord['status'],
        };
        resolvedUser = withProviderProfile(displayName, resolvedUser, row);
        return row;
      },
    ),
    updateOwnProviderProfile: jest.fn(
      async (_userId: string, input: ProviderProfileInput) => {
        const displayName =
          input.displayName ?? PROVIDER_PROFILE_ROW.display_name;
        const row = {
          ...PROVIDER_PROFILE_ROW,
          display_name: displayName,
          bio: input.bio ?? PROVIDER_PROFILE_ROW.bio,
          category: input.categoryId ?? PROVIDER_PROFILE_ROW.category,
          is_available: input.isAvailable ?? PROVIDER_PROFILE_ROW.is_available,
          price_per_hour:
            input.pricePerHour ?? PROVIDER_PROFILE_ROW.price_per_hour,
          service_label: input.service ?? PROVIDER_PROFILE_ROW.service_label,
          service_radius_km:
            input.serviceRadiusKm ?? PROVIDER_PROFILE_ROW.service_radius_km,
          status: (input.publish === true
            ? 'active'
            : input.publish === false
              ? 'paused'
              : PROVIDER_PROFILE_ROW.status) as ProviderProfileRecord['status'],
          updated_at: '2026-05-18T23:30:00.000Z',
        };
        resolvedUser = withProviderProfile(displayName, resolvedUser, row);
        return row;
      },
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
    deletionRequest = null;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.updateOwnUser.mockClear();
    supabaseAdminMock.getOwnDeletionRequest.mockClear();
    supabaseAdminMock.requestOwnAccountDeletion.mockClear();
    supabaseAdminMock.appendAuditLog.mockClear();
    supabaseAdminMock.createOwnTutorProfile.mockClear();
    supabaseAdminMock.updateOwnTutorProfile.mockClear();
    supabaseAdminMock.createOwnProviderProfile.mockClear();
    supabaseAdminMock.updateOwnProviderProfile.mockClear();
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
      avatarUrl: null,
      profiles: { tutor: EXPECTED_ME_TUTOR_SUMMARY },
    });
    expect(supabaseMock.resolveUser).toHaveBeenCalledWith('test-token');
    expectForbiddenFieldsAbsent(res.body);
  });

  it('GET /api/v1/me signals a default address without leaking its identifier', async () => {
    resolvedUser = {
      ...ACTIVE_USER,
      profiles: {
        tutor: {
          id: TUTOR_PROFILE_ROW.id,
          displayName: 'Admin Test',
          defaultAddressId: '7c3e4f5a-6b7c-4d8e-9f10-2a3b4c5d6e7f',
        },
      },
    };

    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.profiles.tutor).toEqual({
      id: TUTOR_PROFILE_ROW.id,
      displayName: 'Admin Test',
      hasDefaultAddress: true,
    });
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

  it('PATCH /api/v1/me updates only the safe profile bootstrap locale', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .send({ locale: 'en-US' })
      .expect(200);

    expect(res.body).toEqual({
      id: ACTIVE_USER.id,
      email: ACTIVE_USER.email,
      roles: ['tutor'],
      status: 'active',
      locale: 'en-US',
      createdAt: ACTIVE_USER.createdAt,
      updatedAt: '2026-05-18T21:00:00.000Z',
      avatarUrl: null,
      profiles: { tutor: EXPECTED_ME_TUTOR_SUMMARY },
    });
    expect(supabaseAdminMock.updateOwnUser).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { locale: 'en-US' },
    );
    expectForbiddenFieldsAbsent(res.body);
  });

  it('PATCH /api/v1/me rejects attempts to change backend-owned fields', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .send({ locale: 'en-US', roles: ['admin'], status: 'active' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateOwnUser).not.toHaveBeenCalled();
  });

  it('GET /api/v1/me/deletion-request returns 404 when no request exists', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/deletion-request')
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.getOwnDeletionRequest).toHaveBeenCalledWith(
      ACTIVE_USER.id,
    );
  });

  it('POST /api/v1/me/deletion-request records a safe idempotent request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/deletion-request')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      id: 'df739f4c-cd08-42ac-8af6-cdf7875e3030',
      status: 'pending',
      requestedAt: '2026-05-24T18:00:00.000Z',
      estimatedCompletionAt: '2026-06-23T18:00:00.000Z',
      processingStartedAt: null,
      completedAt: null,
      updatedAt: '2026-05-24T18:00:00.000Z',
    });
    expect(supabaseAdminMock.requestOwnAccountDeletion).toHaveBeenCalledWith(
      ACTIVE_USER.id,
    );
    expect(supabaseAdminMock.appendAuditLog).toHaveBeenCalledWith({
      action: 'account.deletion_requested',
      actorUserId: ACTIVE_USER.id,
      metadata: { status: 'pending' },
      targetId: 'df739f4c-cd08-42ac-8af6-cdf7875e3030',
      targetType: 'account_deletion_request',
    });
    expectForbiddenFieldsAbsent(res.body);

    const second = await request(app.getHttpServer())
      .post('/api/v1/me/deletion-request')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(second.body).toEqual(res.body);
  });

  it('GET /api/v1/me/deletion-request returns the current request status', async () => {
    deletionRequest = {
      ...createDeletionRequestRow(),
      status: 'processing',
      processing_started_at: '2026-05-25T09:00:00.000Z',
      updated_at: '2026-05-25T09:00:00.000Z',
    };

    const res = await request(app.getHttpServer())
      .get('/api/v1/me/deletion-request')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.status).toBe('processing');
    expect(res.body.processingStartedAt).toBe('2026-05-25T09:00:00.000Z');
    expectForbiddenFieldsAbsent(res.body);
  });

  it('POST /api/v1/me/tutor-profile creates the authenticated tutor profile', async () => {
    resolvedUser = withoutTutorProfile();

    const res = await request(app.getHttpServer())
      .post('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: '  Tutor Test  ' })
      .expect(201);

    expect(res.body).toEqual(EXPECTED_TUTOR_PROFILE);
    expect(supabaseAdminMock.createOwnTutorProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Tutor Test' },
    );
    expectTutorProfileSafePayload(res.body);

    const me = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(me.body.profiles.tutor).toEqual({
      id: TUTOR_PROFILE_ROW.id,
      displayName: 'Tutor Test',
      hasDefaultAddress: false,
    });
  });

  it('POST /api/v1/me/tutor-profile adds tutor role and profile together for provider-only users', async () => {
    resolvedUser = providerOnlyUser();

    await request(app.getHttpServer())
      .post('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: '  Tutor Added  ' })
      .expect(201);

    expect(supabaseAdminMock.createOwnTutorProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Tutor Added' },
    );

    const me = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(me.body.roles).toEqual(['provider', 'tutor']);
    expect(me.body.profiles.tutor).toEqual({
      id: TUTOR_PROFILE_ROW.id,
      displayName: 'Tutor Added',
      hasDefaultAddress: false,
    });
    expect(me.body.profiles.provider).toEqual(expectedProviderSummary());
  });

  it('PATCH /api/v1/me/tutor-profile updates the authenticated tutor profile', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: '  Tutor Updated  ' })
      .expect(200);

    expect(res.body).toEqual({
      ...EXPECTED_TUTOR_PROFILE,
      displayName: 'Tutor Updated',
      updatedAt: '2026-05-18T23:00:00.000Z',
    });
    expect(supabaseAdminMock.updateOwnTutorProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Tutor Updated' },
    );
    expectTutorProfileSafePayload(res.body);

    const me = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(me.body.profiles.tutor).toEqual({
      id: TUTOR_PROFILE_ROW.id,
      displayName: 'Tutor Updated',
      hasDefaultAddress: false,
    });
  });

  it('POST /api/v1/me/tutor-profile is idempotent for an existing tutor profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: 'Tutor Test' })
      .expect(201);

    expect(res.body).toEqual(EXPECTED_TUTOR_PROFILE);
    expect(supabaseAdminMock.createOwnTutorProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Tutor Test' },
    );
  });

  it('PATCH /api/v1/me/tutor-profile returns 404 when no tutor profile exists', async () => {
    resolvedUser = withoutTutorProfile();

    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: 'Tutor Test' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.updateOwnTutorProfile).not.toHaveBeenCalled();
  });

  it.each([
    ['non-object body', []],
    ['empty body', {}],
    ['empty displayName', { displayName: '   ' }],
    ['invalid displayName type', { displayName: 123 }],
    ['too long displayName', { displayName: 'x'.repeat(81) }],
  ])('POST /api/v1/me/tutor-profile rejects %s', async (_caseName, payload) => {
    resolvedUser = withoutTutorProfile();

    const res = await request(app.getHttpServer())
      .post('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send(payload)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createOwnTutorProfile).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/me/tutor-profile rejects an empty body', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({})
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateOwnTutorProfile).not.toHaveBeenCalled();
  });

  it('POST /api/v1/me/provider-profile creates a paused provider profile via the backend', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/provider-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: '  Provider Test  ' })
      .expect(201);

    expect(res.body).toEqual(EXPECTED_PROVIDER_PROFILE);
    expect(supabaseAdminMock.createOwnProviderProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Provider Test' },
    );
    expectProviderProfileSafePayload(res.body);

    const me = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(me.body.roles).toEqual(['tutor', 'provider']);
    expect(me.body.profiles.provider).toEqual({
      ...expectedProviderSummary('Provider Test'),
    });
  });

  it('PATCH /api/v1/me/provider-profile updates the authenticated provider profile', async () => {
    resolvedUser = providerOnlyUser();

    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/provider-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: '  Provider Updated  ' })
      .expect(200);

    expect(res.body).toEqual({
      ...EXPECTED_PROVIDER_PROFILE,
      displayName: 'Provider Updated',
      updatedAt: '2026-05-18T23:30:00.000Z',
    });
    expect(supabaseAdminMock.updateOwnProviderProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Provider Updated' },
    );
    expectProviderProfileSafePayload(res.body);
  });

  it('PATCH /api/v1/me/provider-profile can pause the provider profile', async () => {
    resolvedUser = providerOnlyUser();

    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/provider-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: 'Provider Test', publish: false })
      .expect(200);

    expect(res.body.status).toBe('paused');
    expect(supabaseAdminMock.updateOwnProviderProfile).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      { displayName: 'Provider Test', publish: false },
    );
    expectProviderProfileSafePayload(res.body);
  });

  it('PATCH /api/v1/me/provider-profile returns 404 when no provider profile exists', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/provider-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: 'Provider Test' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.updateOwnProviderProfile).not.toHaveBeenCalled();
  });

  it.each([
    ['non-object body', []],
    ['empty body', {}],
    ['empty displayName', { displayName: '   ' }],
    ['invalid displayName type', { displayName: 123 }],
    ['too long displayName', { displayName: 'x'.repeat(81) }],
  ])(
    'POST /api/v1/me/provider-profile rejects %s',
    async (_caseName, payload) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/me/provider-profile')
        .set('Authorization', 'Bearer test-token')
        .send(payload)
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(supabaseAdminMock.createOwnProviderProfile).not.toHaveBeenCalled();
    },
  );

  it('POST /api/v1/me/provider-profile blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/provider-profile')
      .set('Authorization', 'Bearer test-token')
      .send({
        displayName: 'Provider Test',
        status: 'active',
        role: 'admin',
        providerId: 'attacker',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['status', 'role', 'providerId']),
    );
    expect(supabaseAdminMock.createOwnProviderProfile).not.toHaveBeenCalled();
  });

  it('POST /api/v1/me/tutor-profile blocks fields outside the allowlist', async () => {
    resolvedUser = withoutTutorProfile();

    const res = await request(app.getHttpServer())
      .post('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({
        displayName: 'Tutor Test',
        userId: 'attacker-user',
        defaultAddressId: 'address-id',
        metadata: { role: 'admin' },
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['userId', 'defaultAddressId', 'metadata']),
    );
    expect(supabaseAdminMock.createOwnTutorProfile).not.toHaveBeenCalled();
  });
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
    'userId',
    'user_id',
    'defaultAddressId',
    'default_address_id',
    'internalNotes',
    'internal_notes',
    'metadata',
    'serviceRole',
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

function expectTutorProfileSafePayload(value: unknown): void {
  const forbidden = new Set([
    'userId',
    'user_id',
    'defaultAddressId',
    'default_address_id',
    'address',
    'location',
    'coordinates',
    'phone',
    'email',
    'roles',
    'status',
    'provider',
    'pets',
    'deletedAt',
    'deleted_at',
    'metadata',
    'token',
    'accessToken',
    'refreshToken',
    'serviceRole',
  ]);

  for (const key of collectKeys(value)) {
    expect(forbidden.has(key)).toBe(false);
  }
}

function expectProviderProfileSafePayload(value: unknown): void {
  const forbidden = new Set([
    'userId',
    'user_id',
    'baseAddressId',
    'base_address_id',
    'address',
    'location',
    'coordinates',
    'phone',
    'email',
    'roles',
    'tutor',
    'providerId',
    'provider_id',
    'providers',
    'deletedAt',
    'deleted_at',
    'metadata',
    'token',
    'accessToken',
    'refreshToken',
    'serviceRole',
  ]);

  for (const key of collectKeys(value)) {
    expect(forbidden.has(key)).toBe(false);
  }
}

function createDeletionRequestRow(): AccountDeletionRequestRecord {
  return {
    id: 'df739f4c-cd08-42ac-8af6-cdf7875e3030',
    status: 'pending',
    requested_at: '2026-05-24T18:00:00.000Z',
    estimated_completion_at: '2026-06-23T18:00:00.000Z',
    processing_started_at: null,
    completed_at: null,
    updated_at: '2026-05-24T18:00:00.000Z',
  };
}

function withoutTutorProfile(): AuthUser {
  return {
    ...ACTIVE_USER,
    profiles: {},
  };
}

function withTutorProfile(
  displayName: string,
  currentUser: AuthUser | null,
): AuthUser {
  const currentRoles = currentUser?.roles ?? ACTIVE_USER.roles;
  const currentProvider = currentUser?.profiles?.provider;
  return {
    ...ACTIVE_USER,
    roles: currentRoles.includes('tutor')
      ? currentRoles
      : [...currentRoles, 'tutor'],
    profiles: {
      ...(currentProvider ? { provider: currentProvider } : {}),
      tutor: {
        id: TUTOR_PROFILE_ROW.id,
        displayName,
      },
    },
  };
}

function providerOnlyUser(): AuthUser {
  return {
    ...ACTIVE_USER,
    roles: ['provider'],
    profiles: {
      provider: expectedProviderSummary(),
    },
  };
}

function withProviderProfile(
  displayName: string,
  currentUser: AuthUser | null,
  row: ProviderProfileRecord = PROVIDER_PROFILE_ROW,
): AuthUser {
  const currentRoles = currentUser?.roles ?? ACTIVE_USER.roles;
  const currentTutor = currentUser?.profiles?.tutor;
  return {
    ...ACTIVE_USER,
    roles: currentRoles.includes('provider')
      ? currentRoles
      : [...currentRoles, 'provider'],
    profiles: {
      ...(currentTutor ? { tutor: currentTutor } : {}),
      provider: expectedProviderSummary(displayName, row),
    },
  };
}

function expectedProviderSummary(
  displayName = PROVIDER_PROFILE_ROW.display_name,
  row: ProviderProfileRecord = PROVIDER_PROFILE_ROW,
) {
  return {
    id: row.id,
    displayName,
    bio: row.bio,
    status: row.status,
    serviceRadiusKm: row.service_radius_km,
    ratingAverage: row.rating_average,
    ratingCount: row.rating_count,
    listingId: row.listing_id ?? null,
    categoryId: row.category ?? null,
    service: row.service_label ?? null,
    pricePerHour: row.price_per_hour ?? null,
    isAvailable: row.is_available ?? null,
  };
}
