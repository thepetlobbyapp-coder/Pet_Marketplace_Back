import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('providers radius marketplace policy (e2e)', () => {
  it('keeps a provider in the marketplace when tutor and provider share a postcode centroid', () => {
    const rows = listProvidersNear({
      tutorUserId: 'tutor-user',
      tutorLocation: westminster,
      providers: [
        activeProvider({
          id: 'same-postcode-provider',
          baseLocation: westminster,
          serviceRadiusKm: 1,
        }),
      ],
    });

    expect(rows).toEqual([
      {
        distanceMeters: 0,
        id: 'same-postcode-provider',
      },
    ]);
  });

  it('hides a provider outside their own service radius', () => {
    const rows = listProvidersNear({
      tutorUserId: 'tutor-user',
      tutorLocation: westminster,
      providers: [
        activeProvider({
          id: 'outside-radius-provider',
          baseLocation: greenwich,
          serviceRadiusKm: 5,
        }),
      ],
    });

    expect(rows).toEqual([]);
  });

  it('hides an active provider without a geocoded base address', () => {
    const rows = listProvidersNear({
      tutorUserId: 'tutor-user',
      tutorLocation: westminster,
      providers: [
        activeProvider({
          id: 'legacy-orphan-provider',
          baseLocation: null,
          serviceRadiusKm: 50,
        }),
      ],
    });

    expect(rows).toEqual([]);
  });

  it('documents the SQL guardrails for legacy active providers', () => {
    const repairSql = readFileSync(
      join(
        __dirname,
        '../supabase/migrations/20260529_004_backfill_provider_base_addresses.sql',
      ),
      'utf8',
    );
    const radiusSql = readFileSync(
      join(
        __dirname,
        '../supabase/migrations/20260528_003_providers_radius_filter.sql',
      ),
      'utf8',
    );

    expect(radiusSql).toContain('st_dwithin(tl.loc, ba.location');
    expect(radiusSql).not.toMatch(
      /create\s+or\s+replace\s+function\s+public\.providers_get_one/i,
    );
    expect(repairSql).toContain('current_base.user_id = pp.user_id');
    expect(repairSql).toContain("status = 'paused'");
  });
});

interface Point {
  lat: number;
  lng: number;
}

interface ProviderFixture {
  baseLocation: Point | null;
  deletedAt: string | null;
  id: string;
  ownerUserId: string;
  serviceRadiusKm: number;
  status: 'active' | 'paused';
}

interface ProviderResult {
  distanceMeters: number;
  id: string;
}

const westminster: Point = { lat: 51.501, lng: -0.1416 };
const greenwich: Point = { lat: 51.4826, lng: -0.0077 };

function activeProvider(
  overrides: Partial<ProviderFixture>,
): ProviderFixture {
  return {
    baseLocation: westminster,
    deletedAt: null,
    id: 'provider',
    ownerUserId: 'provider-user',
    serviceRadiusKm: 5,
    status: 'active',
    ...overrides,
  };
}

function listProvidersNear(input: {
  providers: ProviderFixture[];
  tutorLocation: Point | null;
  tutorUserId: string;
}): ProviderResult[] {
  if (!input.tutorLocation) return [];

  return input.providers
    .filter((provider) => provider.deletedAt === null)
    .filter((provider) => provider.status === 'active')
    .filter((provider) => provider.ownerUserId !== input.tutorUserId)
    .filter((provider) => provider.baseLocation !== null)
    .map((provider) => ({
      distanceMeters: roundToTens(
        distanceMeters(input.tutorLocation!, provider.baseLocation!),
      ),
      id: provider.id,
      serviceRadiusMeters: provider.serviceRadiusKm * 1000,
    }))
    .filter((provider) => provider.distanceMeters <= provider.serviceRadiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .map(({ distanceMeters, id }) => ({ distanceMeters, id }));
}

function roundToTens(value: number): number {
  return Math.round(value / 10) * 10;
}

function distanceMeters(a: Point, b: Point): number {
  const earthRadiusMeters = 6_371_000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
