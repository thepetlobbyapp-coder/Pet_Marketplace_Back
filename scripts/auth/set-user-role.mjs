import { createClient } from '@supabase/supabase-js';
import { loadBackendEnv, requireEnv } from '../db/env.mjs';

loadBackendEnv();

const VALID_ROLES = new Set(['tutor', 'provider', 'admin']);
const REQUIRED_CONFIRMATION = 'CONFIRMO_ROLE_DEV';
const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const targetEmail = normalizeEmail(requireEnv('TARGET_USER_EMAIL'));
const targetRole = requireEnv('TARGET_ROLE');

if (process.env.ALLOW_ROLE_WRITE !== REQUIRED_CONFIRMATION) {
  throw new Error(
    `ALLOW_ROLE_WRITE=${REQUIRED_CONFIRMATION} is required for role writes.`,
  );
}

if (!VALID_ROLES.has(targetRole)) {
  throw new Error('TARGET_ROLE must be one of: tutor, provider, admin.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const authUser = await findAuthUserByEmail(targetEmail);
const publicUser = await ensurePublicUser(authUser);
const before = await readRoles(authUser.id);
const roleAlreadyExisted = before.includes(targetRole);

if (!roleAlreadyExisted) {
  const { error } = await supabase
    .from('user_roles')
    .upsert(
      {
        user_id: authUser.id,
        role: targetRole,
      },
      { onConflict: 'user_id,role' },
    )
    .select('role')
    .single();

  if (error) {
    throw new Error(`public.user_roles upsert failed: ${error.code}`);
  }
}

const after = await readRoles(authUser.id);

process.stdout.write(
  `${JSON.stringify(
    {
      status: 'ok',
      emailMasked: maskEmail(authUser.email),
      userIdPrefix: maskId(authUser.id),
      publicUserStatus: publicUser.status,
      roleApplied: targetRole,
      roleAlreadyExisted,
      roleCreated: !roleAlreadyExisted,
      roles: after,
    },
    null,
    2,
  )}\n`,
);

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    const user = data.users.find(
      (candidate) => normalizeEmail(candidate.email ?? '') === email,
    );
    if (user) return user;

    if (data.users.length < perPage) break;
    page += 1;
  }

  throw new Error('TARGET_USER_EMAIL was not found in Supabase Auth.');
}

async function ensurePublicUser(authUser) {
  if (!authUser.email) {
    throw new Error('Target auth user has no email.');
  }

  const { data: existing, error: readError } = await supabase
    .from('users')
    .select('id,status,deleted_at')
    .eq('id', authUser.id)
    .maybeSingle();

  if (readError) {
    throw new Error(`public.users read failed: ${readError.code}`);
  }

  if (existing) {
    if (existing.deleted_at || existing.status !== 'active') {
      throw new Error(
        'Target public user is not active; refusing to add roles.',
      );
    }
    return existing;
  }

  const locale =
    readString(authUser.user_metadata?.locale) ??
    readString(authUser.app_metadata?.locale) ??
    process.env.APP_DEFAULT_LOCALE ??
    'en-GB';

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      locale,
    })
    .select('id,status,deleted_at')
    .single();

  if (insertError || !inserted) {
    throw new Error(`public.users insert failed: ${insertError?.code}`);
  }

  return inserted;
}

async function readRoles(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .order('role', { ascending: true });

  if (error) {
    throw new Error(`public.user_roles read failed: ${error.code}`);
  }

  return (data ?? [])
    .map((row) => row.role)
    .filter((role) => VALID_ROLES.has(role));
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function readString(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function maskId(value) {
  return `${value.slice(0, 8)}...`;
}

function maskEmail(value) {
  return value?.replace(/^(.{2}).*(@.*)$/, '$1***$2') ?? null;
}
