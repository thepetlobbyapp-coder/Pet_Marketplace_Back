-- Block 4G follow-up: enforce CONTIGUOUS booking hours.
-- A single service (one tutor "hire" click) is one booking, billed/counted per
-- service — never per slot or per day. Its hours must form a single continuous
-- block (e.g. 09:00,10:00,11:00), never scattered slots (e.g. 09:00,14:00).
--
-- This migration only re-creates public.create_booking_with_slots adding the
-- contiguity guard; the rest of the body is identical to
-- 20260528_002_weekly_availability_multi_slot_bookings.sql. Grants are
-- preserved across CREATE OR REPLACE and re-emitted for clarity.
--
-- Rollback: re-apply the function body from 20260528_002 (without the
--   contiguity guard).

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

  -- Contiguity guard: for a set of DISTINCT grid positions, the hours form a
  -- single continuous block iff (max - min + 1) equals the slot count.
  -- Duplicates were already rejected above, so this is exact.
  if (
    select max(p) - min(p) + 1
    from (
      select array_position(
        array[
          '08:00','09:00','10:00','11:00','12:00','13:00',
          '14:00','15:00','16:00','17:00','18:00','19:00'
        ],
        slot
      ) as p
      from unnest(v_slots) as slot
    ) q
  ) <> array_length(v_slots, 1) then
    raise exception 'Booking hours must be consecutive.';
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
