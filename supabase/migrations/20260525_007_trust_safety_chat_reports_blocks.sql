-- Checkpoint 064: Trust & Safety MVP for 1:1 chat.
-- Local migration only. Do not apply remotely without explicit human approval.
--
-- Rollback:
--   drop table if exists public.user_blocks;
--   drop table if exists public.reports;
--   drop type if exists public.report_category;
--   drop type if exists public.report_status;

do $$
begin
  create type public.report_status as enum (
    'open',
    'in_review',
    'action_taken',
    'dismissed',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_category as enum (
    'safety_concern',
    'inappropriate_behaviour',
    'harassment',
    'spam_scam',
    'no_show',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid references public.users(id) on delete set null,
  target_type text not null
    check (target_type in ('conversation', 'message')),
  target_id uuid not null,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid references public.messages(id) on delete restrict,
  category public.report_category not null,
  description text,
  status public.report_status not null default 'open',
  assigned_admin_id uuid references public.users(id) on delete set null,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(coalesce(description, '')) <= 1000),
  check (char_length(coalesce(internal_note, '')) <= 1000),
  check (
    (target_type = 'conversation' and message_id is null)
    or (target_type = 'message' and message_id is not null)
  )
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references public.users(id) on delete cascade,
  blocked_user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id),
  check (char_length(coalesce(reason, '')) <= 120)
);

create index if not exists reports_reporter_user_id_idx
  on public.reports(reporter_user_id);
create index if not exists reports_reported_user_id_idx
  on public.reports(reported_user_id);
create index if not exists reports_conversation_id_idx
  on public.reports(conversation_id);
create index if not exists reports_status_created_at_idx
  on public.reports(status, created_at desc);
create index if not exists user_blocks_blocker_user_id_idx
  on public.user_blocks(blocker_user_id);
create index if not exists user_blocks_blocked_user_id_idx
  on public.user_blocks(blocked_user_id);
create index if not exists user_blocks_conversation_id_idx
  on public.user_blocks(conversation_id);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists user_blocks_set_updated_at on public.user_blocks;
create trigger user_blocks_set_updated_at
  before update on public.user_blocks
  for each row execute function public.set_updated_at();

alter table public.reports enable row level security;
alter table public.user_blocks enable row level security;

revoke all on public.reports from anon, authenticated;
revoke all on public.user_blocks from anon, authenticated;
grant usage on type public.report_status to authenticated, service_role;
grant usage on type public.report_category to authenticated, service_role;
grant select on public.reports to authenticated;
grant select on public.user_blocks to authenticated;
grant select, insert, update, delete on public.reports to service_role;
grant select, insert, update, delete on public.user_blocks to service_role;

drop policy if exists reports_owner_or_admin_select on public.reports;
create policy reports_owner_or_admin_select on public.reports
  for select to authenticated
  using (
    public.is_admin()
    or reporter_user_id = auth.uid()
    or reported_user_id = auth.uid()
  );

drop policy if exists user_blocks_participant_or_admin_select
  on public.user_blocks;
create policy user_blocks_participant_or_admin_select on public.user_blocks
  for select to authenticated
  using (
    public.is_admin()
    or blocker_user_id = auth.uid()
    or blocked_user_id = auth.uid()
  );

comment on column public.reports.description is
  'User-submitted report context. Treat as sensitive UGC; never echo it in '
  'validation errors or operational logs.';

comment on table public.user_blocks is
  'User-to-user blocks for direct chat. Blocks prevent new direct messages but '
  'do not delete existing evidence needed for support and moderation.';
