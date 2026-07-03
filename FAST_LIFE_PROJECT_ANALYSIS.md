# Fast Life — Complete Project Analysis

> Generated: 2026-06-30  
> Production: <https://fast-life-tau.vercel.app>  
> Supabase project: `<redacted>`  
> Git remote: `https://github.com/davlat-devops/fast-life.git`

---

## 1. Project Overview

Fast Life is a gamified school management system built for **Fast Education**, a language school. Students earn **Championship Points (CP)** by attending events, winning competitions, volunteering, and through peer recognition. CP rolls up to four competing **clans** (VIPERON, CRODON, AVERON, WOLFRIN). Each month ends with a reset cycle: a winning clan and top student are recorded in the Hall of Fame, badges are awarded, CP is zeroed, clans are reshuffled randomly, and the winning clan gets a +50 CP head start for the new month.

There are two completely separate user experiences on the same domain:

| Portal | URL prefix | Users |
|---|---|---|
| Admin panel | `/admin/*` | School staff / administrators |
| Student portal | `/dashboard`, `/clan`, `/events`, `/leaderboard`, `/profile` | Enrolled students |

---

## 2. Tech Stack

### Frontend

| Library | Version |
|---|---|
| React | 19.2.7 |
| React Router DOM | 7.18.0 |
| Vite | 8.1.0 |
| Tailwind CSS | 4.3.1 |
| Framer Motion | 12.42.0 |
| Lucide React | 1.22.0 |
| @supabase/supabase-js | 2.108.2 |

### Build / Dev

| Tool | Version |
|---|---|
| @vitejs/plugin-react | 6.0.2 |
| oxlint | 1.69.0 |
| sharp | 0.35.2 (Vite image optimisation) |

### Backend (Supabase)

- **Database**: PostgreSQL 15 via Supabase (hosted)
- **Auth**: Supabase Auth (email + password, JWT with `user_metadata.role`)
- **RLS**: Row Level Security enabled on all 9 tables
- **Edge Functions**: Deno runtime, two functions deployed
- **Storage**: Not used

### Hosting

- **Frontend**: Vercel (SPA mode with catch-all rewrite)
- **Backend**: Supabase managed cloud

---

## 3. Architecture

### Supabase clients

Two **completely independent** Supabase JS clients are created in `src/lib/supabase.js`. They share the same Supabase URL and anon key but use different `auth.storageKey` values so their sessions never collide in `localStorage`:

```js
// Student portal auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'fl-student' }
})

// Admin portal auth
export const supabaseAdminAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'fl-admin' }
})
```

`VITE_SUPABASE_SERVICE_ROLE_KEY` is **never** used in frontend code. Admin operations that require elevated privileges are routed through Edge Functions.

### Context providers

`src/App.jsx` wraps the entire tree with both providers, completely independently:

```
<AuthProvider>           ← student auth (supabase client, storageKey: fl-student)
  <AdminAuthProvider>    ← admin auth  (supabaseAdminAuth client, storageKey: fl-admin)
    <ToastProvider>
      <Router>
        ...routes
      </Router>
    </ToastProvider>
  </AdminAuthProvider>
</AuthProvider>
```

Both contexts expose `{ session, user, isAdmin/isStudent, loading, signIn, signOut }`. `session` starts as `undefined` (loading), resolves to `null` (no session) or a session object. `loading` is `true` only when `session === undefined`.

### Routing

All routes live in `src/App.jsx`. Admin routes are wrapped by `AdminLayout` which enforces authentication. Student routes are wrapped by `StudentLayout`.

```
/admin/login          → AdminLogin         (GuestAdminRoute — redirects to dashboard if already authed)
/admin/dashboard      → AdminDashboard
/admin/students       → StudentManagement
/admin/events         → EventManagement
/admin/cp             → CpAwards
/admin/rankings       → Rankings
/admin/reset          → MonthlyReset
/admin/admins         → AdminManagement
/admin/audit-log      → AuditLog

/login                → StudentLogin       (GuestStudentRoute)
/dashboard            → StudentDashboard
/clan                 → ClanPage
/events               → EventsPage
/leaderboard          → LeaderboardPage
/profile              → ProfilePage
```

