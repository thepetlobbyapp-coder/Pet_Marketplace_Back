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
  AddressWithDefaultRecord,
} from '../src/addresses/dto/address-fields';
import type { CreateAddressInput } from '../src/addresses/dto/create-address-request.dto';
import type { UpdateAddressInput } from '../src/addresses/dto/update-address-request.dto';

const USER_ID = '56e4ff57-5355-47bb-904b-27ebde394bf7';
const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const ADDRESS_ID = '22222222-3333-4444-8555-666666666666';

const ACTIVE_USER: AuthUser = {
  id: USER_ID,
  email: 'tutor@teste.com',
  roles: ['tutor'],
  status: 'active',
  locale: 'en-GB',
  profiles: {
    tutor: { id: TUTOR_PROFILE_ID, displayName: 'Tutor Test' },
  },
};

const ADDRESS_ROW: AddressWithDefaultRecord = {
  id: ADDRESS_ID,
  label: 'Home',
  country_code: 'GB',
  city: 'London',
  postcode: 'SW1A',
  public_area_label: 'Westminster, London',
  location_precision: 'postcode',
  isDefaultTutorAddress: true,
  created_at: '2026-05-22T15:00:00.000Z',
  updated_at: '2026-05-22T15:00:00.000Z',
};

const EXPECTED_ADDRESS = {
  id: ADDRESS_ID,
  label: 'Home',
  countryCode: 'GB',
  city: 'London',
  postcode: 'SW1A',
  publicAreaLabel: 'Westminster, London',
  locationPrecision: 'postcode',
  isDefaultTutorAddress: true,
  createdAt: ADDRESS_ROW.created_at,
  updatedAt: ADDRESS_ROW.updated_at,
};

