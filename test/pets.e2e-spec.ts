import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/common/auth/supabase.service';
import type { AuthUser } from '../src/common/auth/auth-user';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import type { PetRecord } from '../src/pets/dto/pet-fields';
import type { CreatePetInput } from '../src/pets/dto/create-pet-request.dto';
import type { UpdatePetInput } from '../src/pets/dto/update-pet-request.dto';

const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
const PET_ID = '11111111-2222-4333-8444-555555555555';

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

const PET_ROW: PetRecord = {
  id: PET_ID,
  name: 'Rex',
  species: 'dog',
  breed: 'Labrador',
  size: 'large',
  age_range: 'adult',
  notes: 'Friendly',
  created_at: '2026-05-20T10:00:00.000Z',
  updated_at: '2026-05-20T10:00:00.000Z',
};

const EXPECTED_PET = {
  id: PET_ID,
  name: 'Rex',
  species: 'dog',
  breed: 'Labrador',
  size: 'large',
  ageRange: 'adult',
  notes: 'Friendly',
  createdAt: PET_ROW.created_at,
  updatedAt: PET_ROW.updated_at,
};

describe('Pets (e2e)', () => {
  let app: INestApplication;
  let resolvedUser: AuthUser | null;
  let updateResult: PetRecord | null;
  let deleteResult: boolean;

  const supabaseMock = {
    get isConfigured(): boolean {
      return true;
    },
    resolveUser: jest.fn(async () => resolvedUser),
  };

  const supabaseAdminMock = {
    listPets: jest.fn(async (_tutorProfileId: string) => [PET_ROW]),
    createPet: jest.fn(
      async (_tutorProfileId: string, input: CreatePetInput) => ({
        ...PET_ROW,
        name: input.name,
        species: input.species,
        size: input.size,
        breed: input.breed,
        age_range: input.ageRange,
        notes: input.notes,
      }),
    ),
    updatePet: jest.fn(
      async (
        _tutorProfileId: string,
        _petId: string,
        _input: UpdatePetInput,
      ) => updateResult,
    ),
    softDeletePet: jest.fn(async () => deleteResult),
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
    updateResult = { ...PET_ROW, name: 'Rex Updated' };
    deleteResult = true;
    supabaseMock.resolveUser.mockClear();
    supabaseAdminMock.listPets.mockClear();
    supabaseAdminMock.createPet.mockClear();
    supabaseAdminMock.updatePet.mockClear();
    supabaseAdminMock.softDeletePet.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/pets returns only the authenticated tutor pets', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/pets')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([EXPECTED_PET]);
    expect(supabaseAdminMock.listPets).toHaveBeenCalledWith(TUTOR_PROFILE_ID);
    expectSafePetPayload(res.body);
  });

  it('GET /api/v1/pets returns an empty list when the user has no tutor profile', async () => {
    resolvedUser = { ...ACTIVE_USER, profiles: {} };

    const res = await request(app.getHttpServer())
      .get('/api/v1/pets')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual([]);
    expect(supabaseAdminMock.listPets).not.toHaveBeenCalled();
  });

  it('POST /api/v1/pets creates a pet scoped to the tutor profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pets')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Rex', species: 'dog', breed: 'Labrador' })
      .expect(201);

    expect(supabaseAdminMock.createPet).toHaveBeenCalledWith(TUTOR_PROFILE_ID, {
      name: 'Rex',
      species: 'dog',
      size: 'unknown',
      breed: 'Labrador',
      ageRange: null,
      notes: null,
    });
    expect(res.body.name).toBe('Rex');
    expectSafePetPayload(res.body);
  });

  it('POST /api/v1/pets rejects an invalid payload (missing required fields)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pets')
      .set('Authorization', 'Bearer test-token')
      .send({ breed: 'Labrador' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createPet).not.toHaveBeenCalled();
  });

  it('POST /api/v1/pets rejects an invalid species enum value', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pets')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Rex', species: 'dragon' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.createPet).not.toHaveBeenCalled();
  });

  it('POST /api/v1/pets blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pets')
      .set('Authorization', 'Bearer test-token')
      .send({
        name: 'Rex',
        species: 'dog',
        tutorProfileId: 'attacker-profile',
        deletedAt: null,
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.rejectedFields).toEqual(
      expect.arrayContaining(['tutorProfileId', 'deletedAt']),
    );
    expect(supabaseAdminMock.createPet).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/pets/:id updates an owned pet', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/pets/${PET_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Rex Updated' })
      .expect(200);

    expect(supabaseAdminMock.updatePet).toHaveBeenCalledWith(
      TUTOR_PROFILE_ID,
      PET_ID,
      { name: 'Rex Updated' },
    );
    expect(res.body.name).toBe('Rex Updated');
    expectSafePetPayload(res.body);
  });

  it('PATCH /api/v1/pets/:id blocks fields outside the allowlist', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/pets/${PET_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Rex', tutorProfileId: 'attacker-profile' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updatePet).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/pets/:id rejects an empty body', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/pets/${PET_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({})
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.updatePet).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/pets/:id returns 404 for a pet not owned by the tutor', async () => {
    updateResult = null;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/pets/${PET_ID}`)
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Rex Updated' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('DELETE /api/v1/pets/:id soft-deletes an owned pet', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/pets/${PET_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(204);

    expect(supabaseAdminMock.softDeletePet).toHaveBeenCalledWith(
      TUTOR_PROFILE_ID,
      PET_ID,
    );
  });

  it('DELETE /api/v1/pets/:id returns 404 for a pet not owned by the tutor', async () => {
    deleteResult = false;

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/pets/${PET_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('DELETE /api/v1/pets/:id rejects a non-UUID id', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/v1/pets/not-a-uuid')
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(supabaseAdminMock.softDeletePet).not.toHaveBeenCalled();
  });
});

/** Garante que nenhum campo sensível ou interno vaze na resposta de pet. */
function expectSafePetPayload(value: unknown): void {
  const forbidden = new Set([
    'tutorProfileId',
    'tutor_profile_id',
    'deletedAt',
    'deleted_at',
    'token',
    'accessToken',
    'refreshToken',
    'phone',
    'address',
    'location',
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
