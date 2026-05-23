-- Block 4G: bookings (service reservations).
-- Phase 1 records the request/confirmation lifecycle of a service slot ONLY.
-- It does NOT process payment and does NOT promise financial protection,
-- custody or refunds (design.md §8 "Payment" l.387, §11 "Payments" l.663-668).
--
-- Rollback:
--   drop table if exists public.bookings;
--   drop type if exists public.booking_status;

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'booking_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.booking_status as enum (
      'requested',
      'confirmed',
      'cancelled',
      'completed'
    );
  end if;
end $$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null
    references public.tutor_profiles(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete restrict,
  pet_id uuid not null references public.pets(id) on delete restrict,
  service_label text not null,
  booking_date date not null,
  time_slot_id text not null,
  status public.booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(service_label) between 1 and 160),
  check (char_length(time_slot_id) between 1 and 16)
);

create index if not exists bookings_tutor_profile_id_idx
  on public.bookings(tutor_profile_id);
create index if not exists bookings_provider_id_idx
  on public.bookings(provider_id);
create index if not exists bookings_pet_id_idx on public.bookings(pet_id);
create index if not exists bookings_date_idx on public.bookings(booking_date);

-- A time slot can be held by at most one active (requested/confirmed) booking.
-- Cancelled/completed rows free the slot again. The API maps the resulting
-- 23505 unique violation to HTTP 409 CONFLICT.
create unique index if not exists bookings_active_slot_unique
  on public.bookings(provider_id, booking_date, time_slot_id)
  where status in ('requested', 'confirmed');

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

grant usage on type public.booking_status to authenticated, service_role;
revoke all on public.bookings from anon, authenticated;
grant select on public.bookings to authenticated;
grant select, insert, update, delete on public.bookings to service_role;

-- A booking is visible to its tutor, to the user behind its provider, and to
-- admins. Writes go exclusively through the service-role API.
drop policy if exists bookings_participant_or_admin_select on public.bookings;
create policy bookings_participant_or_admin_select on public.bookings
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tutor_profiles tp
      where tp.id = bookings.tutor_profile_id
        and tp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.providers pr
      join public.provider_profiles pp on pp.id = pr.provider_profile_id
      where pr.id = bookings.provider_id
        and pp.user_id = auth.uid()
    )
  );

comment on table public.bookings is
  'Service reservations. Phase 1 records lifecycle only — no payment, no '
  'financial protection (design.md §11 "Payments").';
