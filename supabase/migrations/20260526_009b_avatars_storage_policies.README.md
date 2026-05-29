# Migration 009b — Storage policies for the `avatars` bucket (Supabase Cloud)

> ⚠️ Supabase Cloud does **not** allow `CREATE POLICY ... ON storage.objects`
> from the SQL Editor (`ERROR: 42501: must be owner of relation objects`).
> The 4 owner-only policies below must be created via the Dashboard UI.
> On self-hosted Supabase the SQL inside `20260526_009_avatars_storage_bucket.sql`
> creates them automatically.

## Pre-requisite

The bucket `avatars` must exist already. If `20260526_009_*.sql` ran
successfully, you can confirm with the SQL Editor:

```sql
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets where id = 'avatars';
```

Expected: 1 row, `public=false`, `file_size_limit=5242880`,
`allowed_mime_types={image/jpeg,image/png,image/webp}`.

## Steps in the Supabase Dashboard

1. Open the project → **Storage** (left nav).
2. Click the **`avatars`** bucket.
3. Open the **Policies** tab (top of the bucket detail page).
4. For each of the 4 policies below: click **New policy** → **For full
   customization** → fill the form with the values in the table → **Save**.

> The UI exposes 4 separate forms (one per operation: SELECT, INSERT,
> UPDATE, DELETE). Do not pick the "Get started quickly" templates — they
> use less strict expressions.

## Policy 1 — `avatars_owner_select`

| Field | Value |
|---|---|
| Policy name | `avatars_owner_select` |
| Allowed operation | **SELECT** |
| Target roles | `authenticated` |
| USING expression | `bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]` |
| WITH CHECK expression | *(leave empty — SELECT has no WITH CHECK)* |

## Policy 2 — `avatars_owner_insert`

| Field | Value |
|---|---|
| Policy name | `avatars_owner_insert` |
| Allowed operation | **INSERT** |
| Target roles | `authenticated` |
| USING expression | *(leave empty — INSERT has no USING)* |
| WITH CHECK expression | `bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]` |

## Policy 3 — `avatars_owner_update`

| Field | Value |
|---|---|
| Policy name | `avatars_owner_update` |
| Allowed operation | **UPDATE** |
| Target roles | `authenticated` |
| USING expression | `bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]` |
| WITH CHECK expression | `bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]` |

## Policy 4 — `avatars_owner_delete`

| Field | Value |
|---|---|
| Policy name | `avatars_owner_delete` |
| Allowed operation | **DELETE** |
| Target roles | `authenticated` |
| USING expression | `bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]` |
| WITH CHECK expression | *(leave empty — DELETE has no WITH CHECK)* |

## Verify

After saving the 4 policies, run in SQL Editor:

```sql
select policyname, cmd
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname like 'avatars_owner_%'
  order by policyname;
```

Expected: 4 rows
`avatars_owner_delete | DELETE`,
`avatars_owner_insert | INSERT`,
`avatars_owner_select | SELECT`,
`avatars_owner_update | UPDATE`.

## Why these policies matter even though the API uses service_role

The Nest backend uses the Supabase `service_role` key, which bypasses
RLS — so the API already controls who can read/write what. These 4
policies are **defense in depth**:

1. If a future feature lets the mobile app upload directly via
   presigned URLs (bypassing the API), the policies prevent users
   from uploading into someone else's folder.
2. If the service-role key ever leaks and rotates incorrectly, the
   authenticated JWT path is still restricted to own-folder access.
3. They make the security stance explicit and reviewable in the
   policy list, which is what `S_SecurityValidator` will look for.
