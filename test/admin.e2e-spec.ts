import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { DomainException } from '../src/common/errors/domain.exception';
import { ErrorCode } from '../src/common/errors/error-codes';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const PROVIDER_ID = '33333333-3333-4333-8333-333333333333';
const BOOKING_ID = '44444444-4444-4444-8444-444444444444';
const AUDIT_ID = '55555555-5555-4555-8555-555555555555';

const ACTIVE_USER: AuthUser = {
  id: USER_ID,
  roles: ['tutor'],
  status: 'active',
};

const ADMIN_USER: AuthUser = {
  email: 'admin@example.test',
  id: ADMIN_ID,
  roles: ['admin'],
  status: 'active',
};

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser = ACTIVE_USER;

  const supabaseMock = {
    get isConfigured() {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    getAdminDashboardSummary: jest.fn(async () => ({
      blocked_users: 1,
      bookings_by_status: {
        cancelled: 1,
        completed: 2,
        confirmed: 3,
        requested: 4,
      },
      open_reports: 5,
      total_providers: 6,
      total_tutors: 7,
      total_users: 8,
    })),
    listAdminAuditLogs: jest.fn(async (_pagination: unknown) => ({
      items: [
        {
          action: 'trust_safety.report_status_updated',
          actor_user_id: ADMIN_ID,
          created_at: '2026-05-18T12:04:00.000Z',
          id: AUDIT_ID,
          target_id: '66666666-6666-4666-8666-666666666666',
          target_type: 'report',
        },
      ],
      nextCursor: null,
    })),
    listAdminBookings: jest.fn(async (_pagination: unknown) => ({
      items: [
        {
          booking_date: '2026-05-21',
          created_at: '2026-05-18T12:03:00.000Z',
          id: BOOKING_ID,
          service_label: 'Dog walking',
          status: 'requested',
          time_slot_id: '09:00',
          updated_at: '2026-05-18T12:05:00.000Z',
        },
      ],
      nextCursor: null,
    })),
    listAdminProviders: jest.fn(async (_pagination: unknown) => ({
      items: [
        {
          created_at: '2026-05-18T12:02:00.000Z',
          display_name: 'Safe Provider',
          id: PROVIDER_ID,
          service_count: 2,
          status: 'active',
          updated_at: '2026-05-18T12:05:00.000Z',
        },
      ],
      nextCursor: null,
    })),
    listAdminUsers: jest.fn(async (_pagination: unknown) => ({
      items: [
        {
          created_at: '2026-05-18T12:01:00.000Z',
          email: 'user@example.test',
          id: USER_ID,
          roles: ['tutor'],
          status: 'active',
          updated_at: '2026-05-18T12:05:00.000Z',
        },
      ],
      nextCursor: 'cursor-2',
    })),
    updateAdminUserStatusWithAudit: jest.fn(async () => ({
      created_at: '2026-05-18T12:01:00.000Z',
      email: 'user@example.test',
      id: USER_ID,
      roles: ['tutor'],
      status: 'blocked',
      updated_at: '2026-05-18T12:06:00.000Z',
    })),
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
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.getAdminDashboardSummary.mockClear();
    supabaseAdminMock.listAdminAuditLogs.mockClear();
    supabaseAdminMock.listAdminBookings.mockClear();
    supabaseAdminMock.listAdminProviders.mockClear();
    supabaseAdminMock.listAdminUsers.mockClear();
    supabaseAdminMock.updateAdminUserStatusWithAudit.mockClear();
    supabaseAdminMock.updateAdminUserStatusWithAudit.mockImplementation(
      async () => ({
        created_at: '2026-05-18T12:01:00.000Z',
        email: 'user@example.test',
        id: USER_ID,
        roles: ['tutor'],
        status: 'blocked',
        updated_at: '2026-05-18T12:06:00.000Z',
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires admin role for admin lists', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', 'Bearer test-token')
      .expect(403);

    expect(supabaseAdminMock.listAdminUsers).not.toHaveBeenCalled();
  });

  it('requires admin role for dashboard summary', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', 'Bearer test-token')
      .expect(403);

    expect(supabaseAdminMock.getAdminDashboardSummary).not.toHaveBeenCalled();
  });

  it('returns aggregate dashboard KPIs for admins only', async () => {
    resolvedUser = ADMIN_USER;

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      blockedUsers: 1,
      bookingsByStatus: {
        cancelled: 1,
        completed: 2,
        confirmed: 3,
        requested: 4,
      },
      openReports: 5,
      totalProviders: 6,
      totalTutors: 7,
      totalUsers: 8,
    });
    expect(supabaseAdminMock.getAdminDashboardSummary).toHaveBeenCalledTimes(1);
    expectSafeAdminDashboardPayload(res.body);
  });

  it('lists users with cursor pagination and safe fields', async () => {
    resolvedUser = ADMIN_USER;

    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/users?limit=20&cursor=cursor-1')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      items: [
        {
          createdAt: '2026-05-18T12:01:00.000Z',
          email: 'user@example.test',
          id: USER_ID,
          roles: ['tutor'],
          status: 'active',
          updatedAt: '2026-05-18T12:05:00.000Z',
        },
      ],
      nextCursor: 'cursor-2',
    });
    expect(supabaseAdminMock.listAdminUsers).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      limit: 20,
    });
    expectSafeAdminPayload(res.body);
  });

  it('allows admins to block and reactivate users with safe responses', async () => {
    resolvedUser = ADMIN_USER;

    const blockRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${USER_ID}/status`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'blocked' })
      .expect(200);

    expect(blockRes.body).toEqual({
      createdAt: '2026-05-18T12:01:00.000Z',
      email: 'user@example.test',
      id: USER_ID,
      roles: ['tutor'],
      status: 'blocked',
      updatedAt: '2026-05-18T12:06:00.000Z',
    });
    expect(
      supabaseAdminMock.updateAdminUserStatusWithAudit,
    ).toHaveBeenCalledWith(ADMIN_ID, USER_ID, { status: 'blocked' });

    supabaseAdminMock.updateAdminUserStatusWithAudit.mockResolvedValueOnce({
      created_at: '2026-05-18T12:01:00.000Z',
      email: 'user@example.test',
      id: USER_ID,
      roles: ['tutor'],
      status: 'active',
      updated_at: '2026-05-18T12:07:00.000Z',
    });

    const reactivateRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${USER_ID}/status`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'active' })
      .expect(200);

    expect(reactivateRes.body.status).toBe('active');
    expect(
      supabaseAdminMock.updateAdminUserStatusWithAudit,
    ).toHaveBeenCalledWith(ADMIN_ID, USER_ID, { status: 'active' });
    expectSafeAdminPayload(blockRes.body);
    expectSafeAdminPayload(reactivateRes.body);
  });

  it('requires admin role for user status updates', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${USER_ID}/status`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'blocked' })
      .expect(403);

    expect(
      supabaseAdminMock.updateAdminUserStatusWithAudit,
    ).not.toHaveBeenCalled();
  });

  it('rejects unsafe user status update payloads', async () => {
    resolvedUser = ADMIN_USER;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${USER_ID}/status`)
      .set('Authorization', 'Bearer test-token')
      .send({ roles: ['admin'], status: 'deleted' })
      .expect(400);

    expect(
      supabaseAdminMock.updateAdminUserStatusWithAudit,
    ).not.toHaveBeenCalled();
  });

  it('surfaces self-block and deleted-user rules from the domain service', async () => {
    resolvedUser = ADMIN_USER;
    supabaseAdminMock.updateAdminUserStatusWithAudit.mockRejectedValueOnce(
      new DomainException(
        ErrorCode.FORBIDDEN,
        'Admins cannot block their own account.',
        {},
        HttpStatus.FORBIDDEN,
      ),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${ADMIN_ID}/status`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'blocked' })
      .expect(403);

    supabaseAdminMock.updateAdminUserStatusWithAudit.mockRejectedValueOnce(
      new DomainException(
        ErrorCode.BUSINESS_RULE_VIOLATION,
        'Deleted users cannot be updated by admin status actions.',
        {},
        HttpStatus.CONFLICT,
      ),
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${USER_ID}/status`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'active' })
      .expect(409);
  });

  it('lists providers, bookings and audit logs using safe envelopes', async () => {
    resolvedUser = ADMIN_USER;

    const providerRes = await request(app.getHttpServer())
      .get('/api/v1/admin/providers')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
    const bookingRes = await request(app.getHttpServer())
      .get('/api/v1/admin/bookings')
      .set('Authorization', 'Bearer test-token')
      .expect(200);
    const auditRes = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(providerRes.body.items[0]).toEqual({
      createdAt: '2026-05-18T12:02:00.000Z',
      displayName: 'Safe Provider',
      id: PROVIDER_ID,
      serviceCount: 2,
      status: 'active',
      updatedAt: '2026-05-18T12:05:00.000Z',
    });
    expect(bookingRes.body.items[0]).toEqual({
      createdAt: '2026-05-18T12:03:00.000Z',
      date: '2026-05-21',
      id: BOOKING_ID,
      service: 'Dog walking',
      status: 'requested',
      timeSlotId: '09:00',
      updatedAt: '2026-05-18T12:05:00.000Z',
    });
    expect(auditRes.body.items[0]).toEqual({
      action: 'trust_safety.report_status_updated',
      actorUserId: ADMIN_ID,
      createdAt: '2026-05-18T12:04:00.000Z',
      id: AUDIT_ID,
      targetId: '66666666-6666-4666-8666-666666666666',
      targetType: 'report',
    });
    expect(supabaseAdminMock.listAdminProviders).toHaveBeenCalledWith({
      cursor: null,
      limit: 50,
    });
    expect(supabaseAdminMock.listAdminBookings).toHaveBeenCalledWith({
      cursor: null,
      limit: 50,
    });
    expect(supabaseAdminMock.listAdminAuditLogs).toHaveBeenCalledWith({
      cursor: null,
      limit: 50,
    });
    expectSafeAdminPayload(providerRes.body);
    expectSafeAdminPayload(bookingRes.body);
    expectSafeAdminPayload(auditRes.body);
  });
});

function expectSafeAdminPayload(value: unknown): void {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'accessToken',
    'address',
    'authorization',
    'body',
    'coordinates',
    'description',
    'internalNote',
    'internal_note',
    'location',
    'metadata',
    'phone',
    'rawMetadata',
    'serviceRole',
    'service_role',
    'token',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
}

function expectSafeAdminDashboardPayload(value: unknown): void {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    '"accessToken"',
    '"actorUserId"',
    '"address"',
    '"authorization"',
    '"body"',
    '"coordinates"',
    '"description"',
    '"displayName"',
    '"email"',
    '"id"',
    '"internalNote"',
    '"internal_note"',
    '"location"',
    '"metadata"',
    '"phone"',
    '"rawMetadata"',
    '"serviceRole"',
    '"service_role"',
    '"targetId"',
    '"token"',
  ]) {
    expect(serialized).not.toContain(forbidden);
  }
  expect(serialized).not.toContain('@');
}
