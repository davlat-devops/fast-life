-- Fix is_admin() to read raw_user_meta_data from auth.users directly
-- instead of from the JWT claims. JWT claims can be stale (issued before
-- admin role was set), but the DB is always authoritative.

create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce(
    (select raw_user_meta_data->>'role' = 'admin'
     from auth.users
     where id = auth.uid()),
    false
  );
$$;
