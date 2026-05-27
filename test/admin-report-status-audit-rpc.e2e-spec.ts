import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import { AuthBackendUnavailableException } from '../src/common/errors/domain.exception';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type { Env } from '../src/config/env.schema';
import type { ReportRecord } from '../src/trust-safety/dto/trust-safety-fields';

const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const REPORT_ID = '66666666-7777-4888-8999-000000000000';

const REPORT_ROW: ReportRecord = {
  id: REPORT_ID,
  status: 'in_review',
  category: 'safety_concern',
  target_type: 'conversation',
  target_id: '44444444-5555-4666-8777-888888888888',
  created_at: '2026-05-25T12:00:00.000Z',
  updated_at: '2026-05-25T12:10:00.000Z',
};

describe('SupabaseAdminService admin report status audit RPC', () => {
  const logger = {
    error: jest.fn(),
    setContext: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };
  const maybeSingle = jest.fn();
  const rpc = jest.fn(() => ({ maybeSingle }));

  beforeEach(() => {
    logger.error.mockClear();
    logger.setContext.mockClear();
    config.get.mockClear();
    maybeSingle.mockReset();
    rpc.mockClear();
  });

  it('updates report status through the transactional audit RPC', async () => {
    maybeSingle.mockResolvedValueOnce({ data: REPORT_ROW, error: null });
    const service = createServiceWithClient({ rpc });

    const report = await service.updateAdminReportStatusWithAudit(
      ADMIN_ID,
      REPORT_ID,
      { status: 'in_review', internalNote: 'Internal moderation note.' },
    );

    expect(report).toEqual(REPORT_ROW);
    expect(rpc).toHaveBeenCalledWith('admin_update_report_status_with_audit', {
      p_admin_user_id: ADMIN_ID,
      p_report_id: REPORT_ID,
      p_status: 'in_review',
      p_internal_note: 'Internal moderation note.',
    });
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('returns null when the transactional RPC finds no report', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const service = createServiceWithClient({ rpc });

    await expect(
      service.updateAdminReportStatusWithAudit(ADMIN_ID, REPORT_ID, {
        status: 'in_review',
        internalNote: null,
      }),
    ).resolves.toBeNull();
  });

  it('surfaces RPC failures without logging private moderation notes', async () => {
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'XX000' },
    });
    const service = createServiceWithClient({ rpc });

    await expect(
      service.updateAdminReportStatusWithAudit(ADMIN_ID, REPORT_ID, {
        status: 'in_review',
        internalNote: 'Internal moderation note.',
      }),
    ).rejects.toBeInstanceOf(AuthBackendUnavailableException);

    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      'Internal moderation note.',
    );
  });

  function createServiceWithClient(client: unknown): SupabaseAdminService {
    const service = new SupabaseAdminService(
      config as unknown as ConfigService<Env, true>,
      logger as unknown as PinoLogger,
    );
    (service as unknown as { client: unknown }).client = client;
    return service;
  }
});
