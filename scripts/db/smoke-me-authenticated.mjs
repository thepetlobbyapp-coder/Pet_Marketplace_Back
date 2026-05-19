import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { loadBackendEnv, requireEnv } from './env.mjs';

const PORT = '3317';
const BASE_URL = `http://127.0.0.1:${PORT}`;

loadBackendEnv();

const supabaseUrl = requireEnv('SUPABASE_URL');
const anonKey = requireEnv('SUPABASE_ANON_KEY');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const token = requireEnv('BLOCK2B_AUTH_ACCESS_TOKEN');

const entrypoint = existsSync('dist/main.js')
  ? 'dist/main.js'
  : 'dist/src/main.js';
if (!existsSync(entrypoint)) {
  throw new Error('Built main.js not found. Run pnpm build before this smoke.');
}

const authClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: authData, error: authError } =
  await authClient.auth.getUser(token);
if (authError || !authData.user) {
  throw new Error(
    'BLOCK2B_AUTH_ACCESS_TOKEN is missing, invalid, or expired; generate a fresh test token.',
  );
}

const authUserId = authData.user.id;
const before = await readPublicState(authUserId);
const server = spawn('node', [entrypoint], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    API_PORT: PORT,
    API_BASE_URL: BASE_URL,
    SWAGGER_ENABLED: 'false',
  },
  stdio: 'ignore',
});

try {
  await waitForHealth();

  const response = await fetch(`${BASE_URL}/api/v1/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null);
  const after = await readPublicState(authUserId);

  if (!response.ok) {
    throw new Error(
      `GET /api/v1/me failed with ${response.status}: ${readErrorCode(body)}`,
    );
  }

  const me = assertRecord(body);
  const profiles = assertRecord(me.profiles ?? {});
  const result = {
    status: 'ok',
    httpStatus: response.status,
    userIdPrefix: maskId(readString(me.id)),
    emailMasked: maskEmail(readString(me.email)),
    userStatus: readString(me.status),
    locale: readString(me.locale),
    roles: readStringArray(me.roles),
    hasTutorProfile: Boolean(profiles.tutor),
    hasProviderProfile: Boolean(profiles.provider),
    syncCreatedPublicUser: !before.publicUserExists && after.publicUserExists,
    fallbackRoleCreated:
      before.roles.length === 0 && after.roles.includes('tutor'),
    createdNewDataThisRun:
      !before.publicUserExists ||
      (before.roles.length === 0 && after.roles.includes('tutor')),
    publicStateAfter: {
      publicUserExists: after.publicUserExists,
      publicUserStatus: after.publicUserStatus,
      roles: after.roles,
    },
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  server.kill();
}

async function waitForHealth() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Backend exited early with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(`${BASE_URL}/api/v1/health`);
      if (response.ok) return;
    } catch {
      await sleep(500);
    }
  }

  throw new Error('Timed out waiting for local backend health check.');
}

async function readPublicState(userId) {
  const { data: publicUser, error: publicUserError } = await adminClient
    .from('users')
    .select('id,status')
    .eq('id', userId)
    .maybeSingle();

  if (publicUserError) {
    throw new Error(`public.users read failed: ${publicUserError.code}`);
  }

  const { data: roles, error: rolesError } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (rolesError) {
    throw new Error(`public.user_roles read failed: ${rolesError.code}`);
  }

  return {
    publicUserExists: Boolean(publicUser),
    publicUserStatus: publicUser?.status ?? null,
    roles: (roles ?? []).map((row) => row.role),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected response body to be an object.');
  }
  return value;
}

function readString(value) {
  return typeof value === 'string' ? value : null;
}

function readStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string')
    : [];
}

function maskId(value) {
  return value ? `${value.slice(0, 8)}...` : null;
}

function maskEmail(value) {
  return value?.replace(/^(.{2}).*(@.*)$/, '$1***$2') ?? null;
}

function readErrorCode(value) {
  const body = assertRecord(value ?? {});
  const error = assertRecord(body.error ?? {});
  return readString(error.code) ?? 'UNKNOWN_ERROR';
}
