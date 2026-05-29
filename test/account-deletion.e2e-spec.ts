import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuditLogger } from '../src/audit/audit.logger';
import { SupabaseService } from '../src/common/auth/supabase.service';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import { API_PREFIX, GLOBAL_PREFIX_EXCLUDES } from '../src/http-prefix';

interface PublicDeletionMockResult {
  userId: string | null;
  requestId: string | null;
}

describe('Public account deletion (e2e)', () => {
  let app: INestApplication;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(),
  };

  const supabaseAdminMock = {
    requestPublicAccountDeletionByEmail: jest.fn(
      async (): Promise<PublicDeletionMockResult> => ({
        userId: null,
        requestId: null,
      }),
    ),
  };

  const auditMock = {
    record: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      .overrideProvider(SupabaseAdminService)
      .useValue(supabaseAdminMock)
      .overrideProvider(AuditLogger)
      .useValue(auditMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_PREFIX, { exclude: GLOBAL_PREFIX_EXCLUDES });
    await app.init();
  });

  beforeEach(() => {
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.requestPublicAccountDeletionByEmail.mockClear();
    auditMock.record.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /account-deletion opens without authentication', async () => {
    const res = await request(app.getHttpServer())
      .get('/account-deletion')
      .expect(200);

    expect(res.text).toContain('Request account deletion');
    expect(res.text).toContain(
      'action="/api/v1/account-deletion/request"',
    );
    expect(res.text).toContain('does not reveal whether an account');
    expect(res.text).toContain('href="/privacy"');
    expect(res.text).toContain('href="/terms"');
    expect(supabaseMock.resolveUser).not.toHaveBeenCalled();
  });

  it('POST /api/v1/account-deletion/request returns a generic response', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/account-deletion/request')
      .send({ email: '  User@Example.COM  ', confirm: true })
      .expect(202);

    expect(res.body).toEqual({
      received: true,
      message:
        'If the email belongs to an account on The Pet Lobby, the deletion request has been received.',
      estimatedProcessingDays: 30,
    });
    expect(
      supabaseAdminMock.requestPublicAccountDeletionByEmail,
    ).toHaveBeenCalledWith('user@example.com');
    expect(auditMock.record).toHaveBeenCalledWith({
      actorUserId: null,
      action: 'account.public_deletion_requested',
      entityType: 'account_deletion_request',
      entityId: null,
      metadata: { source: 'public_web' },
    });
  });

  it('does not reveal whether the submitted email belongs to an account', async () => {
    supabaseAdminMock.requestPublicAccountDeletionByEmail
      .mockResolvedValueOnce({ userId: null, requestId: null })
      .mockResolvedValueOnce({
        userId: '56e4ff57-5355-47bb-904b-27ebde394bf7',
        requestId: 'df739f4c-cd08-42ac-8af6-cdf7875e3030',
      });

    const unknown = await request(app.getHttpServer())
      .post('/api/v1/account-deletion/request')
      .send({ email: 'unknown@example.com', confirm: true })
      .expect(202);

    const known = await request(app.getHttpServer())
      .post('/api/v1/account-deletion/request')
      .send({ email: 'known@example.com', confirm: true })
      .expect(202);

    expect(known.body).toEqual(unknown.body);
    expect(known.body).not.toHaveProperty('id');
    expect(known.body).not.toHaveProperty('userId');
  });

  it('redirects form submissions to a visual confirmation page', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/account-deletion/request')
      .type('form')
      .send({
        email: 'user@example.com',
        confirm: 'true',
        responseMode: 'web',
      })
      .expect(303)
      .expect('Location', '/account-deletion?submitted=1');
  });

  it('rejects invalid email payloads without calling the account lookup', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/account-deletion/request')
      .send({ email: 'not-an-email', confirm: true })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(
      supabaseAdminMock.requestPublicAccountDeletionByEmail,
    ).not.toHaveBeenCalled();
  });
});
