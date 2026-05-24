-- Play Store release blocker: account deletion request tracking.
-- This migration records the user's request only. It does NOT destructively
-- delete or anonymise account data; processing remains an operational follow-up.
--
-- Rollback:
--   drop table if exists public.account_deletion_requests;
--   drop type if exists public.account_deletion_request_status;

do $$
begin
  if not exists (
    select 1 from pg_type
    where typname = 'account_deletion_request_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.account_deletion_request_status as enum (
      'pending',
      'processing',
      'done'
    );
  end if;
end $$;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status public.account_deletion_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  estimated_completion_at timestamptz not null default (now() + interval '30 days'),
  processing_started_at timestamptz,
  completed_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists account_deletion_requests_user_id_idx
  on public.account_deletion_requests(user_id);
create index if not exists account_deletion_requests_status_idx
  on public.account_deletion_requests(status);
create index if not exists account_deletion_requests_requested_at_idx
  on public.account_deletion_requests(requested_at);

drop trigger if exists account_deletion_requests_set_updated_at
  on public.account_deletion_requests;
create trigger account_deletion_requests_set_updated_at
  before update on public.account_deletion_requests
  for each row execute function public.set_updated_at();

alter table public.account_deletion_requests enable row level security;

grant usage on type public.account_deletion_request_status
  to authenticated, service_role;
revoke all on public.account_deletion_requests from anon, authenticated;
grant select on public.account_deletion_requests to authenticated;
grant select, insert, update, delete on public.account_deletion_requests
  to service_role;

drop policy if exists account_deletion_requests_owner_or_admin_select
  on public.account_deletion_requests;
create policy account_deletion_requests_owner_or_admin_select
  on public.account_deletion_requests
  for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
  );

comment on table public.account_deletion_requests is
  'Tracks in-app account deletion requests for Play Store compliance. The row '
  'is an operational request, not destructive deletion by itself.';
comment on column public.account_deletion_requests.internal_notes is
  'Internal operational notes. Never expose through public API responses.';
