-- ─────────────────────────────────────────────────────────────────────────────
-- Remove automatic end-of-month CP bonuses from monthly_reset()
--
-- Previously step e awarded CP before the reset:
--   +125 CP  — #1 student overall
--   +75 CP   — students ranked 2–5 overall
--   +30 CP   — top 5 students per clan
--
-- These bonuses were applied BEFORE step f (cp reset to 0), meaning they
-- were immediately erased and had no lasting effect. This migration removes
-- step e entirely so the function matches the actual behaviour: all CP is
-- zeroed at reset and new CP only comes from explicit admin awards.
--
-- Badges (clan_champion, monthly_legend, fast_life_elite) are unchanged —
-- they are still assigned; they just carry no automatic CP side-effect.
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
  v_winner_clan  text;
  v_top_student  uuid;
  v_clans        text[] := array['VIPERON','CRODON','AVERON','WOLFRIN'];
  v_clan_idx     integer;
  v_students_arr uuid[];
  v_iter_id      uuid;
begin
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

  -- e) [REMOVED] end-of-month CP bonuses ----------------------
  -- +125 CP for #1, +75 for top 2–5, +30 for top 5 per clan.
  -- All CP must come from explicit admin awards only.

  -- e2) purge all CP activity ---------------------------------
  delete from public.cp_awards;
  delete from public.cp_deductions;

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
  foreach v_iter_id in array v_students_arr loop
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
    'success',      true,
    'month',        p_month,
    'year',         p_year,
    'winning_clan', v_winner_clan,
    'top_student',  v_top_student
  );
end;
$$;
