import { createClient } from '@supabase/supabase-js';
import { loadBackendEnv, requireEnv } from './env.mjs';

try {
  loadBackendEnv();
} catch (error) {
  if (error && error.code === 'ENOENT') {
    process.stdout.write(
      `${JSON.stringify(
        {
          connection: 'skipped',
          reason: 'Pet_Marketplace_Back/.env not found',
        },
        null,
        2,
      )}\n`,
    );
    process.exit(0);
  }
  throw error;
}

const supabaseUrl = requireEnv('SUPABASE_URL');
const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const result = {
  connection: 'pending',
  serviceRoleRead: {
    users: 'pending',
    userRoles: 'pending',
    tutorProfiles: 'pending',
    providerProfiles: 'pending',
  },
  optionalAuthToken: 'not_provided',
};

async function expectReadable(tableName, selectColumns) {
  const { error } = await supabase
    .from(tableName)
    .select(selectColumns, { count: 'exact', head: true })
    .limit(1);

  if (error) {
    throw new Error(`${tableName} read failed: ${error.code}`);
  }
}

await expectReadable('users', 'id,status,locale');
result.serviceRoleRead.users = 'ok';

await expectReadable('user_roles', 'user_id,role');
result.serviceRoleRead.userRoles = 'ok';

await expectReadable('tutor_profiles', 'id,user_id,display_name');
result.serviceRoleRead.tutorProfiles = 'ok';

await expectReadable(
  'provider_profiles',
  'id,user_id,display_name,status,rating_average,rating_count',
);
result.serviceRoleRead.providerProfiles = 'ok';

result.connection = 'ok';

const token = process.env.BLOCK2B_AUTH_ACCESS_TOKEN;
if (token) {
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('BLOCK2B_AUTH_ACCESS_TOKEN could not be resolved.');
  }

  const { data: publicUser, error: publicUserError } = await supabase
    .from('users')
    .select('id,status,locale')
    .eq('id', data.user.id)
    .maybeSingle();

  if (publicUserError) {
    throw new Error(`public.users token lookup failed: ${publicUserError.code}`);
  }

  result.optionalAuthToken = publicUser
    ? 'resolved_with_public_user'
    : 'resolved_without_public_user';
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
