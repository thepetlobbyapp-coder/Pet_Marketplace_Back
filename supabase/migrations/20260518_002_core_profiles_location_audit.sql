-- Block 2: core profiles, safe location storage, audit base, and initial RLS.
-- Out of scope here: bookings, chat, reviews, reports, payments, documents, DBS checks.

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'user_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.user_status as enum ('active', 'blocked', 'deleted');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'profile_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.profile_type as enum ('tutor', 'provider', 'admin');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'provider_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.provider_status as enum ('active', 'paused', 'blocked', 'deleted');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'pet_species'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.pet_species as enum ('dog', 'cat', 'other');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'pet_size'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.pet_size as enum ('small', 'medium', 'large', 'giant', 'unknown');
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'service_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.service_type as enum (
      'dog_walking',
      'pet_sitting_at_owner_home',
      'quick_visit',
      'feeding',
      'companionship'
    );
  end if;

  if not exists (
    select 1 from pg_type
    where typname = 'location_precision'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.location_precision as enum ('exact', 'postcode', 'approximate');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text,
  status public.user_status not null default 'active',
  locale text not null default 'en-GB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.profile_type not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.tutor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  default_address_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text,
  country_code char(2) not null default 'GB',
  line1 text,
  city text,
  postcode text,
  formatted_address text,
  location geography(point, 4326) not null,
  location_precision public.location_precision not null default 'approximate',
  public_area_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (country_code = upper(country_code)),
  check (char_length(country_code) = 2)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tutor_profiles_default_address_fk'
      and conrelid = 'public.tutor_profiles'::regclass
  ) then
    alter table public.tutor_profiles
      add constraint tutor_profiles_default_address_fk
      foreign key (default_address_id) references public.addresses(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles(id) on delete cascade,
  name text not null,
  species public.pet_species not null,
  breed text,
  size public.pet_size not null default 'unknown',
  age_range text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  bio text,
  base_address_id uuid references public.addresses(id) on delete set null,
  service_radius_km numeric(5,2) not null default 5,
  status public.provider_status not null default 'active',
  rating_average numeric(3,2),
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (service_radius_km > 0 and service_radius_km <= 50),
  check (rating_average is null or rating_average between 0 and 5),
  check (rating_count >= 0)
);

create table if not exists public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_type public.service_type not null,
  description text,
  price_amount numeric(10,2),
  currency char(3) not null default 'GBP',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_profile_id, service_type),
  check (currency = upper(currency)),
  check (char_length(currency) = 3),
  check (price_amount is null or price_amount >= 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_status_idx on public.users(status);
create index if not exists users_deleted_at_idx on public.users(deleted_at);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);
create index if not exists user_roles_role_idx on public.user_roles(role);
create index if not exists tutor_profiles_user_id_idx on public.tutor_profiles(user_id);
create index if not exists addresses_user_id_idx on public.addresses(user_id);
create index if not exists addresses_location_gix on public.addresses using gist (location);
create index if not exists pets_tutor_profile_id_idx on public.pets(tutor_profile_id);
create index if not exists pets_deleted_at_idx on public.pets(deleted_at);
create index if not exists provider_profiles_user_id_idx on public.provider_profiles(user_id);
create index if not exists provider_profiles_status_idx on public.provider_profiles(status);
create index if not exists provider_profiles_base_address_id_idx on public.provider_profiles(base_address_id);
create index if not exists provider_services_provider_profile_id_idx on public.provider_services(provider_profile_id);
create index if not exists provider_services_service_type_idx on public.provider_services(service_type);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at);

comment on column public.addresses.line1 is
  'Sensitive address line. Never expose to other users.';
comment on column public.addresses.formatted_address is
  'Sensitive full address. Never expose to other users.';
comment on column public.addresses.location is
  'Sensitive PostGIS point. API responses must expose only approximate distance/area.';
comment on column public.addresses.public_area_label is
  'Safe coarse label for user-facing area display.';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'tutor_profiles',
    'addresses',
    'pets',
    'provider_profiles',
    'provider_services'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end $$;

create or replace function public.has_role(required_role public.profile_type, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = target_user_id
      and ur.role = required_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.profile_type, auth.uid());
$$;