describe('Addresses (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let updateResult: AddressWithDefaultRecord | null;
  let deleteResult: boolean | 'active-provider-base';

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    listOwnAddresses: jest.fn(async () => [ADDRESS_ROW]),
    createOwnAddress: jest.fn(
      async (
        _userId: string,
        _tutorProfileId: string | null,
        input: CreateAddressInput,
      ) => ({
        ...ADDRESS_ROW,
        label: input.label,
        country_code: input.countryCode,
        city: input.city,
        postcode: input.postcode,
        public_area_label: input.publicAreaLabel,
        location_precision: input.locationPrecision,
        isDefaultTutorAddress: input.setAsDefaultTutorAddress,
      }),
    ),
    updateOwnAddress: jest.fn(
      async (
        _userId: string,
        _tutorProfileId: string | null,
        _addressId: string,
        input: UpdateAddressInput,
      ) =>
        updateResult
          ? {
              ...updateResult,
              label: input.label ?? updateResult.label,
              city: input.city ?? updateResult.city,
              postcode: input.postcode ?? updateResult.postcode,
              public_area_label:
                input.publicAreaLabel ?? updateResult.public_area_label,
              location_precision:
                input.locationPrecision ?? updateResult.location_precision,
              isDefaultTutorAddress:
                input.setAsDefaultTutorAddress ??
                updateResult.isDefaultTutorAddress,
            }
          : null,
    ),
    deleteOwnAddress: jest.fn(async () => {
      if (deleteResult === 'active-provider-base') {
        throw new DomainException(
          ErrorCode.CONFLICT,
          'Pause your provider listing before deleting its base address.',
          {},
          HttpStatus.CONFLICT,
        );
      }
      return deleteResult;
    }),
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
    updateResult = { ...ADDRESS_ROW, isDefaultTutorAddress: false };
    deleteResult = true;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.listOwnAddresses.mockClear();
    supabaseAdminMock.createOwnAddress.mockClear();
    supabaseAdminMock.updateOwnAddress.mockClear();
    supabaseAdminMock.deleteOwnAddress.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/addresses returns own addresses safely', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/addresses')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([EXPECTED_ADDRESS]);
    expect(supabaseAdminMock.listOwnAddresses).toHaveBeenCalledWith(USER_ID);
    expectSafeAddressPayload(res.body);
  });

  it('POST /api/v1/addresses creates an own address safely', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', 'Bearer test-token')
      .send({
        label: '  Home  ',
        countryCode: 'GB',
        city: '  London  ',
        postcode: '  SW1A  ',
        publicAreaLabel: '  Westminster, London  ',
        latitude: 51.501,
        longitude: -0.141,
        locationPrecision: 'postcode',
        setAsDefaultTutorAddress: true,
      })
      .expect(201);

    expect(res.body).toEqual(EXPECTED_ADDRESS);
    expect(supabaseAdminMock.createOwnAddress).toHaveBeenCalledWith(
      USER_ID,
      TUTOR_PROFILE_ID,
      {
        label: 'Home',
        countryCode: 'GB',
        city: 'London',
        postcode: 'SW1A',
        publicAreaLabel: 'Westminster, London',
        latitude: 51.501,
        longitude: -0.141,
        locationPrecision: 'postcode',
        setAsDefaultTutorAddress: true,
      },
    );
    expectSafeAddressPayload(res.body);
  });

  it('POST /api/v1/addresses creates without default when no tutor profile exists', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', 'Bearer test-token')
      .send({
        city: 'London',
        latitude: 51.501,
        longitude: -0.141,
        setAsDefaultTutorAddress: true,
      })
      .expect(201);

    expect(supabaseAdminMock.createOwnAddress).toHaveBeenCalledWith(
      USER_ID,
      null,
      expect.objectContaining({ setAsDefaultTutorAddress: true }),
    );
  });

  it('PATCH /api/v1/addresses/:id updates an own address safely', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/addresses/${ADDRESS_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({
        label: 'Work area',
        publicAreaLabel: 'Camden, London',
        latitude: 51.54,
        longitude: -0.14,
        setAsDefaultTutorAddress: true,
      })
      .expect(200);

    expect(res.body.label).toBe('Work area');
    expect(res.body.publicAreaLabel).toBe('Camden, London');
    expect(res.body.isDefaultTutorAddress).toBe(true);
    expect(supabaseAdminMock.updateOwnAddress).toHaveBeenCalledWith(
      USER_ID,
      TUTOR_PROFILE_ID,
      ADDRESS_ID,
      {
        label: 'Work area',
        publicAreaLabel: 'Camden, London',
        latitude: 51.54,
        longitude: -0.14,
        setAsDefaultTutorAddress: true,
      },
    );
    expectSafeAddressPayload(res.body);
  });

  it('PATCH /api/v1/addresses/:id returns 404 for missing or unowned address', async () => {
    updateResult = null;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/addresses/${ADDRESS_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ label: 'Other' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('DELETE /api/v1/addresses/:id deletes an own address', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/addresses/${ADDRESS_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(204);

    expect(supabaseAdminMock.deleteOwnAddress).toHaveBeenCalledWith(
      USER_ID,
      ADDRESS_ID,
    );
  });

  it('DELETE /api/v1/addresses/:id returns 404 for missing or unowned address', async () => {
    deleteResult = false;

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/addresses/${ADDRESS_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('DELETE /api/v1/addresses/:id returns 409 for an active provider base address', async () => {
    deleteResult = 'active-provider-base';

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/addresses/${ADDRESS_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    ['non-object body', []],
    ['missing latitude', { city: 'London', longitude: -0.141 }],
    ['missing longitude', { city: 'London', latitude: 51.501 }],
    ['latitude outside UK range', { city: 'London', latitude: 10, longitude: 0 }],
    ['longitude outside UK range', { city: 'London', latitude: 51, longitude: 20 }],
    ['unsupported country', { city: 'London', countryCode: 'US', latitude: 51, longitude: 0 }],
    ['exact precision', { city: 'London', latitude: 51, longitude: 0, locationPrecision: 'exact' }],
    ['no readable address', { latitude: 51, longitude: 0 }],
  ])('POST /api/v1/addresses rejects %s', async (_caseName, payload) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', 'Bearer test-token')
      .send(payload)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createOwnAddress).not.toHaveBeenCalled();
  });

  it('POST /api/v1/addresses blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', 'Bearer test-token')
      .send({
        city: 'London',
        latitude: 51,
        longitude: 0,
        userId: 'attacker',
        line1: 'Full street address',
        formattedAddress: 'Full street address, London',
        location: 'POINT(0 51)',
        coordinates: [0, 51],
        baseAddressId: ADDRESS_ID,
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining([
        'userId',
        'line1',
        'formattedAddress',
        'location',
        'coordinates',
        'baseAddressId',
      ]),
    );
    expect(supabaseAdminMock.createOwnAddress).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/addresses/:id rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/addresses/not-a-uuid')
      .set('Authorization', 'Bearer test-token')
      .send({ label: 'Home' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateOwnAddress).not.toHaveBeenCalled();
  });

  it('DELETE /api/v1/addresses/:id rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/v1/addresses/not-a-uuid')
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.deleteOwnAddress).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/addresses/:id rejects partial coordinate updates', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/addresses/${ADDRESS_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ latitude: 51.5 })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateOwnAddress).not.toHaveBeenCalled();
  });
});

function expectSafeAddressPayload(value: unknown): void {
  const forbidden = new Set([
    'userId',
    'user_id',
    'line1',
    'formattedAddress',
    'formatted_address',
    'location',
    'coordinates',
    'lat',
    'lng',
    'latitude',
    'longitude',
    'defaultAddressId',
    'default_address_id',
    'baseAddressId',
    'base_address_id',
    'providerProfileId',
    'provider_profile_id',
    'email',
    'phone',
    'token',
    'accessToken',
    'refreshToken',
    'serviceRole',
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
