-- Reviews (5-star, no comment in this phase) + tutor service confirmation.
-- design.md / 02_DOCUMENTACAO_TECNICA_PROJETO §5.12, §11.4.
--
-- Flow: provider marks booking 'completed' (delivery) -> tutor confirms the
-- service happened (proof, future escrow-release hook) OR 2 days elapse ->
-- the tutor may rate the provider 1..5. One review per service (booking),
-- editable, tutor -> provider only in this phase. No comment column yet.
--
-- Rollback:
--   drop function if exists public.submit_review(uuid, uuid, smallint);
--   drop function if exists public.recompute_provider_rating(uuid);
--   drop table if exists public.reviews;
--   drop type if exists public.review_status;
--   alter table public.bookings drop column if exists tutor_confirmed_at;

-- 1) Tutor service confirmation timestamp (the proof / escrow-release hook).
alter table public.bookings
  add column if not exists tutor_confirmed_at timestamptz;

-- 2) Review moderation status (02_DOC §5.12).
do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'review_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.review_status as enum (
      'visible',
      'hidden_by_admin',
      'reported',
      'removed'
    );
  end if;
end $$;

-- 3) Reviews table. One row per booking (unique). No free text in this phase.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null
    references public.bookings(id) on delete cascade,
  reviewer_user_id uuid not null,
  reviewed_provider_profile_id uuid not null
    references public.provider_profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  status public.review_status not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

create index if not exists reviews_provider_visible_idx
  on public.reviews(reviewed_provider_profile_id)
  where status = 'visible';
create index if not exists reviews_reviewer_idx
  on public.reviews(reviewer_user_id);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

grant usage on type public.review_status to authenticated, service_role;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to authenticated;
grant select, insert, update, delete on public.reviews to service_role;

-- A review is visible to its reviewer (tutor), to the reviewed provider's
-- owner, and to admins. Writes go exclusively through the service-role RPC.
drop policy if exists reviews_participant_or_admin_select on public.reviews;
create policy reviews_participant_or_admin_select on public.reviews
  for select to authenticated
  using (
    public.is_admin()
    or reviews.reviewer_user_id = auth.uid()
    or exists (
      select 1 from public.provider_profiles pp
      where pp.id = reviews.reviewed_provider_profile_id
        and pp.user_id = auth.uid()
    )
  );

comment on table public.reviews is
  'Service ratings 1..5 (no comment in this phase). One per booking, tutor -> '
  'provider. Aggregates live in provider_profiles.rating_average/rating_count '
  '(02_DOCUMENTACAO_TECNICA_PROJETO §5.12).';

-- 4) Atomic aggregate recompute, serialized per provider via row lock to avoid
--    lost updates under concurrent reviews. Only 'visible' reviews count.
create or replace function public.recompute_provider_rating(p_pp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.provider_profiles where id = p_pp_id for update;

  update public.provider_profiles pp
  set
    rating_average = sub.avg_rating,
    rating_count = sub.cnt
  from (
    select
      case when count(*) = 0 then null
           else round(avg(rating)::numeric, 2) end as avg_rating,
      count(*)::int as cnt
    from public.reviews
    where reviewed_provider_profile_id = p_pp_id
      and status = 'visible'
  ) sub
  where pp.id = p_pp_id;
end;
$$;

revoke all on function public.recompute_provider_rating(uuid) from public, anon, authenticated;
grant execute on function public.recompute_provider_rating(uuid) to service_role;

-- 5) submit_review: validate ownership + eligibility, upsert (editable), set
--    the confirmation hook, and recompute the provider aggregate — all atomic.
--    Errors map to HTTP in the API: NO_DATA_FOUND -> 404, check_violation -> 409.
create or replace function public.submit_review(
  p_booking_id uuid,
  p_reviewer_user_id uuid,
  p_rating smallint
)
returns table (
  id uuid,
  booking_id uuid,
  rating smallint,
  status public.review_status,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pp_id uuid;
  v_eligible boolean;
  v_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.' using errcode = 'check_violation';
  end if;

  select
    pp.id,
    (
      b.status = 'completed'
      and (
        b.tutor_confirmed_at is not null
        or now() >= (b.booking_date + interval '2 days')
      )
    )
  into v_pp_id, v_eligible
  from public.bookings b
  join public.tutor_profiles tp on tp.id = b.tutor_profile_id
  join public.providers pr on pr.id = b.provider_id
  join public.provider_profiles pp on pp.id = pr.provider_profile_id
  where b.id = p_booking_id
    and tp.user_id = p_reviewer_user_id;

  if not found then
    raise exception 'Booking not found for this reviewer.' using errcode = 'NO_DATA_FOUND';
  end if;

  if not v_eligible then
    raise exception 'Booking is not eligible for review yet.' using errcode = 'check_violation';
  end if;

  insert into public.reviews (
    booking_id,
    reviewer_user_id,
    reviewed_provider_profile_id,
    rating
  )
  values (
    p_booking_id,
    p_reviewer_user_id,
    v_pp_id,
    p_rating
  )
  on conflict (booking_id) do update
    set rating = excluded.rating,
        updated_at = now()
  returning reviews.id into v_id;

  -- Rating implies confirmation: record the proof hook if not already set.
  update public.bookings
  set tutor_confirmed_at = coalesce(tutor_confirmed_at, now())
  where id = p_booking_id;

  perform public.recompute_provider_rating(v_pp_id);

  return query
  select r.id, r.booking_id, r.rating, r.status, r.created_at, r.updated_at
  from public.reviews r
  where r.id = v_id;
end;
$$;

revoke all on function public.submit_review(uuid, uuid, smallint) from public, anon, authenticated;
grant execute on function public.submit_review(uuid, uuid, smallint) to service_role;
