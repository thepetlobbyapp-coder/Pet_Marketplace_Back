-- Explicitly harden execute grants for backend-owned RPCs.
--
-- Supabase projects may carry direct grants for `anon` and `authenticated`
-- from previous function definitions. Revoking from `public` alone does not
-- remove those role-specific grants, so this migration removes them explicitly
-- and leaves execution only with `service_role`.
--
-- Rollback:
--   grant execute on function public.ensure_tutor_profile(uuid, text)
--     to anon, authenticated;
--   grant execute on function public.ensure_provider_profile(uuid, text)
--     to anon, authenticated;
--   grant execute on function
--     public.providers_list_near(uuid, text, text, integer, integer)
--     to anon, authenticated;
--   grant execute on function public.providers_get_one(uuid, uuid)
--     to anon, authenticated;

revoke all on function public.ensure_tutor_profile(uuid, text)
  from public, anon, authenticated;
revoke all on function public.ensure_provider_profile(uuid, text)
  from public, anon, authenticated;
revoke all on function
  public.providers_list_near(uuid, text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.providers_get_one(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.ensure_tutor_profile(uuid, text)
  to service_role;
grant execute on function public.ensure_provider_profile(uuid, text)
  to service_role;
grant execute on function
  public.providers_list_near(uuid, text, text, integer, integer)
  to service_role;
grant execute on function public.providers_get_one(uuid, uuid)
  to service_role;
