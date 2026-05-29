import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import { DomainException } from '../src/common/errors/domain.exception';
import { ErrorCode } from '../src/common/errors/error-codes';
import type {
  ConversationRecord,
  MessageRecord,
} from '../src/conversations/dto/conversation-fields';

const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const PROVIDER_PROFILE_ID = '2a0a2ea6-1f58-4690-94ce-d55728954e0e';
const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';
const OTHER_PROVIDER_ID = '88888888-7777-4666-8555-444444444444';
const CONVERSATION_ID = '44444444-5555-4666-8777-888888888888';
const NEW_CONVERSATION_ID = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const MESSAGE_ID = '55555555-6666-4777-8888-999999999999';

const ACTIVE_USER: AuthUser = {
  id: '56e4ff57-5355-47bb-904b-27ebde394bf7',
  email: 'tutor@teste.com',
  roles: ['tutor'],
  status: 'active',
  locale: 'en-GB',
  profiles: {
    tutor: { id: TUTOR_PROFILE_ID, displayName: 'Tutor Test' },
  },
};

const CONVERSATION_ROW: ConversationRecord = {
  id: CONVERSATION_ID,
  provider_id: PROVIDER_ID,
  last_message_text: 'See you at 9am.',
  last_message_at: '2026-05-22T11:00:00.000Z',
  last_message_from_provider: true,
};

const PROVIDER_CONVERSATION_ROW: ConversationRecord = {
  ...CONVERSATION_ROW,
  counterpart_avatar_url: 'https://cdn.example.com/tutor-avatar.jpg',
  counterpart_name: 'Israel Tutor',
  counterpart_service_label: 'Tutor conversation',
  last_message_from_provider: false,
  viewer_is_provider: true,
};

const MESSAGE_ROW: MessageRecord = {
  id: MESSAGE_ID,
  from_provider: false,
  body: 'Hi! Is 9am still available?',
  created_at: '2026-05-22T10:30:00.000Z',
};

