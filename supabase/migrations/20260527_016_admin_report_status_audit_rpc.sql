-- Checkpoint P2-C: atomic admin report status update with audit log.
-- Prepared for review only. Do not apply remotely without explicit approval.
--
-- Rollback:
--   drop function if exists public.admin_update_report_status_with_audit(uuid, uuid, public.report_status, text);

create or replace function public.admin_update_report_status_with_audit(
  p_admin_user_id uuid,
  p_report_id uuid,
  p_status public.report_status,
  p_internal_note text
)
returns table (
  id uuid,
  status public.report_status,
  category public.report_category,
  target_type text,
  target_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_report public.reports%rowtype;
begin
  if p_admin_user_id is null then
    raise exception 'p_admin_user_id is required';
  end if;

  if p_report_id is null then
    raise exception 'p_report_id is required';
  end if;

  if p_status is null then
    raise exception 'p_status is required';
  end if;

  if p_internal_note is not null and char_length(p_internal_note) > 1000 then
    raise exception 'p_internal_note must be at most 1000 characters';
  end if;

  update public.reports r
     set status = p_status,
         assigned_admin_id = p_admin_user_id,
         internal_note = p_internal_note,
         updated_at = now()
   where r.id = p_report_id
   returning * into v_report;

  if not found then
    return;
  end if;

  insert into public.audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    p_admin_user_id,
    'trust_safety.report_status_updated',
    'report',
    v_report.id,
    jsonb_build_object('status', v_report.status)
  );

  return query
    select
      v_report.id,
      v_report.status,
      v_report.category,
      v_report.target_type,
      v_report.target_id,
      v_report.created_at,
      v_report.updated_at;
end;
$$;

revoke all on function
  public.admin_update_report_status_with_audit(
    uuid,
    uuid,
    public.report_status,
    text
  )
  from public;

revoke all on function
  public.admin_update_report_status_with_audit(
    uuid,
    uuid,
    public.report_status,
    text
  )
  from anon, authenticated;

grant execute on function
  public.admin_update_report_status_with_audit(
    uuid,
    uuid,
    public.report_status,
    text
  )
  to service_role;

comment on function
  public.admin_update_report_status_with_audit(
    uuid,
    uuid,
    public.report_status,
    text
  ) is
  'Atomically updates an admin report status and appends the redacted audit log entry in the same transaction.';
