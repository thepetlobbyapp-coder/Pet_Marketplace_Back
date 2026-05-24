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
        resolvedUser = withTutorProfile(input.displayName);
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
        resolvedUser = withTutorProfile(input.displayName);
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
    supabaseAdminMock.createOwnTutorProfile.mockClear();
    supabaseAdminMock.updateOwnTutorProfile.mockClear();
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
      profiles: ACTIVE_USER.profiles,
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
    });
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
    });
  });

  it('POST /api/v1/me/tutor-profile returns 409 when a tutor profile already exists', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({ displayName: 'Tutor Test' })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
    expect(supabaseAdminMock.createOwnTutorProfile).not.toHaveBeenCalled();
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
  ])(
    'POST /api/v1/me/tutor-profile rejects %s',
    async (_caseName, payload) => {
      resolvedUser = withoutTutorProfile();

      const res = await request(app.getHttpServer())
        .post('/api/v1/me/tutor-profile')
        .set('Authorization', 'Bearer test-token')
        .send(payload)
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(supabaseAdminMock.createOwnTutorProfile).not.toHaveBeenCalled();
    },
  );

  it('PATCH /api/v1/me/tutor-profile rejects an empty body', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/me/tutor-profile')
      .set('Authorization', 'Bearer test-token')
      .send({})
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateOwnTutorProfile).not.toHaveBeenCalled();
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
  const provider = ACTIVE_USER.profiles?.provider;
  return {
    ...ACTIVE_USER,
    profiles: provider ? { provider } : {},
  };
}

function withTutorProfile(displayName: string): AuthUser {
  return {
    ...ACTIVE_USER,
    profiles: {
      ...ACTIVE_USER.profiles,
      tutor: {
        id: TUTOR_PROFILE_ROW.id,
        displayName,
      },
    },
  };
}
