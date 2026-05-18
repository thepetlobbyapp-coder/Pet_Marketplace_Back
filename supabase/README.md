# Supabase migrations

Block 2 prepares the database foundation for Supabase PostgreSQL + PostGIS.

## Current status

Do **not** run these SQL files yet.

They are prepared for review only. They should be applied only after:

1. `DATABASE_URL` is configured for the intended database.
2. `SUPABASE_SERVICE_ROLE_KEY` is available only in the backend/local secure env.
3. The target environment is named explicitly.
4. The user confirms with a clear instruction such as:

```txt
APLICAR MIGRATIONS NO SUPABASE <environment>
```

Preparing SQL is not permission to apply SQL.

Before applying, state the target Supabase project/ref, the environment, the exact
files, the expected impact, and the rollback/backup decision.

Expected local environment values:

```txt
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

Apply only after explicit approval:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260518_001_enable_extensions.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260518_002_core_profiles_location_audit.sql
```

Non-destructive smoke check:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/smoke/20260518_001_block2_readiness.sql
```