`GuestAdminRoute` and `GuestStudentRoute` in `src/components/ui/ProtectedRoute.jsx` show a `FullPageLoader` during the initial auth resolution then redirect authenticated users away from guest-only pages. There is no explicit `AdminRoute` wrapper in `App.jsx` — the guard lives inside `AdminLayout` itself (`if (!session || !isAdmin) return <Navigate to="/admin/login" replace />`).

### Edge Functions

Two Supabase Edge Functions handle operations that require the service role:

| Function | Version | Purpose |
|---|---|---|
| `admin-operations` | v3 | Delete auth user, reset password, list/create/delete admin users |
| `create-student` | v4 | Create a new Supabase Auth user for a student |

The frontend calls them via `src/lib/adminEdge.js`, which wraps the `admin-operations` function:

```
adminEdge.deleteAuthUser(authUserId)
adminEdge.resetPassword(userId, newPassword)
adminEdge.listAdminUsers()
adminEdge.createAdminUser(email, password)
adminEdge.deleteAdminUser(userId)
```

### Audit logging

`src/lib/auditLog.js` exposes `logAudit(action, details)`. It calls `supabaseAdminAuth.auth.getUser()` to get the current admin's ID, then inserts into the `audit_log` table. It is non-blocking (fire-and-forget) and never throws.

### Idle session timeout

