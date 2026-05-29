import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import { DomainException } from '../src/common/errors/domain.exception';
import { ErrorCode } from '../src/common/errors/error-codes';
import type { BookingRecord } from '../src/bookings/dto/booking-fields';
import type { CreateBookingInput } from '../src/bookings/dto/create-booking-request.dto';

const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';
const PET_ID = '11111111-2222-4333-8444-555555555555';
const BOOKING_ID = '33333333-4444-4555-8666-777777777777';

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

const PROVIDER_USER: AuthUser = {
  id: '4f42df90-1111-4222-8333-123456789abc',
  email: 'provider@teste.com',
  roles: ['provider'],
  status: 'active',
  locale: 'en-GB',
  profiles: {
    provider: {
      id: '8370c4f3-1111-4e1d-9222-123456789abc',
      bio: null,
      categoryId: 'walk',
      displayName: 'Provider Test',
      isAvailable: true,
      listingId: PROVIDER_ID,
      pricePerHour: 18.5,
      ratingAverage: null,
      ratingCount: 0,
      service: 'Dog walking',
      serviceRadiusKm: 5,
      status: 'active',
    },
  },
};

const BOOKING_ROW: BookingRecord = {
  id: BOOKING_ID,
  provider_id: PROVIDER_ID,
  pet_id: PET_ID,
  service_label: 'Dog walking · 30 min',
  booking_date: '2026-06-01',
  time_slot_id: '09:00',
  time_slot_ids: ['09:00', '10:00'],
  status: 'requested',
  viewer_role: 'tutor',
  provider_name: 'Provider Test',
  tutor_name: 'Tutor Test',
  pet_name: 'Biscuit',
  counterpart_name: 'Provider Test',
  counterpart_avatar_url: 'https://example.test/provider.jpg',
  counterpart_role: 'provider',
  booking_group_key: 'opaque-booking-group',
  price_per_hour_snapshot: 18.5,
  estimated_total_amount: 37,
  currency: 'GBP',
  created_at: '2026-05-22T10:00:00.000Z',
  updated_at: '2026-05-22T10:00:00.000Z',
};

const EXPECTED_BOOKING = {
  id: BOOKING_ID,
  providerId: PROVIDER_ID,
  petId: PET_ID,
  date: '2026-06-01',
  timeSlotId: '09:00',
  timeSlotIds: ['09:00', '10:00'],
  service: 'Dog walking · 30 min',
  status: 'requested',
  viewerRole: 'tutor',
  providerName: 'Provider Test',
  tutorName: 'Tutor Test',
  petName: 'Biscuit',
  counterpartName: 'Provider Test',
  counterpartAvatarUrl: 'https://example.test/provider.jpg',
  counterpartRole: 'provider',
  bookingGroupKey: 'opaque-booking-group',
  pricePerHourSnapshot: 18.5,
  estimatedTotalAmount: 37,
  currency: 'GBP',
  createdAt: BOOKING_ROW.created_at,
  updatedAt: BOOKING_ROW.updated_at,
};

