import { createClient } from '@supabase/supabase-js';
import { loadBackendEnv, requireEnv } from '../db/env.mjs';

loadBackendEnv();

const VALID_ROLES = new Set(['tutor', 'provider', 'admin']);
const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const targetEmail = normalizeEmail(requireEnv('TARGET_USER_EMAIL'));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const authUser = await findAuthUserByEmail(targetEmail);
const publicState = await readPublicState(authUser.id);

process.stdout.write(
  `${JSON.stringify(
    {
      status: 'ok',
      emailMasked: maskEmail(authUser.email),
      userIdPrefix: maskId(authUser.id),
      publicUserExists: publicState.publicUserExists,
      publicUserStatus: publicState.publicUserStatus,
      roles: publicState.roles,
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

async function readPublicState(userId) {
  const { data: publicUser, error: publicUserError } = await supabase
    .from('users')
    .select('id,status')
    .eq('id', userId)
    .maybeSingle();

  if (publicUserError) {
    throw new Error(`public.users read failed: ${publicUserError.code}`);
  }

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .order('role', { ascending: true });

  if (rolesError) {
    throw new Error(`public.user_roles read failed: ${rolesError.code}`);
  }

  return {
    publicUserExists: Boolean(publicUser),
    publicUserStatus: publicUser?.status ?? null,
    roles: (roles ?? [])
      .map((row) => row.role)
      .filter((role) => VALID_ROLES.has(role)),
  };
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function maskId(value) {
  return `${value.slice(0, 8)}...`;
}

function maskEmail(value) {
  return value?.replace(/^(.{2}).*(@.*)$/, '$1***$2') ?? null;
}