`AdminLayout` tracks user activity (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`) and runs a 30-second interval timer:

- At **25 minutes** of inactivity: toast warning "You will be signed out in 5 minutes"
- At **30 minutes** of inactivity: calls `signOut()` and redirects to `/admin/login`

---

## 4. Data Model

### Tables

#### `clans`
```
id            text        PK  — 'VIPERON' | 'CRODON' | 'AVERON' | 'WOLFRIN'
name          text        NOT NULL
mascot        text        NOT NULL
color_primary text        NOT NULL
color_bg      text        NOT NULL
total_cp      integer     NOT NULL DEFAULT 0
crown         boolean     NOT NULL DEFAULT false  — true = last month's winning clan
updated_at    timestamptz NOT NULL DEFAULT now()
```

#### `students`
```
id            uuid        PK DEFAULT gen_random_uuid()
auth_user_id  uuid        UNIQUE → auth.users(id) ON DELETE SET NULL
full_name     text        NOT NULL
age           smallint    NOT NULL  CHECK (age > 0 AND age < 100)
level         text        NOT NULL  CHECK (level IN ('A1','A2','B1','B2','C1','C2'))
phone         text        NOT NULL
class_group   text        NOT NULL
clan          text        NOT NULL → clans(id)
cp            integer     NOT NULL DEFAULT 0  CHECK (cp >= 0)
username      text        NOT NULL UNIQUE
is_active     boolean     NOT NULL DEFAULT true
created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()
```

#### `events`
```
id          uuid     PK DEFAULT gen_random_uuid()
title       text     NOT NULL
category    text     NOT NULL  CHECK (category IN ('English','IELTS','Competition','Volunteer','Korean','Russian','Math'))
event_date  date     NOT NULL
event_time  time
room        text
cp_value    integer  NOT NULL DEFAULT 20  CHECK (cp_value >= 0)
finalised   boolean  NOT NULL DEFAULT false
created_by  uuid     → auth.users(id) ON DELETE SET NULL
created_at  timestamptz NOT NULL DEFAULT now()
```

#### `attendance`
```
id          uuid     PK DEFAULT gen_random_uuid()
event_id    uuid     NOT NULL → events(id)   ON DELETE CASCADE
student_id  uuid     NOT NULL → students(id) ON DELETE CASCADE
present     boolean  NOT NULL DEFAULT false
cp_awarded  integer  NOT NULL DEFAULT 0
finalised   boolean  NOT NULL DEFAULT false
archived    boolean  NOT NULL DEFAULT false
marked_at   timestamptz
UNIQUE(event_id, student_id)
```

#### `cp_awards`
```
id          uuid     PK DEFAULT gen_random_uuid()
student_id  uuid     NOT NULL → students(id) ON DELETE CASCADE
amount      integer  NOT NULL  CHECK (amount > 0)
reason      text     NOT NULL
note        text     NOT NULL  CHECK (length(trim(note)) > 0)
awarded_by  uuid     → auth.users(id) ON DELETE SET NULL
created_at  timestamptz NOT NULL DEFAULT now()
```

#### `cp_deductions` *(added via migration)*
```
id          uuid     PK DEFAULT gen_random_uuid()
student_id  uuid     NOT NULL → students(id) ON DELETE CASCADE
amount      integer  NOT NULL
reason      text     NOT NULL
note        text     NOT NULL
created_at  timestamptz NOT NULL DEFAULT now()
```

#### `badges`
```
id          uuid     PK DEFAULT gen_random_uuid()
student_id  uuid     NOT NULL → students(id) ON DELETE CASCADE
badge_key   text     NOT NULL
earned_at   timestamptz NOT NULL DEFAULT now()
UNIQUE(student_id, badge_key)
```

#### `hall_of_fame`
```
id             uuid     PK DEFAULT gen_random_uuid()
month          smallint NOT NULL  CHECK (month BETWEEN 1 AND 12)
year           smallint NOT NULL
clan_winner    text     → clans(id)
top_student_id uuid     → students(id) ON DELETE SET NULL
created_at     timestamptz NOT NULL DEFAULT now()
UNIQUE(month, year)
```

#### `monthly_snapshots`
```
id          uuid     PK DEFAULT gen_random_uuid()
month       smallint NOT NULL  CHECK (month BETWEEN 1 AND 12)
year        smallint NOT NULL
student_id  uuid     NOT NULL → students(id) ON DELETE CASCADE
cp          integer  NOT NULL DEFAULT 0
clan        text     NOT NULL → clans(id)
rank        integer
created_at  timestamptz NOT NULL DEFAULT now()
UNIQUE(month, year, student_id)
```

#### `event_interest`
```
id          uuid     PK DEFAULT gen_random_uuid()
event_id    uuid     NOT NULL → events(id)   ON DELETE CASCADE
student_id  uuid     NOT NULL → students(id) ON DELETE CASCADE
created_at  timestamptz NOT NULL DEFAULT now()
UNIQUE(event_id, student_id)
```

### Indexes

```sql
students_clan_idx         ON students(clan)
students_cp_idx           ON students(cp DESC)
events_date_idx           ON events(event_date DESC)
attendance_event_idx      ON attendance(event_id)
attendance_student_idx    ON attendance(student_id)
attendance_archived_idx   ON attendance(student_id, archived)
cp_awards_student_idx     ON cp_awards(student_id)
badges_student_idx        ON badges(student_id)
snapshots_month_year_idx  ON monthly_snapshots(year, month)
```

### Functions

| Name | Type | Description |
|---|---|---|
| `is_admin()` | Helper (SQL stable) | Returns `true` if `auth.jwt() → user_metadata → role = 'admin'` |
| `current_student_id()` | Helper (SQL stable) | Resolves `auth.uid() → students.id` |
| `set_updated_at()` | Trigger fn | Sets `updated_at = now()` on UPDATE |
| `sync_clan_cp()` | Trigger fn | Recomputes `clans.total_cp` when a student's `cp`, `clan`, or `is_active` changes |
| `finalise_attendance()` | Trigger fn | On `finalised` flipping `false → true`: if `present`, adds `event.cp_value` to student CP and inserts a `cp_awards` row with `reason = 'attendance'` |
| `prevent_refinalise()` | Trigger fn | Raises exception if `finalised` is set back to `false` or set to `true` again |
| `apply_cp_award()` | Trigger fn | On INSERT into `cp_awards`: increments `students.cp` by `amount`. Fires only when `reason <> 'attendance'` (attendance path already updates CP directly) |
| `monthly_reset(p_month, p_year)` | Stored proc | 9-step end-of-month procedure (see Key Workflows) |
| `generate_student_credentials(p_full_name)` | Stored proc | Returns unique `username` + 8-char temp `password` derived from the student's name |

### Triggers

| Trigger name | Table | Fires | Calls |
|---|---|---|---|
| `students_updated_at` | students | BEFORE UPDATE | `set_updated_at()` |
| `clans_updated_at` | clans | BEFORE UPDATE | `set_updated_at()` |
| `sync_clan_cp_trigger` | students | AFTER INSERT OR UPDATE OF `cp, clan, is_active` | `sync_clan_cp()` |
| `prevent_refinalise_trigger` | attendance | BEFORE UPDATE OF `finalised` | `prevent_refinalise()` |
| `finalise_attendance_trigger` | attendance | BEFORE UPDATE OF `finalised` | `finalise_attendance()` |
| `apply_cp_award_trigger` | cp_awards | AFTER INSERT WHEN `reason <> 'attendance'` | `apply_cp_award()` |

---

## 5. Core Features

### Admin panel

| Feature | Page | Key behaviour |
|---|---|---|
| Student management | `StudentManagement.jsx` | List/filter (clan, level, active/inactive), create student, edit details, deactivate, delete with full cascade |
| Event management | `EventManagement.jsx` | Create/edit events, mark attendance per event, finalise attendance (one-way, triggers CP award) |
| CP awards | `CpAwards.jsx` | Manual CP awards with reason codes, CP deductions, view full award/deduction history |
| Rankings | `Rankings.jsx` | View current standings by clan and individual |
| Monthly Reset | `MonthlyReset.jsx` | Preview stats, run full end-of-month reset with typed confirmation, repeatable |
| Admin management | `AdminManagement.jsx` | List, create, delete admin users via Edge Function |
| Audit log | `AuditLog.jsx` | View admin action history |
| Dashboard | `AdminDashboard.jsx` | Overview KPIs |

### Student portal

| Feature | Page | Key behaviour |
|---|---|---|
| Dashboard | `StudentDashboard.jsx` | Personal CP, clan standing, recent activity feed, next event |
| Clan page | `ClanPage.jsx` | Clan members and rankings |
| Events | `EventsPage.jsx` | Upcoming events, register interest |
| Leaderboard | `LeaderboardPage.jsx` | Cross-clan rankings |
| Profile | `ProfilePage.jsx` | Personal stats, badge collection, monthly history |

### Gamification mechanics

- 4 clans: VIPERON (snake), CRODON (dragon), AVERON (eagle), WOLFRIN (wolf)
- CP reason codes: `attendance`, `volunteer`, `competition_1st/2nd/3rd`, `referral`, `peer_spotlight`, `perfect_month`, `other`, `end_of_month_1st`, `end_of_month_top5`, `end_of_month_top5_clan`, `clan_winner_headstart`
- Badges: `clan_champion`, `monthly_legend`, `fast_life_elite`
- `students.cp >= 0` constraint is enforced at DB level; deductions use `Math.max(0, current - amount)` in the app layer

---

## 6. Key Workflows / Sequences

### 6.1 Create a student

```
Admin fills form
  → calls generate_student_credentials(full_name) RPC
  → returns { username, password }
Admin chooses clan + confirms credentials
  → app calls create-student Edge Function (service role)
  → Edge Function creates auth.users entry, returns auth_user_id
  → app inserts row into public.students with auth_user_id
  → CredentialsModal shows generated credentials to admin
```

### 6.2 Finalise attendance (CP award path)

```
Admin creates event with cp_value
Admin marks each student present/absent in AttendanceRegister
Admin clicks "Finalise"
  → app calls supabase.from('attendance').update({ finalised: true })
  → prevent_refinalise_trigger fires (BEFORE) — raises if already finalised
  → finalise_attendance_trigger fires (BEFORE) — for each present row:
      UPDATE students SET cp = cp + event.cp_value
      INSERT INTO cp_awards (reason = 'attendance')
  → sync_clan_cp_trigger fires (AFTER UPDATE on students.cp)
      → UPDATE clans SET total_cp = SUM(student.cp for clan)
  → apply_cp_award_trigger does NOT fire (reason = 'attendance')
```

### 6.3 Manual CP award

```
Admin selects student + reason + amount + note
  → INSERT INTO cp_awards
  → apply_cp_award_trigger fires (reason ≠ 'attendance')
      → UPDATE students SET cp = cp + amount
  → sync_clan_cp_trigger fires on students.cp change
      → UPDATE clans SET total_cp
  → app also explicitly: read fresh cp, update students.cp
    (belt-and-suspenders over the trigger)
```

### 6.4 Monthly Reset (9 steps, atomic PL/pgSQL)

```
Admin navigates to Monthly Reset, previews current stats
Admin enters month + year + typed confirmation
App calls supabase.rpc('monthly_reset', { p_month, p_year })

Inside monthly_reset():
  a) INSERT INTO monthly_snapshots (month, year, student_id, cp, clan, rank)
     for all is_active students, ON CONFLICT DO NOTHING
  b) SELECT winning clan (highest total_cp) + top student (highest cp, active)
  c) UPSERT INTO hall_of_fame (month, year, clan_winner, top_student_id)
  d) UPDATE clans SET crown = false / true for winner
     INSERT badges: clan_champion for winner-clan members
     IF top_student IS NOT NULL:
       INSERT badges: monthly_legend (top student)
       INSERT badges: fast_life_elite (top 5 overall)
  e) IF top_student IS NOT NULL: UPDATE students cp += 125 for #1
     INSERT cp_awards for #1 (end_of_month_1st)
     UPDATE students cp += 75 for top 2-5 (IS DISTINCT FROM top_student)
     INSERT cp_awards (end_of_month_top5)
     LOOP over each clan: UPDATE top 5 per clan cp += 30
       INSERT cp_awards (end_of_month_top5_clan)
  e2) DELETE FROM cp_awards WHERE true
      DELETE FROM cp_deductions WHERE true
  f)  UPDATE students SET cp = 0 WHERE is_active
  f2) UPDATE attendance SET archived = true WHERE finalised = true
  g)  Randomly reshuffle all active students across 4 clans (round-robin)
  h)  UPDATE students SET cp = 50 WHERE clan = winner AND is_active
      INSERT cp_awards (clan_winner_headstart) for those students
  i)  Recompute clans.total_cp from students.cp

