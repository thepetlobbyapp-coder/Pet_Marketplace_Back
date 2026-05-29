-- Repair legacy provider listings made active before base_address_id became a
-- publish precondition.
--
-- Migration 20260528_003 intentionally made providers_list_near strict:
-- providers without a geocoded base address must not appear in radius-filtered
-- marketplace discovery. This data migration keeps that product rule and fixes
-- legacy rows by assigning a safe own address when possible. Any active listing
-- still missing a valid own geocoded base address is paused, matching the
-- backend publish invariant.

with provider_candidates as (
  select
    pp.id as provider_profile_id,
    coalesce(default_addr.id, fallback_addr.id) as candidate_address_id
  from public.provider_profiles pp
  join public.providers pr on pr.provider_profile_id = pp.id
  left join public.tutor_profiles tp on tp.user_id = pp.user_id
  left join public.addresses default_addr
    on default_addr.id = tp.default_address_id
   and default_addr.user_id = pp.user_id
   and default_addr.location is not null
  left join lateral (
    select a.id
    from public.addresses a
    where a.user_id = pp.user_id
      and a.location is not null
    order by
      case when a.id = tp.default_address_id then 0 else 1 end,
      a.created_at asc,
      a.id asc
    limit 1
  ) fallback_addr on true
  where pr.deleted_at is null
    and pp.status = 'active'
    and not exists (
      select 1
      from public.addresses current_base
      where current_base.id = pp.base_address_id
        and current_base.user_id = pp.user_id
        and current_base.location is not null
    )
)
update public.provider_profiles pp
set
  base_address_id = pc.candidate_address_id,
  updated_at = now()
from provider_candidates pc
where pp.id = pc.provider_profile_id
  and pc.candidate_address_id is not null;

update public.provider_profiles pp
set
  status = 'paused',
  updated_at = now()
where pp.status = 'active'
  and exists (
    select 1
    from public.providers pr
    where pr.provider_profile_id = pp.id
      and pr.deleted_at is null
  )
  and not exists (
    select 1
    from public.addresses ba
    where ba.id = pp.base_address_id
      and ba.user_id = pp.user_id
      and ba.location is not null
  );

comment on column public.provider_profiles.base_address_id is
  'Provider own geocoded base address used for privacy-safe radius discovery. Active marketplace listings without one are invalid and should stay paused.';
