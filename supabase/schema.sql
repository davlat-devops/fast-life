-- =============================================================
-- Fast Life · Fast Education · Supabase Schema + RLS
-- =============================================================
-- Dependency order:
--   1. Extensions
--   2. Tables  (clans → students → events → attendance →
--               cp_awards → badges → hall_of_fame →
--               monthly_snapshots → event_interest)
--   3. Seed data
--   4. Indexes
--   5. Functions  (helpers, trigger fns, stored procs)
--   6. Triggers
--   7. RLS enable + policies
--   8. Grants
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────

-- 2.1 clans --------------------------------------------------
create table if not exists public.clans (
  id            text        primary key,   -- 'VIPERON' | 'CRODON' | 'AVERON' | 'WOLFRIN'
  name          text        not null,
  mascot        text        not null,
  color_primary text        not null,
  color_bg      text        not null,
  total_cp      integer     not null default 0,
  crown         boolean     not null default false,   -- true = last month's winning clan
  updated_at    timestamptz not null default now()
);

-- 2.2 students -----------------------------------------------
create table if not exists public.students (
  id            uuid        primary key default gen_random_uuid(),
  auth_user_id  uuid        unique references auth.users(id) on delete set null,
  full_name     text        not null,
  age           smallint    not null check (age > 0 and age < 100),
  level         text        not null check (level in ('A1','A2','B1','B2','C1','C2')),
  phone         text        not null,
  class_group   text        not null,
  clan          text        not null references public.clans(id),
  cp            integer     not null default 0 check (cp >= 0),
  username      text        not null unique,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2.3 events -------------------------------------------------
create table if not exists public.events (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  category    text        not null check (category in
                ('English','IELTS','Competition','Volunteer','Korean','Russian','Math')),
  event_date  date        not null,
  event_time  time,
  room        text,
  cp_value    integer     not null default 20 check (cp_value >= 0),
  finalised   boolean     not null default false,
  created_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 2.4 attendance ---------------------------------------------
create table if not exists public.attendance (
  id          uuid        primary key default gen_random_uuid(),
  event_id    uuid        not null references public.events(id)   on delete cascade,
  student_id  uuid        not null references public.students(id) on delete cascade,
  present     boolean     not null default false,
  cp_awarded  integer     not null default 0,
  finalised   boolean     not null default false,
  marked_at   timestamptz,
  unique(event_id, student_id)
);

-- 2.5 cp_awards (manual + auto audit log) -------------------
create table if not exists public.cp_awards (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students(id) on delete cascade,
  amount      integer     not null check (amount > 0),
  reason      text        not null,
  note        text        not null check (length(trim(note)) > 0),
  awarded_by  uuid        references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 2.6 badges -------------------------------------------------
create table if not exists public.badges (
  id          uuid        primary key default gen_random_uuid(),
  student_id  uuid        not null references public.students(id) on delete cascade,
  badge_key   text        not null,
  earned_at   timestamptz not null default now(),
  unique(student_id, badge_key)
);

-- 2.7 hall_of_fame -------------------------------------------
create table if not exists public.hall_of_fame (
  id             uuid        primary key default gen_random_uuid(),
  month          smallint    not null check (month between 1 and 12),
  year           smallint    not null,
  clan_winner    text        references public.clans(id),
  top_student_id uuid        references public.students(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique(month, year)
);

-- 2.8 monthly_snapshots --------------------------------------
create table if not exists public.monthly_snapshots (
  id          uuid        primary key default gen_random_uuid(),
  month       smallint    not null check (month between 1 and 12),
  year        smallint    not null,
  student_id  uuid        not null references public.students(id) on delete cascade,
  cp          integer     not null default 0,
  clan        text        not null references public.clans(id),
  rank        integer,
  created_at  timestamptz not null default now(),
  unique(month, year, student_id)
);

-- 2.9 event_interest -----------------------------------------
create table if not exists public.event_interest (
  id          uuid        primary key default gen_random_uuid(),
  event_id    uuid        not null references public.events(id)   on delete cascade,
  student_id  uuid        not null references public.students(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(event_id, student_id)
);

-- ─────────────────────────────────────────────────────────────
-- 3. SEED DATA
-- ─────────────────────────────────────────────────────────────
insert into public.clans (id, name, mascot, color_primary, color_bg)
values
  ('VIPERON', 'Viperon', 'snake',  '#4A7C3F', '#8B7355'),
  ('CRODON',  'Crodon',  'dragon', '#A0A0A0', '#0D0D0D'),
  ('AVERON',  'Averon',  'eagle',  '#C9A227', '#0A1628'),
  ('WOLFRIN', 'Wolfrin', 'wolf',   '#C0C0C0', '#8B0000')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────────────────────
create index if not exists students_clan_idx       on public.students(clan);
create index if not exists students_cp_idx         on public.students(cp desc);
create index if not exists events_date_idx         on public.events(event_date desc);
create index if not exists attendance_event_idx    on public.attendance(event_id);
create index if not exists attendance_student_idx  on public.attendance(student_id);
create index if not exists cp_awards_student_idx   on public.cp_awards(student_id);
create index if not exists badges_student_idx      on public.badges(student_id);
create index if not exists snapshots_month_year_idx on public.monthly_snapshots(year, month);

-- ─────────────────────────────────────────────────────────────
-- 5. FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- 5.1 Helper: is the current request from an admin?
--     Admins are Supabase Auth users with user_metadata->>'role' = 'admin'.
--     Defined in public — Supabase forbids creating functions in auth schema.
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 5.2 Helper: resolve auth.uid() → students.id for the current user
create or replace function public.current_student_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select id
  from public.students
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- 5.3 Trigger fn: maintain updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 5.4 Trigger fn: keep clans.total_cp in sync with students.cp
create or replace function public.sync_clan_cp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and old.clan <> new.clan then
    -- student moved clan: recompute the old clan total too
    update public.clans
    set total_cp = (
      select coalesce(sum(cp), 0)
      from public.students
      where clan = old.clan and is_active
    )
    where id = old.clan;
  end if;

  update public.clans
  set total_cp = (
    select coalesce(sum(cp), 0)
    from public.students
    where clan = new.clan and is_active
  )
  where id = new.clan;

  return new;
end;
$$;

-- 5.5 Trigger fn: award CP when an attendance row is finalised
create or replace function public.finalise_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
begin
  -- only fires when finalised flips false → true
  if old.finalised = true or new.finalised = false then
    return new;
  end if;

  select * into v_event from public.events where id = new.event_id;

  if new.present then
    update public.students
    set cp = cp + v_event.cp_value
    where id = new.student_id;

    insert into public.cp_awards (student_id, amount, reason, note, awarded_by)
    values (
      new.student_id,
      v_event.cp_value,
      'attendance',
      'Auto-awarded: attended "' || v_event.title || '"',
      v_event.created_by
    );

    new.cp_awarded = v_event.cp_value;
  end if;

  return new;
end;
$$;

-- 5.6 Trigger fn: prevent un-finalising or double-finalising attendance
create or replace function public.prevent_refinalise()
returns trigger
language plpgsql
as $$
begin
  if old.finalised = true and new.finalised = false then
    raise exception 'Finalised attendance cannot be undone.';
  end if;
  if old.finalised = true and new.finalised = true then
    raise exception 'Attendance for this event has already been finalised.';
  end if;
  return new;
end;
$$;

-- 5.7 Trigger fn: apply a manual cp_award to the student's CP total
--     Skips rows with reason = 'attendance' because finalise_attendance
--     already updates students.cp directly.
create or replace function public.apply_cp_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.students
  set cp = cp + new.amount
  where id = new.student_id;
  return new;
end;
$$;

-- 5.8 Stored procedure: monthly_reset
--     Call from the admin UI after typed confirmation.
--     Order of operations:
--       a) snapshot CP + rank
--       b) find winning clan + top student
--       c) write Hall of Fame
--       d) award badges (clan_champion, monthly_legend, fast_life_elite)
--       e) apply end-of-month CP bonuses  (pre-reset, so rank is still known)
--       f) reset all CP to 0
--       g) randomly reshuffle clans
--       h) give winning-clan head start to their new clan members
--       i) recompute clan totals
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
  v_iter_id      uuid;   -- loop variable — separate from v_top_student
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
  update public.clans set crown = true where id = v_winner_clan;

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

  -- f) reset CP -----------------------------------------------
  update public.students set cp = 0 where is_active;

  -- g) reshuffle clans ----------------------------------------
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

  -- h) winning-clan head start --------------------------------
  update public.students
  set cp = 50
  where clan = v_winner_clan and is_active;

  insert into public.cp_awards (student_id, amount, reason, note)
  select id, 50, 'clan_winner_headstart',
    'Winning clan head start: ' || v_winner_clan || ' won ' || p_month || '/' || p_year
  from public.students
  where clan = v_winner_clan and is_active;

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

