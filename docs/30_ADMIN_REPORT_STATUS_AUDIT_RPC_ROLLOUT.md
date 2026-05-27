# Admin Report Status Audit RPC Rollout

## Scope

Migration `20260527_016_admin_report_status_audit_rpc.sql` versions the
`public.admin_update_report_status_with_audit` RPC used by
`PATCH /api/v1/admin/reports/:id`.

The RPC updates the report status and inserts the redacted audit row in the
same database transaction.

## Dev Status

The migration was already applied to the Supabase dev project before this
backport cycle. This repo change only versions the migration and wires the
backend to the already validated dev database function.

Do not reapply the migration in dev unless a fresh database reset requires it.

## Pre-Deploy Checks

- Confirm the function exists in the target database.
- Confirm the function is `security definer` with `search_path = public`.
- Confirm `EXECUTE` is granted to `service_role`.
- Confirm `EXECUTE` is not granted to `anon` or `authenticated`.
- Run the backend DB smokes without printing environment values.

## Rollback

If the backend must roll back before deploy, revert the backend code and keep
the already-applied migration in place. If the database function itself must be
removed in a disposable environment, use the rollback note in the migration.
