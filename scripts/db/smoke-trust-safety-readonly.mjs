import { Client } from 'pg';
import { loadBackendEnv, requireEnv } from './env.mjs';

loadBackendEnv();

const databaseUrl = requireEnv('DATABASE_URL');
const supabaseUrl = process.env.SUPABASE_URL ?? '';

const expectedEnums = {
  report_status: ['open', 'in_review', 'action_taken', 'dismissed', 'closed'],
  report_category: [
    'safety_concern',
    'inappropriate_behaviour',
    'harassment',
    'spam_scam',
    'no_show',
    'other',
  ],
};
const expectedTables = ['reports', 'user_blocks'];
const expectedColumns = {
  reports: [
    'id',
    'reporter_user_id',
    'reported_user_id',
    'target_type',
    'target_id',
    'conversation_id',
    'message_id',
    'category',
    'description',
    'status',
    'assigned_admin_id',
    'internal_note',
    'created_at',
    'updated_at',
  ],
  user_blocks: [
    'id',
    'blocker_user_id',
    'blocked_user_id',
    'conversation_id',
    'reason',
    'created_at',
    'updated_at',
  ],
};
const expectedPolicies = {
  reports: ['reports_owner_or_admin_select'],
  user_blocks: ['user_blocks_participant_or_admin_select'],
};
const expectedIndexes = [
  'reports_reporter_user_id_idx',
  'reports_reported_user_id_idx',
  'reports_conversation_id_idx',
  'reports_status_created_at_idx',
  'user_blocks_blocker_user_id_idx',
  'user_blocks_blocked_user_id_idx',
  'user_blocks_conversation_id_idx',
];

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

const failures = [];

try {
  await client.connect();

  const enums = await client.query(
    `select t.typname, e.enumlabel, e.enumsortorder
     from pg_type t
     join pg_namespace n on n.oid = t.typnamespace
     join pg_enum e on e.enumtypid = t.oid
     where n.nspname = 'public'
       and t.typname = any($1::text[])
     order by t.typname, e.enumsortorder`,
    [Object.keys(expectedEnums)],
  );
  const tables = await client.query(
    `select c.relname, c.relkind, c.relrowsecurity
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = any($1::text[])
     order by c.relname`,
    [expectedTables],
  );
  const columns = await client.query(
    `select table_name, column_name, data_type, udt_name, is_nullable
     from information_schema.columns
     where table_schema = 'public'
       and table_name = any($1::text[])
     order by table_name, ordinal_position`,
    [expectedTables],
  );
  const foreignKeys = await client.query(
    `select c.conname, c.confdeltype, ref.relname as referenced_table
     from pg_constraint c
     join pg_class rel on rel.oid = c.conrelid
     join pg_namespace n on n.oid = rel.relnamespace
     join pg_class ref on ref.oid = c.confrelid
     join pg_attribute att on att.attrelid = c.conrelid
       and att.attnum = any(c.conkey)
     where n.nspname = 'public'
       and rel.relname = 'reports'
       and c.contype = 'f'
       and att.attname = 'message_id'
     order by c.conname`,
  );
  const policies = await client.query(
    `select tablename, policyname, cmd, roles
     from pg_policies
     where schemaname = 'public'
       and tablename = any($1::text[])
     order by tablename, policyname`,
    [expectedTables],
  );
  const typeGrants = await client.query(
    `select r.role_name, t.type_name,
       has_type_privilege(r.role_name, 'public.' || t.type_name, 'USAGE') as granted
     from unnest($1::text[]) as r(role_name),
          unnest($2::text[]) as t(type_name)
     order by r.role_name, t.type_name`,
    [['authenticated', 'service_role'], Object.keys(expectedEnums)],
  );
  const tableGrants = await client.query(
    `select r.role_name, t.table_name, p.privilege,
       has_table_privilege(r.role_name, 'public.' || t.table_name, p.privilege) as granted
     from unnest($1::text[]) as r(role_name),
          unnest($2::text[]) as t(table_name),
          unnest($3::text[]) as p(privilege)
     order by r.role_name, t.table_name, p.privilege`,
    [
      ['authenticated', 'service_role'],
      expectedTables,
      ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    ],
  );
  const indexes = await client.query(
    `select c.relname as index_name, t.relname as table_name
     from pg_index i
     join pg_class c on c.oid = i.indexrelid
     join pg_class t on t.oid = i.indrelid
     join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and c.relname = any($1::text[])
     order by c.relname`,
    [expectedIndexes],
  );

  const enumValues = groupRows(enums.rows, 'typname', 'enumlabel');
  for (const [enumName, expectedValues] of Object.entries(expectedEnums)) {
    expectArrayEquals(
      enumValues[enumName] ?? [],
      expectedValues,
      `enum ${enumName} values`,
    );
  }

  const tableByName = Object.fromEntries(
    tables.rows.map((row) => [row.relname, row]),
  );
  for (const tableName of expectedTables) {
    const table = tableByName[tableName];
    if (!table) {
      failures.push(`missing table ${tableName}`);
      continue;
    }
    if (table.relkind !== 'r') failures.push(`${tableName} is not a table`);
    if (table.relrowsecurity !== true) {
      failures.push(`${tableName} RLS is not enabled`);
    }
  }

  const columnsByTable = groupRows(columns.rows, 'table_name', 'column_name');
  for (const [tableName, expected] of Object.entries(expectedColumns)) {
    expectArrayContains(
      columnsByTable[tableName] ?? [],
      expected,
      `${tableName} columns`,
    );
  }

  const reportMessageFk = foreignKeys.rows[0];
  if (!reportMessageFk) {
    failures.push('missing reports.message_id foreign key');
  } else if (reportMessageFk.confdeltype !== 'r') {
    failures.push(
      `reports.message_id on delete is ${deleteAction(reportMessageFk.confdeltype)}, expected RESTRICT`,
    );
  }

  const policiesByTable = groupRows(policies.rows, 'tablename', 'policyname');
  for (const [tableName, expected] of Object.entries(expectedPolicies)) {
    expectArrayContains(
      policiesByTable[tableName] ?? [],
      expected,
      `${tableName} policies`,
    );
  }

  for (const row of typeGrants.rows) {
    if (!row.granted) {
      failures.push(`${row.role_name} lacks USAGE on type ${row.type_name}`);
    }
  }

  const tableGrantRows = tableGrants.rows;
  for (const tableName of expectedTables) {
    expectTableGrant(tableGrantRows, 'authenticated', tableName, 'SELECT', true);
    for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      expectTableGrant(tableGrantRows, 'service_role', tableName, privilege, true);
    }
  }

  const foundIndexes = indexes.rows.map((row) => row.index_name);
  expectArrayContains(foundIndexes, expectedIndexes, 'trust safety indexes');

  const result = {
    connection: 'ok',
    mode: 'read-only-selects',
    target: {
      supabaseProjectRef: readSupabaseRef(supabaseUrl),
      databaseProjectRef: readDatabaseRef(databaseUrl),
      refsMatch:
        readSupabaseRef(supabaseUrl) !== null &&
        readSupabaseRef(supabaseUrl) === readDatabaseRef(databaseUrl),
    },
    checks: {
      enums: Object.fromEntries(
        Object.keys(expectedEnums).map((name) => [
          name,
          (enumValues[name] ?? []).length > 0 ? 'ok' : 'missing',
        ]),
      ),
      tables: Object.fromEntries(
        expectedTables.map((name) => [name, tableByName[name] ? 'ok' : 'missing']),
      ),
      rls: Object.fromEntries(
        expectedTables.map((name) => [
          name,
          tableByName[name]?.relrowsecurity === true ? 'ok' : 'missing',
        ]),
      ),
      reportsMessageIdOnDelete: reportMessageFk
        ? deleteAction(reportMessageFk.confdeltype)
        : 'missing',
      policies: policiesByTable,
      expectedIndexesFound: foundIndexes,
      typeUsageGrants: summarizeGrantRows(typeGrants.rows, 'type_name'),
      tableGrants: summarizeGrantRows(tableGrantRows, 'table_name', true),
    },
    status: failures.length === 0 ? 'ok' : 'failed',
    failures,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length > 0) process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}

