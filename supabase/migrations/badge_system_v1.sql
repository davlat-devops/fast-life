-- ─────────────────────────────────────────────────────────────────────────────
-- Badge System v1 — automatic badge triggers
--
-- Creates two trigger functions:
--   badge_on_cp_award           — fires AFTER INSERT on cp_awards
--   badge_on_attendance_finalise — fires AFTER UPDATE on attendance
--
-- Automatic badges:
--   clan        — first CP award ever for a student
--   first       — monthly CP total reaches 50
--   fast        — monthly CP total reaches 100
--   perfect     — monthly CP total reaches 150
--   champion    — cp_awards INSERT with reason 'competition_1st'
--   regular     — 5th present+finalised attendance (all-time)
--   dedicated   — 20th present+finalised attendance (all-time)
--   event_machine — 30th present+finalised attendance (all-time)
--   competition — first Competition event attended this month
--
-- All awards use ON CONFLICT DO NOTHING — badges are never duplicated.
-- No CP side effects from any badge.
-- Trigger functions are SECURITY DEFINER to bypass RLS.
--
-- Run once in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CP award trigger ───────────────────────────────────────────────────────

create or replace function public.badge_on_cp_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monthly_total integer;
  v_award_count   integer;
begin
  -- Sum of cp_awards for this student (current month only — purged at reset)
  select coalesce(sum(amount), 0) into v_monthly_total
  from public.cp_awards
  where student_id = new.student_id;

  -- clan: first CP award ever (count = 1 after AFTER INSERT)
  select count(*) into v_award_count
  from public.cp_awards
  where student_id = new.student_id;

  if v_award_count = 1 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'clan')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- first: monthly CP reaches 50
  if v_monthly_total >= 50 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'first')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- fast: monthly CP reaches 100
  if v_monthly_total >= 100 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'fast')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- perfect: monthly CP reaches 150
  if v_monthly_total >= 150 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'perfect')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- champion: won first place in a competition
  if new.reason = 'competition_1st' then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'champion')
    on conflict (student_id, badge_key) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists badge_on_cp_award_trigger on public.cp_awards;
create trigger badge_on_cp_award_trigger
  after insert on public.cp_awards
  for each row execute function public.badge_on_cp_award();


-- ── 2. Attendance finalise trigger ───────────────────────────────────────────

create or replace function public.badge_on_attendance_finalise()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_attended  integer;
  v_event_category  text;
  v_comp_this_month integer;
begin
  -- Only fire when a row becomes present+finalised
  if old.finalised = true or not new.finalised or not new.present then
    return new;
  end if;

  -- Count all-time present+finalised attendances for this student
  -- (AFTER UPDATE: current row is already committed so it is included)
  select count(*) into v_total_attended
  from public.attendance
  where student_id = new.student_id
    and present    = true
    and finalised  = true;

  -- regular: 5th attendance
  if v_total_attended >= 5 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'regular')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- dedicated: 20th attendance
  if v_total_attended >= 20 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'dedicated')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- event_machine: 30th attendance
  if v_total_attended >= 30 then
    insert into public.badges (student_id, badge_key)
    values (new.student_id, 'event_machine')
    on conflict (student_id, badge_key) do nothing;
  end if;

  -- competition: first Competition category event attended this month
  select e.category into v_event_category
  from public.events e
  where e.id = new.event_id;

  if v_event_category = 'Competition' then
    select count(*) into v_comp_this_month
    from public.attendance a
    join public.events e on e.id = a.event_id
    where a.student_id = new.student_id
      and a.present    = true
      and a.finalised  = true
      and a.archived   = false
      and e.category   = 'Competition'
      and date_trunc('month', e.event_date) = date_trunc('month', now());

    if v_comp_this_month = 1 then
      insert into public.badges (student_id, badge_key)
      values (new.student_id, 'competition')
      on conflict (student_id, badge_key) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists badge_on_attendance_finalise_trigger on public.attendance;
create trigger badge_on_attendance_finalise_trigger
  after update of finalised on public.attendance
  for each row execute function public.badge_on_attendance_finalise();