Returns: { success, month, year, winning_clan, top_student }
```

### 6.5 Delete a student

```
Admin clicks Delete → confirmation modal
App calls deleteStudentData(student):
  DELETE FROM cp_awards       WHERE student_id = id
  DELETE FROM cp_deductions   WHERE student_id = id
  DELETE FROM attendance      WHERE student_id = id
  DELETE FROM badges          WHERE student_id = id
  DELETE FROM monthly_snapshots WHERE student_id = id
  DELETE FROM students        WHERE id = id
  (DB CASCADE also handles the above for tables with cascade FK)
  IF auth_user_id: adminEdge.deleteAuthUser(auth_user_id)
```

### 6.6 Session expiry / auth guard

```
Admin session expires
  → Supabase auto-refresh fails
  → onAuthStateChange fires with SIGNED_OUT
  → AdminAuthContext: setSession(null)
  → StudentManagement useEffect [session] detects session === null
      → signOut() + navigate('/admin/login')
  → Any in-flight query that returns 401/PGRST301 also triggers:
      → signOut() + navigate('/admin/login')
  → AdminLayout: if (!session || !isAdmin) → <Navigate to="/admin/login" />
```

---

## 7. Permissions & Rules

### RLS helper functions

```sql
is_admin()          → auth.jwt() → user_metadata → role = 'admin'
current_student_id() → SELECT id FROM students WHERE auth_user_id = auth.uid()
```

`is_admin()` reads the JWT claim set at user creation time (via `user_metadata`). It does NOT hit the database.

### Policy matrix

| Table | anon | Student (authed) | Admin |
|---|---|---|---|
| `clans` | SELECT | SELECT | ALL |
| `students` | — | SELECT (all rows, for leaderboard) | ALL |
| `events` | — | SELECT | ALL |
| `attendance` | — | SELECT own rows WHERE NOT archived | ALL |
| `cp_awards` | — | SELECT own rows | ALL |
| `cp_deductions` | — | — | ALL (implied via service role / admin client) |
| `badges` | — | SELECT | ALL |
| `hall_of_fame` | SELECT | SELECT | ALL |
| `monthly_snapshots` | — | SELECT | ALL |
| `event_interest` | — | SELECT own / INSERT own / DELETE own | SELECT all |

### Notes

- Students can see **all** other students' rows (needed for leaderboard/clan pages). RLS cannot restrict individual columns in PostgreSQL — `phone`, `age`, and `class_group` are exposed at the row level to authenticated users.
- `attendance: own read` excludes `archived = true` rows, so past-month attendance is hidden from students after a reset.
- `monthly_reset()` is `SECURITY DEFINER` — it runs as the function owner (service role), bypassing RLS for its writes.
- `generate_student_credentials()` is also `SECURITY DEFINER`.

---

## 8. Known Issues / History of Fixes

### 8.1 Students page infinite loading skeleton

**Root cause**: `StudentManagement.jsx` was calling `supabaseAdminAuth.auth.setSession()` unconditionally on every `fetchStudents` run. `setSession` fires `onAuthStateChange`, which calls `setSession(newObject)` in `AdminAuthContext` (new JS object reference even with identical tokens). React re-renders → `session` prop reference changes → `fetchStudents` is recreated (it has `session` in its `useCallback` deps) → the `useEffect([fetchStudents])` fires again → `setLoading(true)` is called → the page is stuck in skeleton forever.

**Fix** (`src/pages/admin/StudentManagement.jsx`): Guard `setSession` with a token comparison:
```js
const { data: { session: clientSession } } = await supabaseAdminAuth.auth.getSession()
if (!clientSession || clientSession.access_token !== session.access_token) {
  await supabaseAdminAuth.auth.setSession({ ... })
}
```
Also added `try/catch/finally` so any exception still clears `loading`.

### 8.2 Monthly Reset — "DELETE requires a WHERE clause"

**Root cause**: Supabase rejects bare `DELETE FROM table` without a WHERE clause, even inside a PL/pgSQL `SECURITY DEFINER` function. The original `monthly_reset()` in `schema.sql` had `delete from public.cp_awards;` without a WHERE clause.

**Fix** (`supabase/migrations/monthly_reset_fix_delete_where.sql`): Changed to `DELETE FROM public.cp_awards WHERE true` and `DELETE FROM public.cp_deductions WHERE true`. Applied directly to the live DB via `supabase db query --linked -f <file>`.

### 8.3 Monthly Reset — null `v_top_student` crash

**Root cause**: After fixing the DELETE WHERE issue, a second bug surfaced when running the reset with 0 active students. `v_top_student` is NULL when no active students exist. Two SQL problems:
1. `INSERT INTO badges VALUES (NULL, 'monthly_legend')` violates the NOT NULL constraint on `badges.student_id`
2. `WHERE id <> v_top_student` — in SQL, `id <> NULL` evaluates to `NULL` (not `TRUE`), so the top-5 queries excluded everyone

**Fix** (`supabase/migrations/monthly_reset_fix_null_top_student.sql`):
- Wrapped all `v_top_student`-dependent statements in `IF v_top_student IS NOT NULL THEN` blocks
- Changed `id <> v_top_student` to `id IS DISTINCT FROM v_top_student`
- Guarded the FOREACH clan-reshuffle with `coalesce(v_students_arr, '{}')`
- Applied to live DB. Confirmed returning `{"success": true}` with 0 active students.

### 8.4 Session expiry — silent infinite loading instead of redirect

**Root cause**: When the JWT expired and auto-refresh failed, Supabase fired `onAuthStateChange(SIGNED_OUT)` → `session = null` in `AdminAuthContext`. The Students page had no handler for this — it just showed empty data with `loading = false`.

**Fix** (`src/pages/admin/StudentManagement.jsx`): Added dedicated `useEffect` that watches `session === null`:
```js
useEffect(() => {
  if (session === null) {
    signOut().then(() => navigate('/admin/login'))
  }
}, [session, signOut, navigate])
```
Also added handling for `error.status === 401 || error.code === 'PGRST301'` in the query path to trigger the same redirect.

### 8.5 Cascade delete missing `cp_deductions`

**Root cause**: When a student was deleted, the app-level `deleteStudentData()` function explicitly deleted rows from `cp_awards`, `attendance`, `badges`, `monthly_snapshots`, and `students`, but missed `cp_deductions`. The DB-level CASCADE was also missing from `cp_deductions.student_id`.

**Fix**: 
- Migration `cascade_deductions_and_monthly_reset_v3.sql` drops and re-adds the FK on `cp_deductions.student_id` with `ON DELETE CASCADE`
- `deleteStudentData` in `StudentManagement.jsx` now also calls `.delete().eq('student_id', id)` on `cp_deductions`

### 8.6 Monthly Reset — one-time-only restriction

**Root cause**: The original Monthly Reset component had a guard `if (phase !== 'preview') return` in `executeReset`, plus no way to start again after success. Once a reset completed, the page was stuck on the success screen.

**Fix** (`src/pages/admin/MonthlyReset.jsx`): Removed the phase gate from `executeReset`. Added `handleRunAgain` function that resets all state back to `phase = 'preview'` and re-runs `load()`. Added "Run Another Reset" button to the `SuccessScreen` component.

### 8.7 Live DB query — comment lines interpreted as flags

**Root cause**: `supabase db query --linked "SQL string"` failed when the SQL string contained `--` comment lines (interpreted as CLI flags by the shell).

**Fix**: Use `supabase db query --linked -f <filename>` with SQL written to a file instead of passed inline.

### 8.8 MonthlyReset using wrong Supabase client

**Root cause**: `MonthlyReset.jsx` was importing the student-portal `supabase` client instead of `supabaseAdminAuth`. Admin RPC calls and queries were going through the wrong auth session.

**Fix**: Changed import to `import { supabaseAdminAuth } from '@/lib/supabase'` and updated all references in that file.

---

## 9. Deployment

### Infrastructure

```
GitHub (davlat-devops/fast-life)
  └─ Vercel (auto-deploy on push to main)
       └─ https://fast-life-tau.vercel.app

Supabase (project: <redacted>)
  ├─ PostgreSQL database
  ├─ Auth service
  └─ Edge Functions
       ├─ admin-operations (v3)
       └─ create-student (v4)
```

### Vercel config (`vercel.json`)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Single catch-all rewrite for SPA routing — all paths fall through to `index.html` and React Router handles navigation client-side.

### Environment variables (Vercel)

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` | Both Supabase clients in `src/lib/supabase.js` |
| `VITE_SUPABASE_ANON_KEY` | Both Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only (never client-side) |

### Deploy commands

```bash
# Deploy to production
vercel --prod

# Apply a DB migration to live Supabase
supabase link --project-ref <redacted>
supabase db query --linked -f supabase/migrations/<file>.sql

# Deploy an Edge Function
supabase functions deploy admin-operations
supabase functions deploy create-student
```

### Supabase CLI

- CLI version: v2.108.0
- Playwright (for testing): `/opt/homebrew/lib/node_modules/playwright/index.mjs`
- Vercel CLI: v54.18.5

### Build

```bash
npm run dev     # Vite dev server
npm run build   # Production build (dist/)
npm run preview # Preview production build locally
npm run lint    # oxlint
```