function groupRows(rows, keyField, valueField) {
  const grouped = {};
  for (const row of rows) {
    const key = row[keyField];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row[valueField]);
  }
  return grouped;
}

function expectArrayEquals(actual, expected, label) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    failures.push(
      `${label} mismatch: found [${actual.join(',')}], expected [${expected.join(',')}]`,
    );
  }
}

function expectArrayContains(actual, expected, label) {
  for (const value of expected) {
    if (!actual.includes(value)) failures.push(`${label} missing ${value}`);
  }
}

function expectTableGrant(rows, roleName, tableName, privilege, expected) {
  const grant = rows.find(
    (row) =>
      row.role_name === roleName &&
      row.table_name === tableName &&
      row.privilege === privilege,
  );
  if (!grant || grant.granted !== expected) {
    failures.push(`${roleName} ${privilege} grant on ${tableName} missing`);
  }
}

function summarizeGrantRows(rows, objectField, tableMode = false) {
  const summary = {};
  for (const row of rows) {
    const objectName = row[objectField];
    if (!summary[objectName]) summary[objectName] = {};
    if (!summary[objectName][row.role_name]) {
      summary[objectName][row.role_name] = [];
    }
    if (row.granted) {
      summary[objectName][row.role_name].push(
        tableMode ? row.privilege : 'USAGE',
      );
    }
  }
  return summary;
}

function deleteAction(code) {
  return (
    {
      a: 'NO ACTION',
      r: 'RESTRICT',
      c: 'CASCADE',
      n: 'SET NULL',
      d: 'SET DEFAULT',
    }[code] ?? `UNKNOWN:${code}`
  );
}

function readSupabaseRef(value) {
  const match = value.match(/^https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function readDatabaseRef(value) {
  const match = value.match(/db\.([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}
