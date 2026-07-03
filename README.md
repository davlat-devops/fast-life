# Fast Life

Fast Life is a gamified student platform for **Fast Education**. Students earn
Clan Points (CP) through attendance, events, and achievements, compete on a
clan-based leaderboard, and unlock badges — while admins manage students,
events, and scoring from a dedicated admin panel.

## Features

### Student portal
- **Dashboard** — CP total, level progress, and recent activity at a glance
- **Clan** — clan roster, clan CP totals, and clan identity
- **Events** — upcoming and past events with attendance status
- **Leaderboard** — individual and clan rankings
- **Profile** — badge gallery, CP history, and account/password management

### Admin panel
- **Student management** — create, deactivate, delete, and reset credentials
  for students
- **Event management** — create and manage events
- **Badge management** — configure badges and award criteria
- **CP awards** — grant Clan Points for attendance, competitions, referrals,
  and other reasons
- **Attendance register** — mark attendance per event
- **Monthly reset** — snapshot standings, crown clan/student winners, and
  reset CP for a new month
- **Audit log** — track admin actions

## Tech stack

- **React 19** + **Vite 8** — UI and build tooling
- **Tailwind CSS 4** — styling
- **Supabase** — Postgres database, authentication, and edge functions
- **Vercel** — hosting and deployment

Other notable dependencies: `framer-motion` for animation, `react-router-dom`
for routing, `lucide-react` for icons.

## Architecture

- `src/pages/student/*` — student-facing routes (dashboard, clan, events,
  leaderboard, profile), authenticated via Supabase Auth as regular users
- `src/pages/admin/*` — admin-only routes, authenticated via a separate admin
  Supabase Auth session (`supabaseAdminAuth`) and gated by an `is_admin()`
  Postgres function checked in RLS policies
- `src/lib/supabase.js` — Supabase client(s) for the student and admin auth
  contexts
- `src/lib/adminEdge.js` — calls into Supabase Edge Functions for privileged
  operations (e.g. resetting a student's auth password, deleting an auth
  user) that must not run with client-side credentials
- `src/contexts/*` — React context providers for auth state and toasts
- `src/constants/*` — static config for clans, badges, and level thresholds
- `supabase/schema.sql` — full database schema, RLS policies, and functions
- `supabase/migrations/*` — incremental SQL migrations applied on top of the
  base schema

Row Level Security (RLS) is the primary access-control boundary: students can
only read/write their own rows, admins bypass restrictions via `is_admin()`,
and any table students need to read for leaderboards/clans is exposed via
authenticated-read policies.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase project
   credentials:
   ```
   cp .env.example .env.local
   ```
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Apply `supabase/schema.sql` and the migrations in `supabase/migrations/`
   to your Supabase project (via the SQL Editor or the Supabase CLI).
4. Start the dev server:
   ```
   npm run dev
   ```

## Scripts

| Script            | Description                          |
|-------------------|---------------------------------------|
| `npm run dev`     | Start the Vite dev server             |
| `npm run build`   | Type-check and build for production   |
| `npm run lint`    | Lint the codebase with Oxlint         |
| `npm run preview` | Preview the production build locally  |
