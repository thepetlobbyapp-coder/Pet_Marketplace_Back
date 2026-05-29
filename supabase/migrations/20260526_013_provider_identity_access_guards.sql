-- Harden profile identity checks for direct Supabase access.
--
-- The Nest API only exposes tutor/provider profiles when the matching role
-- exists. It also requires a public provider listing to have:
-- - a non-deleted public.providers row;
-- - an active provider_profile;
-- - a provider role;
-- - an active, non-deleted owning user.
--
-- This migration aligns direct authenticated SELECT policies and marketplace
-- RPCs with the same invariant so stale tutor/provider profiles cannot keep
-- pet, booking, chat or listing visibility after a role is removed.
--
-- Rollback:
--   Re-apply the policy bodies from migrations 20260518_002, 20260522_004,
--   20260522_005 and the provider RPC/policy bodies from 20260526_011.

drop policy if exists tutor_profiles_owner_or_admin_select
  on public.tutor_profiles;
create policy tutor_profiles_owner_or_admin_select on public.tutor_profiles
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.user_roles ur
      join public.users u
        on u.id = ur.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where ur.user_id = tutor_profiles.user_id
        and ur.user_id = auth.uid()
        and ur.role = 'tutor'::public.profile_type
    )
  );

drop policy if exists provider_profiles_owner_or_admin_select
  on public.provider_profiles;
create policy provider_profiles_owner_or_admin_select
  on public.provider_profiles
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.user_roles ur
      join public.users u
        on u.id = ur.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where ur.user_id = provider_profiles.user_id
        and ur.user_id = auth.uid()
        and ur.role = 'provider'::public.profile_type
    )
  );

drop policy if exists pets_owner_or_admin_select on public.pets;
create policy pets_owner_or_admin_select on public.pets
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.tutor_profiles tp
      join public.user_roles ur
        on ur.user_id = tp.user_id
       and ur.role = 'tutor'::public.profile_type
      join public.users u
        on u.id = tp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where tp.id = pets.tutor_profile_id
        and tp.user_id = auth.uid()
    )
  );

drop policy if exists provider_services_owner_or_admin_select
  on public.provider_services;
create policy provider_services_owner_or_admin_select
  on public.provider_services
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.provider_profiles pp
      join public.user_roles ur
        on ur.user_id = pp.user_id
       and ur.role = 'provider'::public.profile_type
      join public.users u
        on u.id = pp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where pp.id = provider_services.provider_profile_id
        and pp.user_id = auth.uid()
    )
  );

drop policy if exists providers_owner_or_admin_select on public.providers;
create policy providers_owner_or_admin_select on public.providers
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.provider_profiles pp
      join public.user_roles ur
        on ur.user_id = pp.user_id
       and ur.role = 'provider'::public.profile_type
      join public.users u
        on u.id = pp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where pp.id = providers.provider_profile_id
        and pp.user_id = auth.uid()
        and pp.status = 'active'::public.provider_status
        and providers.deleted_at is null
    )
  );

drop policy if exists bookings_participant_or_admin_select on public.bookings;
create policy bookings_participant_or_admin_select on public.bookings
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.tutor_profiles tp
      join public.user_roles ur
        on ur.user_id = tp.user_id
       and ur.role = 'tutor'::public.profile_type
      join public.users u
        on u.id = tp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where tp.id = bookings.tutor_profile_id
        and tp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.providers pr
      join public.provider_profiles pp on pp.id = pr.provider_profile_id
      join public.user_roles ur
        on ur.user_id = pp.user_id
       and ur.role = 'provider'::public.profile_type
      join public.users u
        on u.id = pp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where pr.id = bookings.provider_id
        and pr.deleted_at is null
        and pp.user_id = auth.uid()
        and pp.status = 'active'::public.provider_status
    )
  );

drop policy if exists conversations_participant_or_admin_select
  on public.conversations;
create policy conversations_participant_or_admin_select
  on public.conversations
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.tutor_profiles tp
      join public.user_roles ur
        on ur.user_id = tp.user_id
       and ur.role = 'tutor'::public.profile_type
      join public.users u
        on u.id = tp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where tp.id = conversations.tutor_profile_id
        and tp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.providers pr
      join public.provider_profiles pp on pp.id = pr.provider_profile_id
      join public.user_roles ur
        on ur.user_id = pp.user_id
       and ur.role = 'provider'::public.profile_type
      join public.users u
        on u.id = pp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where pr.id = conversations.provider_id
        and pr.deleted_at is null
        and pp.user_id = auth.uid()
        and pp.status = 'active'::public.provider_status
    )
  );

drop policy if exists messages_participant_or_admin_select on public.messages;
create policy messages_participant_or_admin_select on public.messages
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.conversations c
      join public.tutor_profiles tp on tp.id = c.tutor_profile_id
      join public.user_roles ur
        on ur.user_id = tp.user_id
       and ur.role = 'tutor'::public.profile_type
      join public.users u
        on u.id = tp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where c.id = messages.conversation_id
        and tp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.conversations c
      join public.providers pr on pr.id = c.provider_id
      join public.provider_profiles pp on pp.id = pr.provider_profile_id
      join public.user_roles ur
        on ur.user_id = pp.user_id
       and ur.role = 'provider'::public.profile_type
      join public.users u
        on u.id = pp.user_id
       and u.status = 'active'
       and u.deleted_at is null
      where c.id = messages.conversation_id
        and pr.deleted_at is null
        and pp.user_id = auth.uid()
        and pp.status = 'active'::public.provider_status
    )
  );