describe('Conversations (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let messagesResult: MessageRecord[] | null;
  let createResult: MessageRecord | null;
  let createError: DomainException | null;
  let openConversationResult: ConversationRecord | null;
  let openConversationError: DomainException | null;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    listConversations: jest.fn(
      async (_tutorProfileId: string, _pagination: unknown) => ({
        items: [CONVERSATION_ROW],
        nextCursor: null,
      }),
    ),
    listConversationsForUser: jest.fn(
      async (user: AuthUser, _pagination: unknown) => ({
        items: [
          user.profiles?.provider && !user.profiles?.tutor
            ? PROVIDER_CONVERSATION_ROW
            : CONVERSATION_ROW,
        ],
        nextCursor: null,
      }),
    ),
    listMessages: jest.fn(
      async (
        _tutorProfileId: string,
        _conversationId: string,
        _pagination: unknown,
      ) =>
        messagesResult === null
          ? null
          : { items: messagesResult, nextCursor: null },
    ),
    listMessagesForUser: jest.fn(
      async (_user: AuthUser, _conversationId: string, _pagination: unknown) =>
        messagesResult === null
          ? null
          : { items: messagesResult, nextCursor: null },
    ),
    createMessage: jest.fn(
      async (
        _tutorUserId: string,
        _tutorProfileId: string,
        _conversationId: string,
        text: string,
      ) => {
        if (createError) throw createError;
        return createResult ? { ...createResult, body: text } : null;
      },
    ),
    createMessageForUser: jest.fn(
      async (_user: AuthUser, _conversationId: string, text: string) => {
        if (createError) throw createError;
        return createResult ? { ...createResult, body: text } : null;
      },
    ),
    openConversation: jest.fn(
      async (
        _tutorUserId: string,
        _tutorProfileId: string,
        _providerId: string,
      ) => {
        if (openConversationError) throw openConversationError;
        return openConversationResult;
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
    messagesResult = [MESSAGE_ROW];
    createResult = MESSAGE_ROW;
    createError = null;
    openConversationResult = {
      id: NEW_CONVERSATION_ID,
      provider_id: OTHER_PROVIDER_ID,
      last_message_text: null,
      last_message_at: null,
      last_message_from_provider: false,
    };
    openConversationError = null;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.listConversations.mockClear();
    supabaseAdminMock.listConversationsForUser.mockClear();
    supabaseAdminMock.listMessages.mockClear();
    supabaseAdminMock.listMessagesForUser.mockClear();
    supabaseAdminMock.createMessage.mockClear();
    supabaseAdminMock.createMessageForUser.mockClear();
    supabaseAdminMock.openConversation.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- GET /conversations ---

  it('GET /conversations returns the tutor conversation summaries', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      items: [
        {
          id: CONVERSATION_ID,
          providerId: PROVIDER_ID,
          lastMessage: 'See you at 9am.',
          lastTime: '2026-05-22T11:00:00.000Z',
          unread: true,
          counterpartAvatarUrl: null,
          counterpartName: null,
          counterpartService: null,
          viewerIsProvider: false,
        },
      ],
      nextCursor: null,
    });
    expect(supabaseAdminMock.listConversationsForUser).toHaveBeenCalledWith(
      ACTIVE_USER,
      { cursor: null, limit: 20 },
    );
    expectSafeConversationPayload(res.body);
  });

  it('GET /conversations returns provider conversation summaries', async () => {
    resolvedUser = providerOnlyUser();

    const res = await request(app.getHttpServer())
      .get('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      items: [
        {
          id: CONVERSATION_ID,
          providerId: PROVIDER_ID,
          lastMessage: 'See you at 9am.',
          lastTime: '2026-05-22T11:00:00.000Z',
          unread: true,
          counterpartAvatarUrl: 'https://cdn.example.com/tutor-avatar.jpg',
          counterpartName: 'Israel Tutor',
          counterpartService: 'Tutor conversation',
          viewerIsProvider: true,
        },
      ],
      nextCursor: null,
    });
    expect(supabaseAdminMock.listConversationsForUser).toHaveBeenCalledWith(
      providerOnlyUser(),
      { cursor: null, limit: 20 },
    );
    expectSafeConversationPayload(res.body);
  });

  it('GET /conversations returns an empty list without a care profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .get('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({ items: [], nextCursor: null });
    expect(supabaseAdminMock.listConversationsForUser).not.toHaveBeenCalled();
  });

  // --- GET /conversations/:id/messages ---

  it('GET /conversations/:id/messages returns the message thread', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      items: [
        {
          id: MESSAGE_ID,
          fromProvider: false,
          text: 'Hi! Is 9am still available?',
          time: '2026-05-22T10:30:00.000Z',
        },
      ],
      nextCursor: null,
    });
    expect(supabaseAdminMock.listMessagesForUser).toHaveBeenCalledWith(
      ACTIVE_USER,
      CONVERSATION_ID,
      { cursor: null, limit: 50 },
    );
    expectSafeConversationPayload(res.body);
  });

  it('GET /conversations/:id/messages returns a generic 404 for an unowned conversation', async () => {
    messagesResult = null;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.details).toEqual({});
  });

  it('GET /conversations/:id/messages returns 404 without a care profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.listMessagesForUser).not.toHaveBeenCalled();
  });

  it('GET /conversations/:id/messages rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/conversations/not-a-uuid/messages')
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.listMessagesForUser).not.toHaveBeenCalled();
  });

  it('GET /conversations/:id/messages rejects pagination limits above the server cap', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .query({ limit: '101' })
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.listMessagesForUser).not.toHaveBeenCalled();
  });

  // --- POST /conversations/:id/messages ---

  it('POST /conversations/:id/messages creates a tutor message', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send({ text: '  Yes please!  ' })
      .expect(201);

    expect(res.body).toEqual({
      id: MESSAGE_ID,
      fromProvider: false,
      text: 'Yes please!',
      time: MESSAGE_ROW.created_at,
    });
    expect(supabaseAdminMock.createMessageForUser).toHaveBeenCalledWith(
      ACTIVE_USER,
      CONVERSATION_ID,
      'Yes please!',
    );
    expectSafeConversationPayload(res.body);
  });

  it('POST /conversations/:id/messages creates a provider message', async () => {
    resolvedUser = providerOnlyUser();
    createResult = { ...MESSAGE_ROW, from_provider: true };

    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send({ text: '  Confirmed, see you soon.  ' })
      .expect(201);

    expect(res.body).toEqual({
      id: MESSAGE_ID,
      fromProvider: true,
      text: 'Confirmed, see you soon.',
      time: MESSAGE_ROW.created_at,
    });
    expect(supabaseAdminMock.createMessageForUser).toHaveBeenCalledWith(
      providerOnlyUser(),
      CONVERSATION_ID,
      'Confirmed, see you soon.',
    );
    expectSafeConversationPayload(res.body);
  });

  it('POST /conversations/:id/messages returns a generic 404 for an unowned conversation', async () => {
    createResult = null;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send({ text: 'Hello' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /conversations/:id/messages returns 403 when the conversation is blocked', async () => {
    createError = new DomainException(
      ErrorCode.FORBIDDEN,
      'This conversation is blocked.',
      {},
      403,
    );

    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send({ text: 'Hello' })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(JSON.stringify(res.body)).not.toContain('Hello');
  });

  it.each([
    ['missing text', {}],
    ['empty text', { text: '   ' }],
    ['non-string text', { text: 42 }],
  ])('POST /conversations/:id/messages rejects %s', async (_caseName, body) => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send(body)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createMessageForUser).not.toHaveBeenCalled();
  });

  it('POST /conversations/:id/messages never echoes the message text in errors', async () => {
    const secret = 'super-secret-message-body-1234567890';
    const longText = secret.repeat(100);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send({ text: longText })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body)).not.toContain(secret);
  });

  it('POST /conversations/:id/messages blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .send({ text: 'Hello', fromProvider: true, conversationId: 'attacker' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['fromProvider', 'conversationId']),
    );
    expect(supabaseAdminMock.createMessageForUser).not.toHaveBeenCalled();
  });

  it('POST /conversations/:id/messages rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations/not-a-uuid/messages')
      .set('Authorization', 'Bearer test-token')
      .send({ text: 'Hello' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createMessageForUser).not.toHaveBeenCalled();
  });

  // --- POST /conversations (cold-start) ---

  it('POST /conversations requires bearer auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(401);

    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(supabaseMock.resolveUser).not.toHaveBeenCalled();
    expect(supabaseAdminMock.openConversation).not.toHaveBeenCalled();
  });

  it('POST /conversations opens (or resumes) a tutor↔provider conversation', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(200);

    expect(res.body).toEqual({
      id: NEW_CONVERSATION_ID,
      providerId: OTHER_PROVIDER_ID,
      lastMessage: null,
      lastTime: null,
      unread: false,
      counterpartAvatarUrl: null,
      counterpartName: null,
      counterpartService: null,
      viewerIsProvider: false,
    });
    expect(supabaseAdminMock.openConversation).toHaveBeenCalledWith(
      ACTIVE_USER.id,
      TUTOR_PROFILE_ID,
      OTHER_PROVIDER_ID,
    );
    expectSafeConversationPayload(res.body);
  });

  it('POST /conversations returns 404 when the provider is unavailable', async () => {
    openConversationResult = null;

    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.details).toEqual({});
  });

  it('POST /conversations returns 404 without a tutor profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.openConversation).not.toHaveBeenCalled();
  });

  it('POST /conversations returns 403 when either side has blocked the other', async () => {
    openConversationError = new DomainException(
      ErrorCode.FORBIDDEN,
      'This conversation is blocked.',
      {},
      HttpStatus.FORBIDDEN,
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /conversations returns 429 when the cold-start rate limit is reached', async () => {
    openConversationError = new DomainException(
      ErrorCode.RATE_LIMITED,
      'Too many new conversations started recently. Please try again later.',
      { limit: 5, windowMs: 60 * 60 * 1000 },
      HttpStatus.TOO_MANY_REQUESTS,
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(429);

    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.body.error.details).toEqual({
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
  });

  it.each([
    ['missing providerId', {}],
    ['non-UUID providerId', { providerId: 'not-a-uuid' }],
    ['null providerId', { providerId: null }],
    ['numeric providerId', { providerId: 42 }],
  ])('POST /conversations rejects %s', async (_caseName, body) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send(body)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.openConversation).not.toHaveBeenCalled();
  });

  it('POST /conversations blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({
        providerId: OTHER_PROVIDER_ID,
        tutorProfileId: 'attacker',
        bookingId: 'attacker-2',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['tutorProfileId', 'bookingId']),
    );
    expect(supabaseAdminMock.openConversation).not.toHaveBeenCalled();
  });

  it('POST /conversations is idempotent — repeated calls return the same conversation', async () => {
    const firstRes = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(200);

    const secondRes = await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .send({ providerId: OTHER_PROVIDER_ID })
      .expect(200);

    expect(secondRes.body).toEqual(firstRes.body);
    expect(supabaseAdminMock.openConversation).toHaveBeenCalledTimes(2);
  });
});

/** Garante que a resposta não vaza identificadores internos sensíveis. */
function expectSafeConversationPayload(value: unknown): void {
  const forbidden = new Set([
    'tutorProfileId',
    'tutor_profile_id',
    'bookingId',
    'booking_id',
    'conversationId',
    'conversation_id',
    'body',
    'token',
    'accessToken',
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

function providerOnlyUser(): AuthUser {
  return {
    ...ACTIVE_USER,
    email: 'cuidador@pet.com',
    roles: ['provider'],
    profiles: {
      provider: {
        id: PROVIDER_PROFILE_ID,
        displayName: 'Caregiver Test',
        bio: null,
        categoryId: 'walk',
        isAvailable: true,
        listingId: PROVIDER_ID,
        pricePerHour: 25,
        ratingAverage: null,
        ratingCount: 0,
        service: 'Dog walking',
        serviceRadiusKm: 5,
        status: 'active',
      },
    },
  };
}
