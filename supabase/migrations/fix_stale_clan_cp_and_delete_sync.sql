-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: clans show stale CP totals (e.g. 48 / 18 / 15 / 15) with 0 members
--
-- Root cause
--   clans.total_cp is a CACHED column, kept in sync by sync_clan_cp_trigger,
--   which fires only on  INSERT / UPDATE OF cp, clan, is_active  on students.
--   There is no DELETE trigger. StudentManagement hard-deletes students
--   (delete().eq('id', id)); the students' cp_awards / cp_deductions / badges /
--   snapshots cascade away, but clans.total_cp is never recomputed — so the
--   deleted students' CP stays frozen in the cached total.
--
-- This migration
--   1. Adds recalculate_clan_totals() — recomputes every clan's total_cp from
--      its live active members (callable as an RPC for manual correction).
--   2. Runs it once now to clear the current stale totals.
--   3. Cleans up any orphaned cp_awards / cp_deductions rows (expected: none,
--      because of the ON DELETE CASCADE FKs — included as a safety net).
--   4. Adds an AFTER DELETE trigger on students so future deletes keep
--      clans.total_cp honest and it can't drift again.
--
-- Safe to run even if active students still exist: totals are DERIVED from live
-- member CP, so each clan is set to its correct current value, not a blind zero.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Recalculate function ----------------------------------------------------
--    Sets every clan's total_cp to the sum of its active members' CP.
create or replace function public.recalculate_clan_totals()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  update public.clans c
  set total_cp = coalesce((
    select sum(s.cp)
    from public.students s
    where s.clan = c.id and s.is_active
  ), 0);

  select jsonb_object_agg(id, total_cp) into v_result
  from public.clans;

  return jsonb_build_object('success', true, 'totals', v_result);
end;
$$;

-- 2) Clear the current stale totals now --------------------------------------
select public.recalculate_clan_totals();

-- 3) Clean up any genuinely orphaned CP rows (belt-and-suspenders) -----------
delete from public.cp_awards a
where not exists (select 1 from public.students s where s.id = a.student_id);

delete from public.cp_deductions d
where not exists (select 1 from public.students s where s.id = d.student_id);

-- 4) Close the drift at the source: recompute on DELETE ----------------------
create or replace function public.sync_clan_cp_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clans
  set total_cp = coalesce((
    select sum(cp)
    from public.students
    where clan = old.clan and is_active
  ), 0)
  where id = old.clan;

  return old;
end;
$$;

drop trigger if exists sync_clan_cp_delete_trigger on public.students;
create trigger sync_clan_cp_delete_trigger
  after delete on public.students
  for each row execute function public.sync_clan_cp_on_delete();
