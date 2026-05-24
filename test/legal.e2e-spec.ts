import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import { API_PREFIX, GLOBAL_PREFIX_EXCLUDES } from '../src/http-prefix';

describe('Legal pages (e2e)', () => {
  let app: INestApplication;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabaseMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(API_PREFIX, { exclude: GLOBAL_PREFIX_EXCLUDES });
    await app.init();
  });

  beforeEach(() => {
    supabaseMock.resolveUser.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /privacy opens without authentication', async () => {
    const res = await request(app.getHttpServer()).get('/privacy').expect(200);

    expect(res.text).toContain('Privacy Policy');
    expect(res.text).toContain('Supabase');
    expect(res.text).toContain('DigitalOcean');
    expect(res.text).toContain('in-app payments are not implemented');
    expect(res.text).toContain('href="/account-deletion"');
    expect(res.text).toContain('Automated deletion and anonymisation jobs');
    expect(supabaseMock.resolveUser).not.toHaveBeenCalled();
  });

  it('GET /terms opens without authentication', async () => {
    const res = await request(app.getHttpServer()).get('/terms').expect(200);

    expect(res.text).toContain('Terms of Use');
    expect(res.text).toContain('Provider profiles, search results, bookings');
    expect(res.text).toContain('In-app payments are not implemented');
    expect(res.text).toContain('href="/privacy"');
    expect(res.text).toContain('href="/account-deletion"');
    expect(supabaseMock.resolveUser).not.toHaveBeenCalled();
  });
});
