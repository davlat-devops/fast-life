-- ─────────────────────────────────────────────────────────────────────────────
-- Run this in: Supabase Dashboard → SQL Editor → Run
--
-- What this does:
--   1. Adds ON DELETE CASCADE to cp_deductions.student_id so deleting a student
--      automatically removes their deduction records at the DB level.
--   2. Replaces monthly_reset() to also DELETE FROM cp_deductions in the purge
--      step (alongside the existing cp_awards purge).
--
-- Safe on a live database. Existing data is not touched.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add ON DELETE CASCADE to cp_deductions.student_id ────────────────────

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    WHERE tc.table_name      = 'cp_deductions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name    = 'student_id'
      AND tc.table_schema    = 'public'
  LOOP
    EXECUTE 'ALTER TABLE public.cp_deductions DROP CONSTRAINT ' || quote_ident(r.constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.cp_deductions
  ADD CONSTRAINT cp_deductions_student_id_fkey
  FOREIGN KEY (student_id)
  REFERENCES public.students(id)
  ON DELETE CASCADE;

-- ── 2. Replace monthly_reset() — adds cp_deductions purge in step e2 ────────

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

  -- e) end-of-month CP bonuses --------------------------------
  update public.students set cp = cp + 125 where id = v_top_student;
  insert into public.cp_awards (student_id, amount, reason, note)
  values (
    v_top_student, 125, 'end_of_month_1st',
    'Monthly bonus: #1 overall — ' || p_month || '/' || p_year
  );

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

  -- e2) purge all CP activity ---------------------------------
  delete from public.cp_awards;
  delete from public.cp_deductions;

  -- f) reset all CP to 0 ----------------------------------------
  update public.students set cp = 0 where is_active;

  -- f2) archive finalised attendance ----------------------------
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
