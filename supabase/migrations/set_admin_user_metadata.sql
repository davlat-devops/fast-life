-- ─────────────────────────────────────────────────────────────────────────────
-- Set admin role metadata for the admin user
--
-- The is_admin() function and AdminLogin both check:
--   auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
--
-- This migration sets that metadata on the admin account so the check passes.
-- Run once in Supabase → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: verify the user exists and see their current metadata
SELECT
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE email = 'ulmasovdavlat7@gmail.com';

-- Step 2: stamp role = 'admin' onto their user_metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'ulmasovdavlat7@gmail.com';

-- Step 3: confirm the update
SELECT
  id,
  email,
  raw_user_meta_data ->> 'role' AS role
FROM auth.users
WHERE email = 'ulmasovdavlat7@gmail.com';

-- Step 4: quick smoke-test — sign in and call is_admin() in the dashboard
--   SELECT public.is_admin();   → should return true once signed in as this user
