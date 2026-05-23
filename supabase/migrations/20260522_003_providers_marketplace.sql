-- Block 4F: providers marketplace listing.
-- A `providers` row is the marketplace-facing listing of a `provider_profile`.
-- Fixed categories: walk, sitting, transport, boarding.
--
-- Privacy (design.md §9 — approximate distance only): the API never exposes
-- phone, full address or coordinates. The `providers_*` functions return only
-- an APPROXIMATE distance, computed from the tutor's condominium (the tutor's
-- default address) and rounded to tens of metres.
--
-- Rollback:
--   drop function if exists public.providers_get_one(uuid, uuid);
--   drop function if exists public.providers_list_near(uuid, text, text, integer, integer);
--   drop table if exists public.providers;
--   drop type if exists public.provider_category;

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'provider_category'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.provider_category as enum (
      'walk',
      'sitting',
      'transport',
      'boarding'
    );
  end if;
end $$;

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null unique
    references public.provider_profiles(id) on delete cascade,
  category public.provider_category not null,
  service_label text not null,
  avatar_url text,
  price_per_hour numeric(10,2) not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (price_per_hour >= 0),
  check (char_length(service_label) between 1 and 160)
);

create index if not exists providers_provider_profile_id_idx
  on public.providers(provider_profile_id);
create index if not exists providers_category_idx on public.providers(category);
create index if not exists providers_deleted_at_idx on public.providers(deleted_at);

drop trigger if exists providers_set_updated_at on public.providers;
create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

alter table public.providers enable row level security;

grant usage on type public.provider_category to authenticated, service_role;
revoke all on public.providers from anon, authenticated;
grant select on public.providers to authenticated;
grant select, insert, update, delete on public.providers to service_role;

-- A provider may read their own listing; everyone else goes through the
-- service-role functions below, which project only privacy-safe columns.
drop policy if exists providers_owner_or_admin_select on public.providers;
create policy providers_owner_or_admin_select on public.providers
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.provider_profiles pp
      where pp.id = providers.provider_profile_id
        and pp.user_id = auth.uid()
    )
  );

-- Lists active providers near the tutor's condominium (default address).
-- `distance_meters` is rounded to tens of metres; it is null when either the
-- tutor or the provider has no stored location.
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

-- Detail of a single active provider, with the same privacy-safe projection.
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

comment on column public.providers.avatar_url is
  'Public provider avatar. Safe to expose to other users.';
comment on function public.providers_list_near(uuid, text, text, integer, integer) is
  'Marketplace provider list. Distance is approximate (tens of metres).';
comment on function public.providers_get_one(uuid, uuid) is
  'Marketplace provider detail. Distance is approximate (tens of metres).';