create or replace function public.providers_list_near(
  p_user_id uuid,
  p_category text default null,
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  service_label text,
  category public.provider_category,
  avatar_url text,
  rating numeric,
  review_count integer,
  distance_meters integer,
  is_available boolean,
  price_per_hour numeric,
  bio text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.service_label,
    s.category,
    s.avatar_url,
    s.rating,
    s.review_count,
    s.distance_meters,
    s.is_available,
    s.price_per_hour,
    s.bio
  from (
    select
      pr.id,
      pp.display_name as name,
      pr.service_label,
      pr.category,
      pr.avatar_url,
      round(coalesce(pp.rating_average, 0), 2) as rating,
      pp.rating_count as review_count,
      case
        when tl.loc is not null and ba.location is not null
        then (round(st_distance(tl.loc, ba.location) / 10.0) * 10)::integer
        else null
      end as distance_meters,
      pr.is_available,
      pr.price_per_hour,
      pp.bio,
      pp.rating_average as sort_rating,
      pr.created_at as sort_created
    from public.providers pr
    join public.provider_profiles pp on pp.id = pr.provider_profile_id
    join public.user_roles ur
      on ur.user_id = pp.user_id
     and ur.role = 'provider'::public.profile_type
    join public.users u
      on u.id = pp.user_id
     and u.status = 'active'
     and u.deleted_at is null
    left join public.addresses ba on ba.id = pp.base_address_id
    left join (
      select a.location as loc
      from public.tutor_profiles tp
      join public.addresses a on a.id = tp.default_address_id
      where tp.user_id = p_user_id
      limit 1
    ) tl on true
    where pr.deleted_at is null
      and pp.status = 'active'
      and (p_category is null or pr.category::text = p_category)
      and (
        p_search is null
        or pp.display_name ilike '%' || p_search || '%'
        or pr.service_label ilike '%' || p_search || '%'
      )
  ) s
  order by
    s.distance_meters asc nulls last,
    s.sort_rating desc nulls last,
    s.sort_created asc
  limit greatest(coalesce(p_limit, 20), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.providers_get_one(
  p_user_id uuid,
  p_provider_id uuid
)
returns table (
  id uuid,
  name text,
  service_label text,
  category public.provider_category,
  avatar_url text,
  rating numeric,
  review_count integer,
  distance_meters integer,
  is_available boolean,
  price_per_hour numeric,
  bio text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pr.id,
    pp.display_name,
    pr.service_label,
    pr.category,
    pr.avatar_url,
    round(coalesce(pp.rating_average, 0), 2),
    pp.rating_count,
    case
      when tl.loc is not null and ba.location is not null
      then (round(st_distance(tl.loc, ba.location) / 10.0) * 10)::integer
      else null
    end,
    pr.is_available,
    pr.price_per_hour,
    pp.bio
  from public.providers pr
  join public.provider_profiles pp on pp.id = pr.provider_profile_id
  join public.user_roles ur
    on ur.user_id = pp.user_id
   and ur.role = 'provider'::public.profile_type
  join public.users u
    on u.id = pp.user_id
   and u.status = 'active'
   and u.deleted_at is null
  left join public.addresses ba on ba.id = pp.base_address_id
  left join (
    select a.location as loc
    from public.tutor_profiles tp
    join public.addresses a on a.id = tp.default_address_id
    where tp.user_id = p_user_id
    limit 1
  ) tl on true
  where pr.id = p_provider_id
    and pr.deleted_at is null
    and pp.status = 'active';
$$;

revoke all on function
  public.providers_list_near(uuid, text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.providers_get_one(uuid, uuid)
  from public, anon, authenticated;
grant execute on function
  public.providers_list_near(uuid, text, text, integer, integer) to service_role;
grant execute on function public.providers_get_one(uuid, uuid) to service_role;

comment on policy providers_owner_or_admin_select on public.providers is
  'Direct provider listing visibility requires active provider profile, provider role, active owner user, and non-deleted listing.';
comment on policy tutor_profiles_owner_or_admin_select
  on public.tutor_profiles is
  'Direct tutor profile visibility requires tutor role and active owner user.';
comment on policy provider_profiles_owner_or_admin_select
  on public.provider_profiles is
  'Direct provider profile visibility requires provider role and active owner user.';
comment on policy pets_owner_or_admin_select on public.pets is
  'Direct pet visibility requires tutor role and active owner user.';
comment on policy provider_services_owner_or_admin_select
  on public.provider_services is
  'Direct provider service visibility requires provider role and active owner user.';
comment on policy bookings_participant_or_admin_select on public.bookings is
  'Direct booking visibility requires matching active tutor/provider identity.';
comment on policy conversations_participant_or_admin_select on public.conversations is
  'Direct conversation visibility requires matching active tutor/provider identity.';
comment on policy messages_participant_or_admin_select on public.messages is
  'Direct message visibility requires matching active tutor/provider identity.';
comment on function public.providers_list_near(uuid, text, text, integer, integer)
  is 'Marketplace provider list. Requires active owner, active provider profile, provider role, and non-deleted listing.';
comment on function public.providers_get_one(uuid, uuid)
  is 'Marketplace provider detail. Requires active owner, active provider profile, provider role, and non-deleted listing.';
