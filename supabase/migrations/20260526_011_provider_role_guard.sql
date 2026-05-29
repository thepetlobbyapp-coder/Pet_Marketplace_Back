-- Guard marketplace providers by role as well as provider profile status.
--
-- A public provider listing is valid only when:
-- - public.providers is not soft-deleted;
-- - public.provider_profiles.status = 'active';
-- - the owning user has role 'provider'.
--
-- This prevents stale provider_profiles from remaining discoverable after a
-- user is converted back to a tutor-only account.

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
      where pp.id = providers.provider_profile_id
        and pp.user_id = auth.uid()
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
  public.providers_list_near(uuid, text, text, integer, integer) from public;
revoke all on function public.providers_get_one(uuid, uuid) from public;
grant execute on function
  public.providers_list_near(uuid, text, text, integer, integer) to service_role;
grant execute on function public.providers_get_one(uuid, uuid) to service_role;

comment on function public.providers_list_near(uuid, text, text, integer, integer)
  is 'Marketplace provider list. Requires active provider profile and provider role.';
comment on function public.providers_get_one(uuid, uuid)
  is 'Marketplace provider detail. Requires active provider profile and provider role.';