revoke all on function public.has_role(public.profile_type, uuid) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.has_role(public.profile_type, uuid) to service_role;
grant execute on function public.is_admin() to authenticated, service_role;

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.tutor_profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.pets enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_services enable row level security;
alter table public.audit_logs enable row level security;

grant usage on schema public to authenticated, service_role;
grant usage on type public.user_status to authenticated, service_role;
grant usage on type public.profile_type to authenticated, service_role;
grant usage on type public.provider_status to authenticated, service_role;
grant usage on type public.pet_species to authenticated, service_role;
grant usage on type public.pet_size to authenticated, service_role;
grant usage on type public.service_type to authenticated, service_role;
grant usage on type public.location_precision to authenticated, service_role;

revoke all on public.users from anon, authenticated;
revoke all on public.user_roles from anon, authenticated;
revoke all on public.tutor_profiles from anon, authenticated;
revoke all on public.addresses from anon, authenticated;
revoke all on public.pets from anon, authenticated;
revoke all on public.provider_profiles from anon, authenticated;
revoke all on public.provider_services from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

grant select on public.users to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.tutor_profiles to authenticated;
grant select on public.addresses to authenticated;
grant select on public.pets to authenticated;
grant select on public.provider_profiles to authenticated;
grant select on public.provider_services to authenticated;
grant select on public.audit_logs to authenticated;

grant select, insert, update, delete on public.users to service_role;
grant select, insert, update, delete on public.user_roles to service_role;
grant select, insert, update, delete on public.tutor_profiles to service_role;
grant select, insert, update, delete on public.addresses to service_role;
grant select, insert, update, delete on public.pets to service_role;
grant select, insert, update, delete on public.provider_profiles to service_role;
grant select, insert, update, delete on public.provider_services to service_role;
grant select, insert, update, delete on public.audit_logs to service_role;

drop policy if exists users_select_own_or_admin on public.users;
drop policy if exists user_roles_select_own_or_admin on public.user_roles;
drop policy if exists tutor_profiles_owner_or_admin_select on public.tutor_profiles;
drop policy if exists addresses_owner_or_admin_select on public.addresses;
drop policy if exists pets_owner_or_admin_select on public.pets;
drop policy if exists provider_profiles_owner_or_admin_select on public.provider_profiles;
drop policy if exists provider_services_owner_or_admin_select on public.provider_services;
drop policy if exists audit_logs_admin_select on public.audit_logs;

drop policy if exists users_insert_own on public.users;
drop policy if exists users_update_own_or_admin on public.users;
drop policy if exists tutor_profiles_owner_or_admin_insert on public.tutor_profiles;
drop policy if exists tutor_profiles_owner_or_admin_update on public.tutor_profiles;
drop policy if exists tutor_profiles_owner_or_admin_delete on public.tutor_profiles;
drop policy if exists addresses_owner_or_admin_insert on public.addresses;
drop policy if exists addresses_owner_or_admin_update on public.addresses;
drop policy if exists addresses_owner_or_admin_delete on public.addresses;
drop policy if exists pets_owner_or_admin_insert on public.pets;
drop policy if exists pets_owner_or_admin_update on public.pets;
drop policy if exists pets_owner_or_admin_delete on public.pets;
drop policy if exists provider_profiles_owner_or_admin_insert on public.provider_profiles;
drop policy if exists provider_profiles_owner_or_admin_update on public.provider_profiles;
drop policy if exists provider_profiles_owner_or_admin_delete on public.provider_profiles;
drop policy if exists provider_services_owner_or_admin_insert on public.provider_services;
drop policy if exists provider_services_owner_or_admin_update on public.provider_services;
drop policy if exists provider_services_owner_or_admin_delete on public.provider_services;

create policy users_select_own_or_admin on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy user_roles_select_own_or_admin on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy tutor_profiles_owner_or_admin_select on public.tutor_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy addresses_owner_or_admin_select on public.addresses
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy pets_owner_or_admin_select on public.pets
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tutor_profiles tp
      where tp.id = pets.tutor_profile_id
        and tp.user_id = auth.uid()
    )
  );

create policy provider_profiles_owner_or_admin_select on public.provider_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy provider_services_owner_or_admin_select on public.provider_services
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.provider_profiles pp
      where pp.id = provider_services.provider_profile_id
        and pp.user_id = auth.uid()
    )
  );

create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated
  using (public.is_admin());
