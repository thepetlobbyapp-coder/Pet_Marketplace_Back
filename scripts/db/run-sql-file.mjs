import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { loadBackendEnv, requireEnv } from './env.mjs';

loadBackendEnv();

const [, , fileArg] = process.argv;

if (!fileArg) {
  throw new Error('Usage: node scripts/db/run-sql-file.mjs <sql-file>');
}

if (process.env.ALLOW_DB_WRITE !== 'APLICAR_MIGRATION_CONFIRMADO') {
  throw new Error(
    'Refusing to run SQL. Set ALLOW_DB_WRITE=APLICAR_MIGRATION_CONFIRMADO after explicit user approval.',
  );
}

const sqlPath = resolve(process.cwd(), fileArg);
const sql = readFileSync(sqlPath, 'utf8');
const databaseUrl = requireEnv('DATABASE_URL');

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(JSON.stringify({ status: 'ok', file: fileArg }, null, 2));
} finally {
  await client.end().catch(() => undefined);
}
