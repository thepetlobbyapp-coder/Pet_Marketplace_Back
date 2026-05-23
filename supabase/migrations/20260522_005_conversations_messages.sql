-- Block 4H: conversations and messages (REST chat, no realtime in this phase).
-- A conversation is born linked to a provider (and optionally the booking that
-- originated it). Phase 1 exposes REST only — no realtime delivery.
--
-- Rollback:
--   drop table if exists public.messages;
--   drop table if exists public.conversations;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null
    references public.tutor_profiles(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  last_message_text text,
  last_message_at timestamptz,
  last_message_from_provider boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tutor_profile_id, provider_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations(id) on delete cascade,
  from_provider boolean not null,
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(body) between 1 and 2000)
);

create index if not exists conversations_tutor_profile_id_idx
  on public.conversations(tutor_profile_id);
create index if not exists conversations_provider_id_idx
  on public.conversations(provider_id);
create index if not exists conversations_booking_id_idx
  on public.conversations(booking_id);
create index if not exists conversations_last_message_at_idx
  on public.conversations(last_message_at desc);
create index if not exists messages_conversation_id_idx
  on public.messages(conversation_id, created_at);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant select, insert, update, delete on public.conversations to service_role;
grant select, insert, update, delete on public.messages to service_role;

-- A conversation is visible to its tutor, the user behind its provider, and
-- admins. Writes go exclusively through the service-role API.
drop policy if exists conversations_participant_or_admin_select
  on public.conversations;
create policy conversations_participant_or_admin_select
  on public.conversations
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tutor_profiles tp
      where tp.id = conversations.tutor_profile_id
        and tp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.providers pr
      join public.provider_profiles pp on pp.id = pr.provider_profile_id
      where pr.id = conversations.provider_id
        and pp.user_id = auth.uid()
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
      where c.id = messages.conversation_id
        and tp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.conversations c
      join public.providers pr on pr.id = c.provider_id
      join public.provider_profiles pp on pp.id = pr.provider_profile_id
      where c.id = messages.conversation_id
        and pp.user_id = auth.uid()
    )
  );

comment on column public.messages.body is
  'User-generated message text. Treat as sensitive — never echo it back in '
  'API error payloads; surface generic errors instead.';
