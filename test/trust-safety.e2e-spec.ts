import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type {
  ReportRecord,
  UserBlockRecord,
} from '../src/trust-safety/dto/trust-safety-fields';

const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const CONVERSATION_ID = '44444444-5555-4666-8777-888888888888';
const MESSAGE_ID = '55555555-6666-4777-8888-999999999999';
const REPORT_ID = '66666666-7777-4888-8999-000000000000';
const BLOCK_ID = '77777777-8888-4999-8aaa-111111111111';
const PROVIDER_USER_ID = '88888888-9999-4aaa-8bbb-222222222222';

const ACTIVE_USER: AuthUser = {
  id: '56e4ff57-5355-47bb-904b-27ebde394bf7',
  roles: ['tutor'],
  status: 'active',
  locale: 'en-GB',
  profiles: {
    tutor: { id: TUTOR_PROFILE_ID, displayName: 'Tutor Test' },
  },
};

const ADMIN_USER: AuthUser = {
  ...ACTIVE_USER,
  roles: ['admin'],
};

const REPORT_ROW: ReportRecord = {
  id: REPORT_ID,
  status: 'open',
  category: 'safety_concern',
  target_type: 'conversation',
  target_id: CONVERSATION_ID,
  created_at: '2026-05-25T12:00:00.000Z',
  updated_at: '2026-05-25T12:00:00.000Z',
};

const BLOCK_ROW: UserBlockRecord = {
  id: BLOCK_ID,
  blocked_user_id: PROVIDER_USER_ID,
  conversation_id: CONVERSATION_ID,
  created_at: '2026-05-25T12:05:00.000Z',
};

describe('TrustSafety (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let createReportResult: ReportRecord | null;
  let blockResult: UserBlockRecord | null;
  let updateReportResult: ReportRecord | null;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    createTrustSafetyReport: jest.fn(
      async (
        _user: AuthUser,
        input: { targetType: string; targetId: string },
      ) =>
        createReportResult
          ? {
              ...createReportResult,
              target_type: input.targetType,
              target_id: input.targetId,
            }
          : null,
    ),
    blockConversationParticipant: jest.fn(
      async (_user: AuthUser, _conversationId: string) => blockResult,
    ),
    listAdminReports: jest.fn(async () => [REPORT_ROW]),
    updateAdminReportStatus: jest.fn(
      async (
        _adminUserId: string,
        _reportId: string,
        input: { status: string },
      ) =>
        updateReportResult
          ? { ...updateReportResult, status: input.status }
          : null,
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
    createReportResult = REPORT_ROW;
    blockResult = BLOCK_ROW;
    updateReportResult = REPORT_ROW;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.createTrustSafetyReport.mockClear();
    supabaseAdminMock.blockConversationParticipant.mockClear();
    supabaseAdminMock.listAdminReports.mockClear();
    supabaseAdminMock.updateAdminReportStatus.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /reports creates a safe conversation report', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'conversation',
        targetId: CONVERSATION_ID,
        category: 'safety_concern',
        description: 'Please review this conversation.',
      })
      .expect(201);

    expect(res.body).toEqual({
      id: REPORT_ID,
      status: 'open',
      category: 'safety_concern',
      targetType: 'conversation',
      targetId: CONVERSATION_ID,
      createdAt: REPORT_ROW.created_at,
      updatedAt: REPORT_ROW.updated_at,
    });
    expect(supabaseAdminMock.createTrustSafetyReport).toHaveBeenCalledWith(
      ACTIVE_USER,
      {
        targetType: 'conversation',
        targetId: CONVERSATION_ID,
        category: 'safety_concern',
        description: 'Please review this conversation.',
      },
    );
    expectSafeTrustSafetyPayload(res.body);
  });

  it('POST /reports supports message targets without exposing message text', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'message',
        targetId: MESSAGE_ID,
        category: 'harassment',
      })
      .expect(201);

    expect(res.body.targetType).toBe('message');
    expect(res.body.targetId).toBe(MESSAGE_ID);
    expectSafeTrustSafetyPayload(res.body);
  });

  it('POST /reports returns a generic 404 when the target is not reportable by the user', async () => {
    createReportResult = null;

    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'conversation',
        targetId: CONVERSATION_ID,
        category: 'safety_concern',
      })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.details).toEqual({});
  });

  it('POST /reports rejects invalid payloads without echoing report text', async () => {
    const oversizedMarker = 'oversized-report-context-123';

    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'conversation',
        targetId: CONVERSATION_ID,
        category: 'safety_concern',
        description: oversizedMarker.repeat(80),
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body)).not.toContain(oversizedMarker);
    expect(supabaseAdminMock.createTrustSafetyReport).not.toHaveBeenCalled();
  });

  it('POST /reports blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'conversation',
        targetId: CONVERSATION_ID,
        category: 'safety_concern',
        reporterUserId: 'attacker',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['reporterUserId']),
    );
  });

  it('POST /conversations/:id/block blocks the other conversation participant', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/conversations/${CONVERSATION_ID}/block`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      id: BLOCK_ID,
      blockedUserId: PROVIDER_USER_ID,
      conversationId: CONVERSATION_ID,
      createdAt: BLOCK_ROW.created_at,
    });
    expect(supabaseAdminMock.blockConversationParticipant).toHaveBeenCalledWith(
      ACTIVE_USER,
      CONVERSATION_ID,
    );
    expectSafeTrustSafetyPayload(res.body);
  });

  it('GET /admin/reports requires admin role', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/reports')
      .set('Authorization', 'Bearer test-token')
      .expect(403);
  });

  it('GET /admin/reports lists safe reports for admin users', async () => {
    resolvedUser = ADMIN_USER;

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/reports')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([
      {
        id: REPORT_ID,
        status: 'open',
        category: 'safety_concern',
        targetType: 'conversation',
        targetId: CONVERSATION_ID,
        createdAt: REPORT_ROW.created_at,
        updatedAt: REPORT_ROW.updated_at,
      },
    ]);
    expectSafeTrustSafetyPayload(res.body);
  });

  it('PATCH /admin/reports/:id updates report status for admin users', async () => {
    resolvedUser = ADMIN_USER;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/reports/${REPORT_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'in_review', internalNote: 'Internal moderation note.' })
      .expect(200);

    expect(res.body.status).toBe('in_review');
    expect(supabaseAdminMock.updateAdminReportStatus).toHaveBeenCalledWith(
      ADMIN_USER.id,
      REPORT_ID,
      { status: 'in_review', internalNote: 'Internal moderation note.' },
    );
    expectSafeTrustSafetyPayload(res.body);
  });
});

function expectSafeTrustSafetyPayload(value: unknown): void {
  const forbidden = new Set([
    'token',
    'accessToken',
    'authorization',
    'email',
    'messageText',
    'body',
    'description',
    'internalNote',
    'internal_note',
    'reporterUserId',
    'reporter_user_id',
    'reportedUserId',
    'reported_user_id',
    'metadata',
    'serviceRole',
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
