import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type {
  ConversationRecord,
  MessageRecord,
} from '../src/conversations/dto/conversation-fields';

const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';
const CONVERSATION_ID = '44444444-5555-4666-8777-888888888888';
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

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    listConversations: jest.fn(async (_tutorProfileId: string) => [
      CONVERSATION_ROW,
    ]),
    listMessages: jest.fn(
      async (_tutorProfileId: string, _conversationId: string) =>
        messagesResult,
    ),
    createMessage: jest.fn(
      async (_tutorProfileId: string, _conversationId: string, text: string) =>
        createResult ? { ...createResult, body: text } : null,
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
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.listConversations.mockClear();
    supabaseAdminMock.listMessages.mockClear();
    supabaseAdminMock.createMessage.mockClear();
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

    expect(res.body).toEqual([
      {
        id: CONVERSATION_ID,
        providerId: PROVIDER_ID,
        lastMessage: 'See you at 9am.',
        lastTime: '2026-05-22T11:00:00.000Z',
        unread: true,
      },
    ]);
    expect(supabaseAdminMock.listConversations).toHaveBeenCalledWith(
      TUTOR_PROFILE_ID,
    );
    expectSafeConversationPayload(res.body);
  });

  it('GET /conversations returns an empty list without a tutor profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .get('/api/v1/conversations')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([]);
    expect(supabaseAdminMock.listConversations).not.toHaveBeenCalled();
  });

  // --- GET /conversations/:id/messages ---

  it('GET /conversations/:id/messages returns the message thread', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([
      {
        id: MESSAGE_ID,
        fromProvider: false,
        text: 'Hi! Is 9am still available?',
        time: '2026-05-22T10:30:00.000Z',
      },
    ]);
    expect(supabaseAdminMock.listMessages).toHaveBeenCalledWith(
      TUTOR_PROFILE_ID,
      CONVERSATION_ID,
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

  it('GET /conversations/:id/messages returns 404 without a tutor profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .get(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.listMessages).not.toHaveBeenCalled();
  });

  it('GET /conversations/:id/messages rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/conversations/not-a-uuid/messages')
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.listMessages).not.toHaveBeenCalled();
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
    expect(supabaseAdminMock.createMessage).toHaveBeenCalledWith(
      TUTOR_PROFILE_ID,
      CONVERSATION_ID,
      'Yes please!',
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

  it.each([
    ['missing text', {}],
    ['empty text', { text: '   ' }],
    ['non-string text', { text: 42 }],
  ])(
    'POST /conversations/:id/messages rejects %s',
    async (_caseName, body) => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${CONVERSATION_ID}/messages`)
        .set('Authorization', 'Bearer test-token')
        .send(body)
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(supabaseAdminMock.createMessage).not.toHaveBeenCalled();
    },
  );

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
    expect(supabaseAdminMock.createMessage).not.toHaveBeenCalled();
  });

  it('POST /conversations/:id/messages rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/conversations/not-a-uuid/messages')
      .set('Authorization', 'Bearer test-token')
      .send({ text: 'Hello' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createMessage).not.toHaveBeenCalled();
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
