-- P1-A: composite indexes for cursor pagination on hot list endpoints.
--
-- Rollback:
--   drop index if exists public.bookings_tutor_pagination_idx;
--   drop index if exists public.conversations_tutor_pagination_idx;
--   drop index if exists public.messages_conversation_pagination_idx;
--   drop index if exists public.reports_admin_pagination_idx;

create index if not exists bookings_tutor_pagination_idx
  on public.bookings(tutor_profile_id, booking_date, created_at, id);

create index if not exists conversations_tutor_pagination_idx
  on public.conversations(
    tutor_profile_id,
    last_message_at desc nulls last,
    created_at desc,
    id desc
  );

create index if not exists messages_conversation_pagination_idx
  on public.messages(conversation_id, created_at, id);

create index if not exists reports_admin_pagination_idx
  on public.reports(created_at desc, id desc);