const VALID_CREATE_BODY = {
  providerId: PROVIDER_ID,
  date: '2026-06-01',
  timeSlotIds: ['09:00', '10:00'],
  petId: PET_ID,
  service: 'Dog walking · 30 min',
};

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let availabilityResult: {
    configuredSlotIds: string[];
    occupiedSlotIds: string[];
  } | null;
  let createError: DomainException | null;
  let updateResult: BookingRecord | null;
  let updateError: DomainException | null;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    getProviderAvailability: jest.fn(
      async (_providerId: string, _date: string) => availabilityResult,
    ),
    getOwnProviderWeeklyAvailability: jest.fn(async (_user: AuthUser) => [
      { weekday: 1, timeSlotIds: ['09:00'] },
    ]),
    updateOwnProviderWeeklyAvailability: jest.fn(
      async (_user: AuthUser, input: { days: unknown[] }) => input.days,
    ),
    listBookings: jest.fn(
      async (_tutorProfileId: string, _pagination: unknown) => ({
        items: [BOOKING_ROW],
        nextCursor: null,
      }),
    ),
    listBookingsForUser: jest.fn(
      async (_user: AuthUser, _pagination: unknown) => ({
        items: [BOOKING_ROW],
        nextCursor: null,
      }),
    ),
    createBooking: jest.fn(
      async (_tutorProfileId: string, input: CreateBookingInput) => {
        if (createError) throw createError;
        return {
          ...BOOKING_ROW,
          provider_id: input.providerId,
          pet_id: input.petId,
          service_label: input.service,
          booking_date: input.date,
          time_slot_id: input.timeSlotId,
          time_slot_ids: input.timeSlotIds,
          estimated_total_amount: input.timeSlotIds.length * 18.5,
        };
      },
    ),
    updateBookingStatus: jest.fn(
      async (_user: AuthUser, _bookingId: string, status: string) => {
        if (updateError) throw updateError;
        return updateResult
          ? { ...updateResult, status: status as BookingRecord['status'] }
          : null;
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
    availabilityResult = {
      configuredSlotIds: ['08:00', '09:00', '10:00', '14:00'],
      occupiedSlotIds: ['09:00', '14:00'],
    };
    createError = null;
    updateResult = BOOKING_ROW;
    updateError = null;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.getProviderAvailability.mockClear();
    supabaseAdminMock.getOwnProviderWeeklyAvailability.mockClear();
    supabaseAdminMock.updateOwnProviderWeeklyAvailability.mockClear();
    supabaseAdminMock.listBookings.mockClear();
    supabaseAdminMock.listBookingsForUser.mockClear();
    supabaseAdminMock.createBooking.mockClear();
    supabaseAdminMock.updateBookingStatus.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- GET /providers/:id/availability ---

  it('GET /providers/:id/availability returns the configured slot grid', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/providers/${PROVIDER_ID}/availability`)
      .query({ date: '2026-06-01' })
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toHaveLength(4);
    expect(res.body[0]).toEqual({
      id: '08:00',
      label: '08:00',
      isAvailable: true,
    });
    const occupied = res.body.filter(
      (slot: { isAvailable: boolean }) => !slot.isAvailable,
    );
    expect(occupied.map((slot: { id: string }) => slot.id)).toEqual([
      '09:00',
      '14:00',
    ]);
    expect(supabaseAdminMock.getProviderAvailability).toHaveBeenCalledWith(
      PROVIDER_ID,
      '2026-06-01',
    );
  });

  it('GET /providers/me/availability returns the provider weekly schedule', async () => {
    resolvedUser = PROVIDER_USER;

    const res = await request(app.getHttpServer())
      .get('/api/v1/providers/me/availability')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.days).toHaveLength(7);
    expect(res.body.days[1]).toEqual({
      weekday: 1,
      timeSlotIds: ['09:00'],
    });
    expect(
      supabaseAdminMock.getOwnProviderWeeklyAvailability,
    ).toHaveBeenCalledWith(PROVIDER_USER);
  });

  it('PATCH /providers/me/availability saves the provider weekly schedule', async () => {
    resolvedUser = PROVIDER_USER;

    const body = {
      days: [
        { weekday: 1, timeSlotIds: ['09:00', '10:00'] },
        { weekday: 2, timeSlotIds: [] },
      ],
    };

    const res = await request(app.getHttpServer())
      .patch('/api/v1/providers/me/availability')
      .set('Authorization', 'Bearer test-token')
      .send(body)
      .expect(200);

    expect(res.body.days[1]).toEqual({
      weekday: 1,
      timeSlotIds: ['09:00', '10:00'],
    });
    expect(
      supabaseAdminMock.updateOwnProviderWeeklyAvailability,
    ).toHaveBeenCalledWith(
      PROVIDER_USER,
      expect.objectContaining({ days: expect.any(Array) }),
    );
  });

  it('GET /providers/:id/availability returns 404 for an unknown provider', async () => {
    availabilityResult = null;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/providers/${PROVIDER_ID}/availability`)
      .query({ date: '2026-06-01' })
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it.each([
    ['missing date', {}],
    ['malformed date', { date: '01-06-2026' }],
    ['impossible date', { date: '2026-02-31' }],
  ])('GET /providers/:id/availability rejects %s', async (_caseName, query) => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/providers/${PROVIDER_ID}/availability`)
      .query(query)
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.getProviderAvailability).not.toHaveBeenCalled();
  });

  // --- POST /bookings ---

  it('POST /bookings creates a requested booking scoped to the tutor', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_CREATE_BODY)
      .expect(201);

    expect(res.body).toEqual(EXPECTED_BOOKING);
    expect(supabaseAdminMock.createBooking).toHaveBeenCalledWith(
      TUTOR_PROFILE_ID,
      {
        providerId: PROVIDER_ID,
        date: '2026-06-01',
        timeSlotId: '09:00',
        timeSlotIds: ['09:00', '10:00'],
        petId: PET_ID,
        service: 'Dog walking · 30 min',
      },
    );
    expectSafeBookingPayload(res.body);
  });

  it('POST /bookings returns 409 when the slot is no longer free', async () => {
    createError = new DomainException(
      ErrorCode.CONFLICT,
      'The selected time slot is no longer available.',
      {},
      HttpStatus.CONFLICT,
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_CREATE_BODY)
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /bookings returns 404 when the user has no tutor profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .send(VALID_CREATE_BODY)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(supabaseAdminMock.createBooking).not.toHaveBeenCalled();
  });

  it.each([
    ['missing fields', { providerId: PROVIDER_ID }],
    ['invalid time slot', { ...VALID_CREATE_BODY, timeSlotIds: ['09:30'] }],
    [
      'duplicate time slot',
      { ...VALID_CREATE_BODY, timeSlotIds: ['09:00', '09:00'] },
    ],
    ['malformed date', { ...VALID_CREATE_BODY, date: 'tomorrow' }],
    ['non-UUID providerId', { ...VALID_CREATE_BODY, providerId: 'x' }],
    ['empty service', { ...VALID_CREATE_BODY, service: '   ' }],
  ])('POST /bookings rejects %s', async (_caseName, body) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .send(body)
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createBooking).not.toHaveBeenCalled();
  });

  it('POST /bookings blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .send({
        ...VALID_CREATE_BODY,
        status: 'confirmed',
        tutorProfileId: 'attacker',
        amount: 100,
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['status', 'tutorProfileId', 'amount']),
    );
    expect(supabaseAdminMock.createBooking).not.toHaveBeenCalled();
  });

  // --- GET /bookings ---

  it('GET /bookings returns the authenticated tutor bookings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({
      items: [EXPECTED_BOOKING],
      nextCursor: null,
    });
    expect(supabaseAdminMock.listBookingsForUser).toHaveBeenCalledWith(
      ACTIVE_USER,
      { cursor: null, limit: 10, perspective: null, status: null },
    );
    expectSafeBookingPayload(res.body);
  });

  it('GET /bookings forwards optional pagination, perspective and status filters', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .query({
        cursor: 'opaque-cursor',
        limit: '10',
        perspective: 'provider',
        status: 'confirmed',
      })
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        bookingGroupKey: 'opaque-booking-group',
        counterpartAvatarUrl: 'https://example.test/provider.jpg',
        counterpartName: 'Provider Test',
        counterpartRole: 'provider',
      }),
    );
    expect(supabaseAdminMock.listBookingsForUser).toHaveBeenCalledWith(
      ACTIVE_USER,
      {
        cursor: 'opaque-cursor',
        limit: 10,
        perspective: 'provider',
        status: 'confirmed',
      },
    );
    expectSafeBookingPayload(res.body);
  });

  it('GET /bookings returns an empty list when the user has no care profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({ items: [], nextCursor: null });
    expect(supabaseAdminMock.listBookingsForUser).not.toHaveBeenCalled();
  });

  it('GET /bookings rejects pagination limits above the server cap', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .query({ limit: '51' })
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.listBookingsForUser).not.toHaveBeenCalled();
  });

  it.each([
    ['invalid status', { status: 'paid' }],
    ['invalid perspective', { perspective: 'admin' }],
  ])('GET /bookings rejects %s', async (_caseName, query) => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/bookings')
      .query(query)
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.listBookingsForUser).not.toHaveBeenCalled();
  });

  // --- PATCH /bookings/:id ---

  it('PATCH /bookings/:id changes the booking status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${BOOKING_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'cancelled' })
      .expect(200);

    expect(res.body.status).toBe('cancelled');
    expect(supabaseAdminMock.updateBookingStatus).toHaveBeenCalledWith(
      ACTIVE_USER,
      BOOKING_ID,
      'cancelled',
    );
    expectSafeBookingPayload(res.body);
  });

  it('PATCH /bookings/:id returns 409 for a forbidden status transition', async () => {
    updateError = new DomainException(
      ErrorCode.BUSINESS_RULE_VIOLATION,
      'Cannot change booking status from cancelled to confirmed.',
      {},
      HttpStatus.CONFLICT,
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${BOOKING_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'confirmed' })
      .expect(409);

    expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('PATCH /bookings/:id returns 404 when the booking is not a participant booking', async () => {
    updateResult = null;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${BOOKING_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'cancelled' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /bookings/:id rejects an unknown status value', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/bookings/${BOOKING_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'paid' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateBookingStatus).not.toHaveBeenCalled();
  });

  it('PATCH /bookings/:id rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/bookings/not-a-uuid')
      .set('Authorization', 'Bearer test-token')
      .send({ status: 'cancelled' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updateBookingStatus).not.toHaveBeenCalled();
  });
});

/**
 * Garante que a resposta de booking não vaza dados internos nem qualquer
 * campo de pagamento/proteção financeira (design.md §11 "Payments").
 */
function expectSafeBookingPayload(value: unknown): void {
  const forbidden = new Set([
    'tutorProfileId',
    'tutor_profile_id',
    'price',
    'amount',
    'payment',
    'paymentIntent',
    'protection',
    'insurance',
    'refund',
    'escrow',
    'guarantee',
    'token',
    'accessToken',
    'address',
    'addressLine',
    'coordinates',
    'latitude',
    'longitude',
    'metadata',
    'storagePath',
    'storage_path',
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
