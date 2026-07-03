-- ─────────────────────────────────────────────────────────────────────────────
-- Drop plaintext password storage from public.students
--
-- The "students: authenticated read" RLS policy (schema.sql) grants any
-- authenticated user select access to every row in public.students, since
-- Postgres RLS cannot restrict individual columns. That meant any signed-in
-- student could query the table directly and read the password_plain column
-- for every other student — a full plaintext credential leak. Passwords are
-- already managed by Supabase Auth; this column was redundant and insecure.
--
-- Run once in Supabase → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.students drop column if exists password_plain;
