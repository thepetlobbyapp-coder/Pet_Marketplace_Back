-- Add nullable `avatar_url` to `public.users` so authenticated tutors and
-- providers can persist the storage path of their profile picture. The
-- column stores the bucket path (e.g. `avatars/{user_id}/avatar.jpg`),
-- never a signed URL — signed URLs are generated on demand by the API.
--
-- Migration is purely additive (NULL allowed, no default, no backfill, no
-- index). Reversible by dropping the column.
--
-- Rollback:
--   alter table public.users drop column if exists avatar_url;

alter table public.users
  add column if not exists avatar_url text;

comment on column public.users.avatar_url is
  'Storage object path of the user avatar inside the `avatars` bucket. '
  'Never expose raw signed URLs directly here; generate signed URLs '
  'on demand from the API with short TTL.';