-- 5.9 Utility: generate a unique username + temp password for a new student
create or replace function public.generate_student_credentials(p_full_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base     text;
  v_username text;
  v_suffix   integer := 0;
  v_password text;
begin
  v_base := lower(regexp_replace(trim(p_full_name), '[^a-zA-Z0-9 ]', '', 'g'));
  v_base := regexp_replace(v_base, '\s+', '.', 'g');

  v_username := v_base;
  loop
    exit when not exists (select 1 from public.students where username = v_username);
    v_suffix   := v_suffix + 1;
    v_username := v_base || v_suffix::text;
  end loop;

  -- 8-char password from a random UUID (no pgcrypto needed)
  v_password := substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  return jsonb_build_object(
    'username', v_username,
    'password', v_password
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. TRIGGERS
-- ─────────────────────────────────────────────────────────────
drop trigger if exists students_updated_at        on public.students;
create trigger students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

drop trigger if exists clans_updated_at           on public.clans;
create trigger clans_updated_at
  before update on public.clans
  for each row execute function public.set_updated_at();

drop trigger if exists sync_clan_cp_trigger       on public.students;
create trigger sync_clan_cp_trigger
  after insert or update of cp, clan, is_active on public.students
  for each row execute function public.sync_clan_cp();

-- prevent_refinalise must fire BEFORE finalise_attendance so the
-- guard runs first and the CP award only happens on a valid transition.
drop trigger if exists prevent_refinalise_trigger on public.attendance;
create trigger prevent_refinalise_trigger
  before update of finalised on public.attendance
  for each row execute function public.prevent_refinalise();

drop trigger if exists finalise_attendance_trigger on public.attendance;
create trigger finalise_attendance_trigger
  before update of finalised on public.attendance
  for each row execute function public.finalise_attendance();

-- only fires for non-attendance rows (attendance trigger updates cp directly)
drop trigger if exists apply_cp_award_trigger     on public.cp_awards;
create trigger apply_cp_award_trigger
  after insert on public.cp_awards
  for each row
  when (new.reason <> 'attendance')
  execute function public.apply_cp_award();

-- ─────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.clans             enable row level security;
alter table public.students          enable row level security;
alter table public.events            enable row level security;
alter table public.attendance        enable row level security;
alter table public.cp_awards         enable row level security;
alter table public.badges            enable row level security;
alter table public.hall_of_fame      enable row level security;
alter table public.monthly_snapshots enable row level security;
alter table public.event_interest    enable row level security;

-- ── clans ────────────────────────────────────────────────────
-- Public read (leaderboard visible to all). Admin-only write.

create policy "clans: public read"
  on public.clans for select
  using (true);

create policy "clans: admin write"
  on public.clans for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── students ─────────────────────────────────────────────────
-- Admins: full access.
-- Students: read own row only. Cannot mutate student rows.

create policy "students: admin all"
  on public.students for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "students: own row read"
  on public.students for select
  using (
    not public.is_admin()
    and auth_user_id = auth.uid()
  );

-- Allows students to see other students for leaderboard + clan pages.
-- Rows for all active students are visible; phone/age/class_group are
-- exposed at the row level (PostgreSQL RLS cannot restrict columns).
create policy "students: authenticated read"
  on public.students for select
  using (auth.uid() is not null);

-- ── events ───────────────────────────────────────────────────
-- All authenticated users read. Admins write.

create policy "events: authenticated read"
  on public.events for select
  using (auth.uid() is not null);

create policy "events: admin write"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── attendance ───────────────────────────────────────────────
-- Admins: full access.
-- Students: read own rows (event history). Cannot write.

create policy "attendance: admin all"
  on public.attendance for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "attendance: own read"
  on public.attendance for select
  using (
    not public.is_admin()
    and student_id = public.current_student_id()
  );

-- ── cp_awards ────────────────────────────────────────────────
-- Admins: full access.
-- Students: read own rows (activity feed). Cannot write.

create policy "cp_awards: admin all"
  on public.cp_awards for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "cp_awards: own read"
  on public.cp_awards for select
  using (
    not public.is_admin()
    and student_id = public.current_student_id()
  );

-- ── badges ───────────────────────────────────────────────────
-- All authenticated users read (leaderboard). Admins write.

create policy "badges: authenticated read"
  on public.badges for select
  using (auth.uid() is not null);

create policy "badges: admin write"
  on public.badges for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── hall_of_fame ─────────────────────────────────────────────
-- Public read. Admin write.

create policy "hall_of_fame: public read"
  on public.hall_of_fame for select
  using (true);

create policy "hall_of_fame: admin write"
  on public.hall_of_fame for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── monthly_snapshots ────────────────────────────────────────
-- All authenticated users read. Admin write.

create policy "snapshots: authenticated read"
  on public.monthly_snapshots for select
  using (auth.uid() is not null);

create policy "snapshots: admin write"
  on public.monthly_snapshots for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── event_interest ───────────────────────────────────────────
-- Admins read all. Students read/insert/delete own rows only.

create policy "interest: admin read"
  on public.event_interest for select
  using (public.is_admin());

create policy "interest: own read"
  on public.event_interest for select
  using (
    not public.is_admin()
    and student_id = public.current_student_id()
  );

create policy "interest: student insert"
  on public.event_interest for insert
  with check (
    not public.is_admin()
    and student_id = public.current_student_id()
  );

create policy "interest: student delete"
  on public.event_interest for delete
  using (
    not public.is_admin()
    and student_id = public.current_student_id()
  );

-- ─────────────────────────────────────────────────────────────
-- 8. GRANTS
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select                         on public.clans             to anon, authenticated;
grant update                         on public.clans             to authenticated;

grant select, insert, update, delete on public.students          to authenticated;
grant select, insert, update, delete on public.events            to authenticated;
grant select, insert, update, delete on public.attendance        to authenticated;
grant select, insert                 on public.cp_awards         to authenticated;
grant select, insert                 on public.badges            to authenticated;
grant select, insert, update         on public.hall_of_fame      to anon, authenticated;
grant select, insert                 on public.monthly_snapshots to authenticated;
grant select, insert, delete         on public.event_interest    to authenticated;

grant execute on function public.is_admin()                          to anon, authenticated;
grant execute on function public.current_student_id()                to authenticated;
grant execute on function public.monthly_reset(smallint, smallint)   to authenticated;
grant execute on function public.generate_student_credentials(text)  to authenticated;
