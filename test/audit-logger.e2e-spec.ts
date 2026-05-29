import type { PinoLogger } from 'nestjs-pino';
import { AuditLogger } from '../src/audit/audit.logger';
import { AuthBackendUnavailableException } from '../src/common/errors/domain.exception';
import type { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';

describe('AuditLogger', () => {
  const pino = {
    info: jest.fn(),
    setContext: jest.fn(),
  };

  const admin = {
    appendAuditLog: jest.fn(async () => undefined),
  };

  beforeEach(() => {
    pino.info.mockClear();
    pino.setContext.mockClear();
    admin.appendAuditLog.mockClear();
  });

  it('persists a safe audit log and redacts unsupported metadata', async () => {
    const audit = new AuditLogger(
      pino as unknown as PinoLogger,
      admin as unknown as SupabaseAdminService,
    );

    await audit.record({
      actorUserId: '22222222-2222-4222-8222-222222222222',
      action: 'trust_safety.report_status_updated',
      entityType: 'report',
      entityId: '66666666-7777-4888-8999-000000000000',
      metadata: {
        address: '1 Private Street',
        category: 'safety_concern',
        description: 'Reported private text.',
        email: 'admin@example.test',
        internalNote: 'Internal moderation note.',
        location: { lat: 51.5, lng: -0.12 },
        mime: 'image/png',
        phone: '+447700900123',
        sizeBytes: 123,
        source: 'public_web',
        status: 'in_review',
        targetType: 'conversation',
        token: 'secret-token',
      },
    });

    expect(admin.appendAuditLog).toHaveBeenCalledWith({
      action: 'trust_safety.report_status_updated',
      actorUserId: '22222222-2222-4222-8222-222222222222',
      metadata: {
        category: 'safety_concern',
        status: 'in_review',
        targetType: 'conversation',
      },
      targetId: '66666666-7777-4888-8999-000000000000',
      targetType: 'report',
    });
    expect(JSON.stringify(pino.info.mock.calls)).not.toContain(
      'Internal moderation note.',
    );
    expect(JSON.stringify(admin.appendAuditLog.mock.calls)).not.toContain(
      'Reported private text.',
    );
    expect(JSON.stringify(admin.appendAuditLog.mock.calls)).not.toContain(
      'secret-token',
    );
  });

  it('surfaces audit persistence failures to the caller', async () => {
    admin.appendAuditLog.mockRejectedValueOnce(
      new AuthBackendUnavailableException(),
    );
    const audit = new AuditLogger(
      pino as unknown as PinoLogger,
      admin as unknown as SupabaseAdminService,
    );

    await expect(
      audit.record({
        actorUserId: '22222222-2222-4222-8222-222222222222',
        action: 'trust_safety.report_status_updated',
        entityType: 'report',
        entityId: '66666666-7777-4888-8999-000000000000',
        metadata: { status: 'in_review' },
      }),
    ).rejects.toBeInstanceOf(AuthBackendUnavailableException);
  });
});
