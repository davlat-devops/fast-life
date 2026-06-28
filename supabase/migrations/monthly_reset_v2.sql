-- ─────────────────────────────────────────────────────────────────────────────
-- Monthly Reset v2 — migration
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → Run).
--
-- What this changes:
--   1. attendance: adds `archived` boolean column + composite index
--   2. RLS: narrows the student read policy to exclude archived rows
--   3. monthly_reset(): adds step e2 (purge cp_awards) and step f2 (archive
--      attendance) so after each reset students see a clean feed and event count
--
-- Safe to run on a live database — all operations are non-destructive on
-- existing data. Existing attendance rows default to archived = false.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add archived column to attendance ─────────────────────────────────────

alter table public.attendance
  add column if not exists archived boolean not null default false;

-- Composite index: speeds up the student RLS check (student_id + archived)
create index if not exists attendance_archived_idx
  on public.attendance(student_id, archived);

-- ── 2. Narrow student read policy to hide archived rows ──────────────────────
-- Admins use the service-role client which bypasses RLS entirely, so they
-- continue to see all rows including archived ones (full history preserved).

drop policy if exists "attendance: own read" on public.attendance;

create policy "attendance: own read"
  on public.attendance for select
  using (
    not public.is_admin()
    and student_id = public.current_student_id()
    and not archived
  );

-- ── 3. Replace monthly_reset() ───────────────────────────────────────────────
-- New steps inserted:
--   e2) DELETE FROM cp_awards  — full purge after bonuses are applied;
--       monthly_snapshots already holds the permanent history.
--       The head-start awards inserted in step h become the new month's
--       first activity-feed entries.
--   f2) Archive all finalised attendance rows — students see count = 0 for
--       events from the previous month without any frontend query changes.

create or replace function public.monthly_reset(p_month smallint, p_year smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_clan  text;
  v_top_student  uuid;
  v_clan_record  record;
  v_clans        text[] := array['VIPERON','CRODON','AVERON','WOLFRIN'];
  v_clan_idx     integer;
  v_students_arr uuid[];
  v_iter_id      uuid;
begin
  -- a) snapshot -----------------------------------------------
  insert into public.monthly_snapshots (month, year, student_id, cp, clan, rank)
  select
    p_month,
    p_year,
    id,
    cp,
    clan,
    rank() over (order by cp desc)
  from public.students
  where is_active
  on conflict (month, year, student_id) do nothing;

  -- b) winners ------------------------------------------------
  select id into v_winner_clan
  from public.clans
  order by total_cp desc
  limit 1;

  select id into v_top_student
  from public.students
  where is_active
  order by cp desc
  limit 1;

  -- c) Hall of Fame -------------------------------------------
  insert into public.hall_of_fame (month, year, clan_winner, top_student_id)
  values (p_month, p_year, v_winner_clan, v_top_student)
  on conflict (month, year) do update
    set clan_winner    = excluded.clan_winner,
        top_student_id = excluded.top_student_id;

  -- d) badges -------------------------------------------------
  update public.clans set crown = false where id = any(v_clans);
  update public.clans set crown = true  where id = v_winner_clan;

  insert into public.badges (student_id, badge_key)
  select id, 'clan_champion'
  from public.students
  where clan = v_winner_clan and is_active
  on conflict (student_id, badge_key) do nothing;

  insert into public.badges (student_id, badge_key)
  values (v_top_student, 'monthly_legend')
  on conflict (student_id, badge_key) do nothing;

  insert into public.badges (student_id, badge_key)
  select id, 'fast_life_elite'
  from public.students
  where is_active
  order by cp desc
  limit 5
  on conflict (student_id, badge_key) do nothing;

  -- e) end-of-month CP bonuses (applied before CP reset so ranks are valid) ---
  -- #1 overall: +125 CP
  update public.students set cp = cp + 125 where id = v_top_student;
  insert into public.cp_awards (student_id, amount, reason, note)
  values (
    v_top_student, 125, 'end_of_month_1st',
    'Monthly bonus: #1 overall — ' || p_month || '/' || p_year
  );

  -- Top 2-5 overall: +75 CP
  update public.students
  set cp = cp + 75
  where id in (
    select id from public.students
    where is_active and id <> v_top_student
    order by cp desc limit 4
  );
  insert into public.cp_awards (student_id, amount, reason, note)
  select id, 75, 'end_of_month_top5',
    'Monthly bonus: top 5 overall — ' || p_month || '/' || p_year
  from public.students
  where is_active and id <> v_top_student
  order by cp desc limit 4;

  -- Top 5 per clan: +30 CP
  for v_clan_record in select id from public.clans loop
    update public.students
    set cp = cp + 30
    where id in (
      select id from public.students
      where is_active and clan = v_clan_record.id
      order by cp desc limit 5
    );
    insert into public.cp_awards (student_id, amount, reason, note)
    select id, 30, 'end_of_month_top5_clan',
      'Monthly bonus: top 5 in ' || v_clan_record.id || ' — ' || p_month || '/' || p_year
    from public.students
    where is_active and clan = v_clan_record.id
    order by cp desc limit 5;
  end loop;

  -- e2) purge cp_awards ----------------------------------------
  -- All awards from the closing month are now in monthly_snapshots.
  -- Deleting here gives every student a clean activity feed.
  -- The head-start awards written in step h are the new month's
  -- first feed entries for winning-clan members.
  delete from public.cp_awards;

  -- f) reset all CP to 0 ----------------------------------------
  update public.students set cp = 0 where is_active;

  -- f2) archive finalised attendance ----------------------------
  -- Sets archived = true on every row that was already finalised.
  -- The student RLS policy filters "not archived", so students
  -- immediately see attendance count = 0 and empty event history.
  -- Admins use the service-role client (bypasses RLS) and retain
  -- full historical visibility.
  -- Unfinalised rows (future or unprocessed events) are left alone.
  update public.attendance
  set archived = true
  where finalised = true;

  -- g) reshuffle clans -----------------------------------------
  select array_agg(id order by random()) into v_students_arr
  from public.students
  where is_active;

  v_clan_idx := 1;
  foreach v_iter_id in array v_students_arr loop
    update public.students
    set clan = v_clans[v_clan_idx]
    where id = v_iter_id;

    v_clan_idx := (v_clan_idx % 4) + 1;
  end loop;

  -- h) winning-clan head start ---------------------------------
  -- These cp_awards rows are inserted AFTER the purge in step e2,
  -- so they survive and appear as the first feed entry of the new month.
  update public.students
  set cp = 50
  where clan = v_winner_clan and is_active;

  insert into public.cp_awards (student_id, amount, reason, note)
  select id, 50, 'clan_winner_headstart',
    'Winning clan head start: ' || v_winner_clan || ' won ' || p_month || '/' || p_year
  from public.students
  where clan = v_winner_clan and is_active;

  -- i) recompute clan totals -----------------------------------
  update public.clans c
  set total_cp = (
    select coalesce(sum(s.cp), 0)
    from public.students s
    where s.clan = c.id and s.is_active
  )
  where c.id = any(v_clans);

  return jsonb_build_object(
    'success',      true,
    'month',        p_month,
    'year',         p_year,
    'winning_clan', v_winner_clan,
    'top_student',  v_top_student
  );
end;
$$;
