-- ============================================================
-- BookMe — profiles.email column
-- Fixes: "Could not find the 'email' column of 'profiles' in
-- the schema cache" when saving a profile.
--
-- The email-notification feature (freelancer emails) reads and
-- writes profiles.email, but the initial schema never defined
-- it. This adds the column, backfills it from auth.users for
-- any profile already created, and forces PostgREST to reload
-- its schema cache so the API picks it up immediately.
-- Run this in your Supabase SQL editor after 002.
-- ============================================================

alter table profiles add column if not exists email text;

-- Backfill existing profiles from their auth user
update profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and p.email is null;

-- Force PostgREST (the API layer) to pick up the new column
-- immediately instead of waiting for its next auto-reload.
notify pgrst, 'reload schema';
