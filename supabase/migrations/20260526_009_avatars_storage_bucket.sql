-- Private Supabase Storage bucket `avatars`. Object key convention:
--   avatars/{user_id}/avatar.jpg
--
-- This file is split in two parts because Supabase Cloud restricts ownership
-- of `storage.objects` to the internal `supabase_storage_admin` role. The
-- bucket insert below is safe to run from the SQL Editor; the four owner-only
-- RLS policies that protect `storage.objects` MUST be created via the
-- Supabase Dashboard (Storage → Policies → New policy) on Cloud. See the
-- companion file `20260526_009b_avatars_storage_policies.README.md` for the
-- exact expressions to paste.
--
-- For self-hosted Supabase / local dev the policy SQL is provided at the
-- bottom of this file inside a guard that skips on Cloud (where the
-- `pg_has_role(...)` check returns false). You can copy it manually if you
-- run a self-hosted instance.
--
-- Rollback:
--   delete from storage.buckets where id = 'avatars';
--   -- Cascading objects must be removed via the Storage API or dashboard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5 * 1024 * 1024, -- 5 MB hard limit, matches API validator.
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================================
-- Self-hosted only: create the 4 RLS policies on storage.objects.
-- Skipped automatically on Supabase Cloud because the executing role
-- (`postgres`) is not the owner of `storage.objects` there.
-- On Cloud, use the Dashboard Storage Policy UI instead (see README).
-- =========================================================================

do $$
declare
  is_owner boolean;
begin
  select pg_has_role(current_user, c.relowner, 'USAGE')
    into is_owner
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects';

  if coalesce(is_owner, false) then
    execute $policy$
      drop policy if exists avatars_owner_select on storage.objects;
      create policy avatars_owner_select
        on storage.objects
        for select to authenticated
        using (
          bucket_id = 'avatars'
          and auth.uid()::text = (storage.foldername(name))[1]
        );

      drop policy if exists avatars_owner_insert on storage.objects;
      create policy avatars_owner_insert
        on storage.objects
        for insert to authenticated
        with check (
          bucket_id = 'avatars'
          and auth.uid()::text = (storage.foldername(name))[1]
        );

      drop policy if exists avatars_owner_update on storage.objects;
      create policy avatars_owner_update
        on storage.objects
        for update to authenticated
        using (
          bucket_id = 'avatars'
          and auth.uid()::text = (storage.foldername(name))[1]
        )
        with check (
          bucket_id = 'avatars'
          and auth.uid()::text = (storage.foldername(name))[1]
        );

      drop policy if exists avatars_owner_delete on storage.objects;
      create policy avatars_owner_delete
        on storage.objects
        for delete to authenticated
        using (
          bucket_id = 'avatars'
          and auth.uid()::text = (storage.foldername(name))[1]
        );
    $policy$;
    raise notice 'avatars_owner_* policies created on storage.objects.';
  else
    raise notice 'Skipping storage.objects policies — not the owner. On Supabase Cloud create them via Storage → Policies UI (see 009b README).';
  end if;
end $$;
