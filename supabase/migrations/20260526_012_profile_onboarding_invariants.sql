-- Backend-owned profile onboarding invariants.
--
-- These functions create role + profile in a single transaction. Clients call
-- the Nest API; they never write roles or profiles directly.
--
-- New provider profiles start as `paused` and no row is inserted into
-- `public.providers`, so self-onboarding does not publish a marketplace
-- listing.
--
-- Rollback:
--   drop function if exists public.ensure_provider_profile(uuid, text);
--   drop function if exists public.ensure_tutor_profile(uuid, text);

create or replace function public.ensure_tutor_profile(
  p_user_id uuid,
  p_display_name text
)
returns table (
  id uuid,
  display_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if nullif(btrim(coalesce(p_display_name, '')), '') is null then
    raise exception 'p_display_name is required';
  end if;

  perform 1
  from public.users u
  where u.id = p_user_id
    and u.status = 'active'
    and u.deleted_at is null
  for update;

  if not found then
    return;
  end if;

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'tutor'::public.profile_type)
  on conflict (user_id, role) do nothing;

  return query
    with upserted as (
      insert into public.tutor_profiles (user_id, display_name)
      values (p_user_id, btrim(p_display_name))
      on conflict (user_id) do update
        set display_name = excluded.display_name,
            updated_at = now()
      returning
        public.tutor_profiles.id,
        public.tutor_profiles.display_name,
        public.tutor_profiles.created_at,
        public.tutor_profiles.updated_at
    )
    select
      upserted.id,
      upserted.display_name,
      upserted.created_at,
      upserted.updated_at
    from upserted;
end;
$$;

create or replace function public.ensure_provider_profile(
  p_user_id uuid,
  p_display_name text
)
returns table (
  id uuid,
  display_name text,
  status public.provider_status,
  service_radius_km numeric,
  rating_average numeric,
  rating_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_had_provider_role boolean;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if nullif(btrim(coalesce(p_display_name, '')), '') is null then
    raise exception 'p_display_name is required';
  end if;

  perform 1
  from public.users u
  where u.id = p_user_id
    and u.status = 'active'
    and u.deleted_at is null
  for update;

  if not found then
    return;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role = 'provider'::public.profile_type
  )
  into v_had_provider_role;

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'provider'::public.profile_type)
  on conflict (user_id, role) do nothing;

  return query
    with upserted as (
      insert into public.provider_profiles (
        user_id,
        display_name,
        status
      )
      values (
        p_user_id,
        btrim(p_display_name),
        'paused'::public.provider_status
      )
      on conflict (user_id) do update
        set display_name = excluded.display_name,
            status = case
              when v_had_provider_role
              then public.provider_profiles.status
              else 'paused'::public.provider_status
            end,
            updated_at = now()
      returning
        public.provider_profiles.id,
        public.provider_profiles.display_name,
        public.provider_profiles.status,
        public.provider_profiles.service_radius_km,
        public.provider_profiles.rating_average,
        public.provider_profiles.rating_count,
        public.provider_profiles.created_at,
        public.provider_profiles.updated_at
    )
    select
      upserted.id,
      upserted.display_name,
      upserted.status,
      upserted.service_radius_km,
      upserted.rating_average,
      upserted.rating_count,
      upserted.created_at,
      upserted.updated_at
    from upserted;
end;
$$;

revoke all on function public.ensure_tutor_profile(uuid, text)
  from public, anon, authenticated;
revoke all on function public.ensure_provider_profile(uuid, text)
  from public, anon, authenticated;
grant execute on function public.ensure_tutor_profile(uuid, text)
  to service_role;
grant execute on function public.ensure_provider_profile(uuid, text)
  to service_role;

comment on function public.ensure_tutor_profile(uuid, text) is
  'Backend-owned tutor role/profile onboarding. Creates role tutor and tutor_profile atomically.';
comment on function public.ensure_provider_profile(uuid, text) is
  'Backend-owned provider role/profile onboarding. Creates role provider and paused provider_profile atomically; does not publish a providers listing.';
