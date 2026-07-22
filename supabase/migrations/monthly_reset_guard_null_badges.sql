-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: monthly_reset() crashes with
--   null value in column "student_id" of relation "badges"
--   violates not-null constraint
--
-- Root cause
--   When the students table has no active rows, `select id into v_top_student
--   ... limit 1` leaves v_top_student NULL. The 'monthly_legend' badge is
--   inserted with VALUES (v_top_student, ...) — an unguarded scalar — so it
--   tries to insert (NULL, 'monthly_legend') and violates badges.student_id
--   NOT NULL. (The clan_champion / fast_life_elite inserts are SELECT-based and
--   simply insert zero rows, so they were never the problem.)
--
--   This guard was present in monthly_reset_fix_null_top_student.sql but was
--   clobbered by two later migrations (remove_monthly_cp_bonuses.sql,
--   fix_delete_where_in_reset.sql) that were derived from an older copy.
--
-- What this migration does
--   1. No-ops cleanly when there are zero active students — returns a success
--      payload with noop=true and zero counts, writing nothing, instead of
--      crashing on the NULL badge insert.
--   2. Guards every badge insert so student_id can never be NULL.
--   3. Wraps unexpected failures so the UI never sees a raw Postgres message.
--
-- Atomicity
--   A plpgsql function runs inside the caller's transaction: any RAISE aborts
--   and rolls back every statement in the body — there is no half-applied
--   state. The EXCEPTION block below re-raises (does not swallow), so this
--   atomicity is preserved.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.monthly_reset(p_month smallint, p_year smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_clan   text;
  v_top_student   uuid;
  v_active_count  integer;
  v_badges_count  integer := 0;
  v_clans         text[] := array['VIPERON','CRODON','AVERON','WOLFRIN'];
  v_clan_idx      integer;
  v_students_arr  uuid[];
  v_iter_id       uuid;
begin
  -- 0) precondition: with no active students a reset is a no-op ----
  --    Return success without writing anything, rather than crashing on the
  --    NULL badge insert further down.
  select count(*) into v_active_count
  from public.students
  where is_active;

  if v_active_count = 0 then
    return jsonb_build_object(
      'success',        true,
      'noop',           true,
      'month',          p_month,
      'year',           p_year,
      'winning_clan',   null,
      'top_student',    null,
      'students_reset', 0,
      'badges_awarded', 0
    );
  end if;

  -- a) snapshot current CP + rank before reset ----------------
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

  -- b) determine winners (used for Hall of Fame + badges) -----
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

  -- d) badges — no CP awarded; badges only --------------------
  --    Every insert below is guarded so student_id is never NULL.
  update public.clans set crown = false where id = any(v_clans);
  update public.clans set crown = true  where id = v_winner_clan;

  -- Step 3: Winning Clan — skip entirely if no winning clan resolved
  if v_winner_clan is not null then
    with ins as (
      insert into public.badges (student_id, badge_key)
      select id, 'clan_champion'
      from public.students
      where clan = v_winner_clan and is_active
      on conflict (student_id, badge_key) do nothing
      returning 1
    )
    select v_badges_count + count(*) into v_badges_count from ins;
  end if;

  -- Steps 1 & 2: Student of the Month + Top 5 — require a real top student
  if v_top_student is not null then
    -- Step 1: Student of the Month
    insert into public.badges (student_id, badge_key)
    values (v_top_student, 'monthly_legend')
    on conflict (student_id, badge_key) do nothing;

    -- Step 2: Top 5 Overall
    with ins as (
      insert into public.badges (student_id, badge_key)
      select id, 'fast_life_elite'
      from public.students
      where is_active
      order by cp desc
      limit 5
      on conflict (student_id, badge_key) do nothing
      returning 1
    )
    select v_badges_count + 1 + count(*) into v_badges_count from ins;
  end if;

  -- e) [REMOVED] end-of-month CP bonuses ----------------------
  -- All CP must come from explicit admin awards only.

  -- e2) purge all CP activity ---------------------------------
  -- WHERE true satisfies Supabase's unconditional-DELETE guard.
  delete from public.cp_awards     where true;
  delete from public.cp_deductions where true;

  -- f) reset all CP to 0 --------------------------------------
  update public.students set cp = 0 where is_active;

  -- f2) archive finalised attendance --------------------------
  update public.attendance
  set archived = true
  where finalised = true;

  -- g) reshuffle clans randomly --------------------------------
  select array_agg(id order by random()) into v_students_arr
  from public.students
  where is_active;

  v_clan_idx := 1;
  foreach v_iter_id in array coalesce(v_students_arr, '{}') loop
    update public.students
    set clan = v_clans[v_clan_idx]
    where id = v_iter_id;

    v_clan_idx := (v_clan_idx % 4) + 1;
  end loop;

  -- h) [REMOVED] winning-clan head start ----------------------

  -- i) recompute clan totals ----------------------------------
  update public.clans c
  set total_cp = (
    select coalesce(sum(s.cp), 0)
    from public.students s
    where s.clan = c.id and s.is_active
  )
  where c.id = any(v_clans);

  return jsonb_build_object(
    'success',        true,
    'month',          p_month,
    'year',           p_year,
    'winning_clan',   v_winner_clan,
    'top_student',    v_top_student,
    'students_reset', v_active_count,
    'badges_awarded', v_badges_count
  );

exception
  -- Any failure: the whole function has already rolled back. Surface a clean,
  -- stable message to the client instead of a raw Postgres error.
  when others then
    raise exception 'Monthly reset failed and was rolled back. No changes were applied.'
      using errcode = 'P0001', hint = 'reset_failed';
end;
$$;
