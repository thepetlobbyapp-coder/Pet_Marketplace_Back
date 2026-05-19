import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');

for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const index = line.indexOf('=');
  if (index === -1) continue;

  const key = line.slice(0, index).trim();
  const value = line.slice(index + 1).trim();
  if (key && process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'BLOCK2B_TEST_EMAIL',
  'BLOCK2B_TEST_PASSWORD',
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`${name} is required.`);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: process.env.BLOCK2B_TEST_EMAIL,
  password: process.env.BLOCK2B_TEST_PASSWORD,
});

if (error || !data.session?.access_token) {
  throw new Error(`Sign in failed: ${error?.message ?? 'missing session'}`);
}

const tokenLine = `BLOCK2B_AUTH_ACCESS_TOKEN=${data.session.access_token}`;
const nextEnv = envContent.match(/^BLOCK2B_AUTH_ACCESS_TOKEN=/m)
  ? envContent.replace(/^BLOCK2B_AUTH_ACCESS_TOKEN=.*$/m, tokenLine)
  : `${envContent.trimEnd()}\n${tokenLine}\n`;

writeFileSync(envPath, nextEnv);

process.stdout.write(
  `${JSON.stringify(
    {
      status: 'ok',
      tokenWrittenToEnv: true,
      userIdPrefix: `${data.user.id.slice(0, 8)}...`,
      emailMasked: data.user.email?.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
    },
    null,
    2,
  )}\n`,
);
