import { Client } from 'pg';
import { loadBackendEnv, requireEnv } from './env.mjs';

loadBackendEnv();

const databaseUrl = requireEnv('DATABASE_URL');

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

const expectedTables = [
  'users',
  'user_roles',
  'tutor_profiles',
  'addresses',
  'pets',
  'provider_profiles',
  'provider_services',
  'audit_logs',
];

try {
  await client.connect();

  const extensions = await client.query(
    `select extname, extversion
     from pg_extension
     where extname in ('postgis', 'pgcrypto')
     order by extname`,
  );

  const tables = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name = any($1::text[])
     order by table_name`,
    [expectedTables],
  );

  const rls = await client.query(
    `select c.relname as table_name, c.relrowsecurity as rls_enabled
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = any($1::text[])
     order by c.relname`,
    [expectedTables],
  );

  const authenticatedWrites = await client.query(
    `select table_name, privilege_type
     from information_schema.role_table_grants
     where table_schema = 'public'
       and grantee = 'authenticated'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
       and table_name = any($1::text[])
     order by table_name, privilege_type`,
    [expectedTables],
  );

  console.log(
    JSON.stringify(
      {
        connection: 'ok',
        extensions: extensions.rows,
        expectedTablesFound: tables.rows.map((row) => row.table_name),
        rls: rls.rows,
        authenticatedWriteGrants: authenticatedWrites.rows,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end().catch(() => undefined);
}
