-- Checkpoint 094: atomic cold-start rate-limit for direct conversations.
--
-- Rollback:
--   drop function if exists public.conversations_open_cold_start(uuid, uuid, integer, timestamptz);

create or replace function public.conversations_open_cold_start(
  p_tutor_profile_id uuid,
  p_provider_id uuid,
  p_limit integer,
  p_window_start timestamptz
)
returns table (
  status text,
  id uuid,
  provider_id uuid,
  last_message_text text,
  last_message_at timestamptz,
  last_message_from_provider boolean
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_existing public.conversations%rowtype;
  v_inserted public.conversations%rowtype;
  v_cold_start_count integer;
begin
  if p_limit is null or p_limit < 1 then
    raise exception 'p_limit must be positive';
  end if;

  if p_window_start is null then
    raise exception 'p_window_start is required';
  end if;

  -- Serialize count+insert for a tutor. Without this lock, concurrent cold
  -- starts can all observe the same count and exceed the hourly cap.
  perform pg_advisory_xact_lock(
    hashtextextended(
      'conversations:cold-start:' || p_tutor_profile_id::text,
      0
    )
  );

  select *
    into v_existing
  from public.conversations c
  where c.tutor_profile_id = p_tutor_profile_id
    and c.provider_id = p_provider_id
  limit 1;

  if found then
    return query
      select
        'ok'::text,
        v_existing.id,
        v_existing.provider_id,
        v_existing.last_message_text,
        v_existing.last_message_at,
        v_existing.last_message_from_provider;
    return;
  end if;

  select count(*)::integer
    into v_cold_start_count
  from public.conversations c
  where c.tutor_profile_id = p_tutor_profile_id
    and c.booking_id is null
    and c.created_at >= p_window_start;

  if v_cold_start_count >= p_limit then
    return query
      select
        'rate_limited'::text,
        null::uuid,
        null::uuid,
        null::text,
        null::timestamptz,
        null::boolean;
    return;
  end if;

  begin
    insert into public.conversations (tutor_profile_id, provider_id)
    values (p_tutor_profile_id, p_provider_id)
    returning * into v_inserted;
  exception
    when unique_violation then
      -- Defensive idempotency for a concurrent writer that did not use this RPC
      -- (for example an older API instance during rolling deploy).
      select *
        into v_inserted
      from public.conversations c
      where c.tutor_profile_id = p_tutor_profile_id
        and c.provider_id = p_provider_id
      limit 1;

      if not found then
        raise;
      end if;
  end;

  return query
    select
      'ok'::text,
      v_inserted.id,
      v_inserted.provider_id,
      v_inserted.last_message_text,
      v_inserted.last_message_at,
      v_inserted.last_message_from_provider;
end;
$$;

revoke all on function
  public.conversations_open_cold_start(uuid, uuid, integer, timestamptz)
  from public;
grant execute on function
  public.conversations_open_cold_start(uuid, uuid, integer, timestamptz)
  to service_role;

comment on function
  public.conversations_open_cold_start(uuid, uuid, integer, timestamptz) is
  'Opens or resumes a direct tutor-provider conversation while serializing the cold-start rate-limit per tutor profile.';
