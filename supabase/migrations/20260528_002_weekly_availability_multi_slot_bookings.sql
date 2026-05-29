-- Weekly provider availability and multi-slot bookings.
-- This keeps the legacy bookings.time_slot_id column for existing Admin/Mobile
-- consumers while adding booking_slots as the concurrency boundary.
--
-- Rollback:
--   drop function if exists public.create_booking_with_slots(uuid, uuid, uuid, text, date, text[], numeric, text);
--   drop table if exists public.booking_slots;
--   drop table if exists public.provider_availability_rules;
--   alter table public.bookings
--     drop column if exists price_per_hour_snapshot,
--     drop column if exists estimated_total_amount,
--     drop column if exists currency;

alter table public.bookings
  add column if not exists price_per_hour_snapshot numeric(10,2) not null default 0,
  add column if not exists estimated_total_amount numeric(10,2) not null default 0,
  add column if not exists currency text not null default 'GBP';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_currency_gbp_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_currency_gbp_check check (currency = 'GBP');
  end if;
end $$;

create table if not exists public.provider_availability_rules (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null
    references public.provider_profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  time_slot_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_profile_id, weekday, time_slot_id),
  check (
    time_slot_id in (
      '08:00','09:00','10:00','11:00','12:00','13:00',
      '14:00','15:00','16:00','17:00','18:00','19:00'
    )
  )
);

create index if not exists provider_availability_rules_profile_weekday_idx
  on public.provider_availability_rules(provider_profile_id, weekday)
  where is_active;

drop trigger if exists provider_availability_rules_set_updated_at
  on public.provider_availability_rules;
create trigger provider_availability_rules_set_updated_at
  before update on public.provider_availability_rules
  for each row execute function public.set_updated_at();

alter table public.provider_availability_rules enable row level security;
revoke all on public.provider_availability_rules from anon, authenticated;
grant select, insert, update, delete
  on public.provider_availability_rules to service_role;

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete restrict,
  booking_date date not null,
  time_slot_id text not null,
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, time_slot_id),
  check (
    time_slot_id in (
      '08:00','09:00','10:00','11:00','12:00','13:00',
      '14:00','15:00','16:00','17:00','18:00','19:00'
    )
  )
);

insert into public.booking_slots (
  booking_id,
  provider_id,
  booking_date,
  time_slot_id,
  status,
  created_at,
  updated_at
)
select
  b.id,
  b.provider_id,
  b.booking_date,
  b.time_slot_id,
  b.status,
  b.created_at,
  b.updated_at
from public.bookings b
on conflict (booking_id, time_slot_id) do nothing;

create index if not exists booking_slots_booking_id_idx
  on public.booking_slots(booking_id);
create index if not exists booking_slots_provider_date_idx
  on public.booking_slots(provider_id, booking_date);
create unique index if not exists booking_slots_active_slot_unique
  on public.booking_slots(provider_id, booking_date, time_slot_id)
  where status in ('requested', 'confirmed');

drop trigger if exists booking_slots_set_updated_at on public.booking_slots;
create trigger booking_slots_set_updated_at
  before update on public.booking_slots
  for each row execute function public.set_updated_at();

alter table public.booking_slots enable row level security;
revoke all on public.booking_slots from anon, authenticated;
grant select, insert, update, delete on public.booking_slots to service_role;

create or replace function public.sync_booking_slot_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    update public.booking_slots
      set status = new.status,
          updated_at = now()
      where booking_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_sync_slot_status on public.bookings;
create trigger bookings_sync_slot_status
  after update of status on public.bookings
  for each row execute function public.sync_booking_slot_status();

create or replace function public.create_booking_with_slots(
  p_tutor_profile_id uuid,
  p_provider_id uuid,
  p_pet_id uuid,
  p_service_label text,
  p_booking_date date,
  p_time_slot_ids text[],
  p_price_per_hour numeric,
  p_currency text default 'GBP'
)
returns table (
  id uuid,
  provider_id uuid,
  pet_id uuid,
  service_label text,
  booking_date date,
  time_slot_id text,
  time_slot_ids text[],
  status public.booking_status,
  price_per_hour_snapshot numeric,
  estimated_total_amount numeric,
  currency text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id uuid;
  v_first_slot text;
  v_slots text[];
  v_estimated_total numeric(10,2);
begin
  if p_currency <> 'GBP' then
    raise exception 'Unsupported booking currency.';
  end if;

  select array_agg(slot order by array_position(
    array[
      '08:00','09:00','10:00','11:00','12:00','13:00',
      '14:00','15:00','16:00','17:00','18:00','19:00'
    ],
    slot
  ))
  into v_slots
  from unnest(p_time_slot_ids) as slot;

  if v_slots is null or array_length(v_slots, 1) = 0 then
    raise exception 'At least one booking slot is required.';
  end if;

  if array_length(v_slots, 1) <> (
    select count(distinct slot) from unnest(v_slots) as slot
  ) then
    raise exception 'Duplicate booking slots are not allowed.';
  end if;

  if exists (
    select 1
    from unnest(v_slots) as slot
    where slot not in (
      '08:00','09:00','10:00','11:00','12:00','13:00',
      '14:00','15:00','16:00','17:00','18:00','19:00'
    )
  ) then
    raise exception 'Invalid booking slot.';
  end if;

  v_first_slot := v_slots[1];
  v_estimated_total :=
    round((coalesce(p_price_per_hour, 0) * array_length(v_slots, 1))::numeric, 2);

  insert into public.bookings (
    tutor_profile_id,
    provider_id,
    pet_id,
    service_label,
    booking_date,
    time_slot_id,
    price_per_hour_snapshot,
    estimated_total_amount,
    currency
  )
  values (
    p_tutor_profile_id,
    p_provider_id,
    p_pet_id,
    p_service_label,
    p_booking_date,
    v_first_slot,
    coalesce(p_price_per_hour, 0),
    v_estimated_total,
    p_currency
  )
  returning public.bookings.id into v_booking_id;

  insert into public.booking_slots (
    booking_id,
    provider_id,
    booking_date,
    time_slot_id,
    status
  )
  select
    v_booking_id,
    p_provider_id,
    p_booking_date,
    slot,
    'requested'::public.booking_status
  from unnest(v_slots) as slot;

  return query
  select
    b.id,
    b.provider_id,
    b.pet_id,
    b.service_label,
    b.booking_date,
    b.time_slot_id,
    v_slots as time_slot_ids,
    b.status,
    b.price_per_hour_snapshot,
    b.estimated_total_amount,
    b.currency,
    b.created_at,
    b.updated_at
  from public.bookings b
  where b.id = v_booking_id;
end;
$$;

revoke all on function public.create_booking_with_slots(
  uuid, uuid, uuid, text, date, text[], numeric, text
) from public;
grant execute on function public.create_booking_with_slots(
  uuid, uuid, uuid, text, date, text[], numeric, text
) to service_role;
