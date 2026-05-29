-- Radius filter for marketplace discovery (providers_list_near only).
--
-- Each provider declares a service radius (provider_profiles.service_radius_km).
-- The nearby list must only surface providers whose service area covers the
-- requesting tutor's location, so we add an st_dwithin predicate keyed on the
-- provider's own radius. st_dwithin(geography, geography, metres) is index-aware
-- (uses the GiST index on addresses.location), unlike st_distance in ORDER BY.
--
-- Side effects that fall out of the same predicate and are intentional:
--   * tutors without a default address (tl.loc is null) get an empty list,
--     which enforces the "tutor needs an address" precondition without a hard
--     error during normal onboarding;
--   * providers without a base address (ba.location is null) never appear,
--     matching the "publish requires a base address" rule.
--
-- providers_get_one is deliberately NOT touched: detail powers the booking flow
-- and must remain reachable even when a provider sits outside the tutor radius.

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
      (round(st_distance(tl.loc, ba.location) / 10.0) * 10)::integer as distance_meters,
      pr.is_available,
      pr.price_per_hour,
      pp.bio,
      pp.rating_average as sort_rating,
      pr.created_at as sort_created
    from public.providers pr
    join public.provider_profiles pp on pp.id = pr.provider_profile_id
    join public.addresses ba on ba.id = pp.base_address_id
    join (
      select a.location as loc
      from public.tutor_profiles tp
      join public.addresses a on a.id = tp.default_address_id
      where tp.user_id = p_user_id
      limit 1
    ) tl on true
    where pr.deleted_at is null
      and pp.status = 'active'
      and pp.user_id <> p_user_id
      and tl.loc is not null
      and ba.location is not null
      and st_dwithin(tl.loc, ba.location, pp.service_radius_km * 1000)
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

revoke all on function
  public.providers_list_near(uuid, text, text, integer, integer) from public;
grant execute on function
  public.providers_list_near(uuid, text, text, integer, integer) to service_role;

comment on function public.providers_list_near(uuid, text, text, integer, integer)
  is 'Marketplace provider list. Distance is approximate (tens of metres); excludes the authenticated user own provider listing; only returns providers whose service_radius_km covers the requesting tutor location.';
