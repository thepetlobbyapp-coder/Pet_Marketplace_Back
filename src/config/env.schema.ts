import { z } from 'zod';

const emptyToUndefined = (value: unknown): unknown =>
  value === '' ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional(),
);

/**
 * Boot-time environment validation (D-009).
 * Empty optional values from .env.example are treated as absent.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  APP_DEFAULT_LOCALE: z.string().default('en-GB'),

  CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Supabase keys are optional in Block 1. Missing values keep Auth/DB degraded.
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  DATABASE_URL: optionalString,

  GEOCODING_API_KEY: optionalString,

  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
