-- Non-destructive Block 2 smoke checks.
-- Run only after the migrations are applied to the target database.

select
  extname,
  extversion
from pg_extension
where extname in ('postgis', 'pgcrypto')
order by extname;

select
  typname
from pg_type
where typname in (
  'user_status',
  'profile_type',
  'provider_status',
  'pet_species',
  'pet_size',
  'service_type',
  'location_precision'
)
order by typname;

select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users',
    'user_roles',
    'tutor_profiles',
    'addresses',
    'pets',
    'provider_profiles',
    'provider_services',
    'audit_logs'
  )
order by table_name;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'users',
    'user_roles',
    'tutor_profiles',
    'addresses',
    'pets',
    'provider_profiles',
    'provider_services',
    'audit_logs'
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
  and table_name in (
    'users',
    'user_roles',
    'tutor_profiles',
    'addresses',
    'pets',
    'provider_profiles',
    'provider_services',
    'audit_logs'
  )
order by table_name, privilege_type;

select
  routine_name,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee = 'authenticated'
  and routine_name in ('has_role', 'is_admin')
order by routine_name, privilege_type;

select
  object_name as type_name,
  privilege_type
from information_schema.usage_privileges
where object_schema = 'public'
  and object_type = 'TYPE'
  and grantee = 'authenticated'
  and object_name in (
    'user_status',
    'profile_type',
    'provider_status',
    'pet_species',
    'pet_size',
    'service_type',
    'location_precision'
  )
order by object_name, privilege_type;
