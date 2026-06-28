import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CLANS } from '@/constants/clans'

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const REASON_LABELS = {
  attendance:             'Attendance',
  volunteer:              'Volunteer',
  competition_1st:        '🥇 1st Place',
  competition_2nd:        '🥈 2nd Place',
  competition_3rd:        '🥉 3rd Place',
  referral:               'Referral',
  peer_spotlight:         'Peer Spotlight',
  end_of_month_1st:       '#1 of Month',
  end_of_month_top5:      'Top 5 Overall',
  end_of_month_top5_clan: 'Top 5 in Clan',
  clan_winner_headstart:  'Clan Head Start',
  perfect_month:          'Perfect Month',
}

function formatReason(r) { return REASON_LABELS[r] ?? r }

function AnimatedNumber({ target, duration = 900 }) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return <>{val.toLocaleString()}</>
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, icon, accent, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
          <p className="text-3xl font-black text-white mt-1.5">
            {loading ? (
              <span className="inline-block w-16 h-7 rounded-md bg-white/10 animate-pulse" />
            ) : (
              <AnimatedNumber target={value} />
            )}
          </p>
        </div>
        <span className="text-2xl opacity-50">{icon}</span>
      </div>
      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: accent }} />
    </motion.div>
  )
}

function ClanRaceBar({ clan, totalCp, maxCp, rank, delay }) {
  const info = CLANS[clan.id]
  const pct  = maxCp > 0 ? (clan.total_cp / maxCp) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-4"
    >
      {/* Rank + mascot */}
      <div className="w-8 text-center">
        <span className="text-lg">{['🥇','🥈','🥉','4️⃣'][rank]}</span>
      </div>
      <div className="w-8 text-center text-xl">{info?.emoji}</div>
      <div className="w-20 shrink-0">
        <p className="text-xs font-bold text-white">{clan.name}</p>
        <p className="text-[10px] text-white/30">{clan.total_cp.toLocaleString()} CP</p>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-8 rounded-full overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.15, duration: 0.9, type: 'spring', stiffness: 90, damping: 22 }}
          className="absolute inset-y-0 left-0 rounded-full min-w-[2px] flex items-center"
          style={{
            background: `linear-gradient(90deg, ${info?.colorAccent}cc, ${info?.colorAccent})`,
          }}
        >
          {pct > 18 && (
            <span className="absolute right-3 text-white text-[11px] font-bold whitespace-nowrap">
              {Math.round(pct)}%
            </span>
          )}
        </motion.div>
      </div>

      {/* Crown */}
      {clan.crown && (
        <span className="text-base" title="Reigning champion">👑</span>
      )}
    </motion.div>
  )
}

function ActivityItem({ award, delay }) {
  const clanInfo = CLANS[award.students?.clan]
  const initials = (award.students?.full_name ?? '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
        style={{ background: clanInfo?.colorAccent ?? '#555' }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/80 truncate">
          <span className="font-semibold text-white">
            {award.students?.full_name ?? 'Unknown'}
          </span>
          {' — '}
          {formatReason(award.reason)}
        </p>
        <p className="text-[10px] text-white/30 mt-0.5 truncate">{award.note}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs font-bold text-emerald-400">+{award.amount}</p>
        <p className="text-[10px] text-white/25">{timeAgo(award.created_at)}</p>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState({ students: 0, events: 0, cpToday: 0 })
  const [clans,   setClans]   = useState([])
  const [top,     setTop]     = useState(null)
  const [feed,    setFeed]    = useState([])

  useEffect(() => {
    async function load() {
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()

      const [
        studentsRes,
        clansRes,
        topRes,
        eventsRes,
        cpRes,
        feedRes,
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('clans').select('*').order('total_cp', { ascending: false }),
        supabase.from('students').select('full_name, cp, clan').eq('is_active', true).order('cp', { ascending: false }).limit(1),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', monthStart.slice(0, 10)),
        supabase.from('cp_awards').select('amount').gte('created_at', todayStart),
        supabase.from('cp_awards')
          .select('id, amount, reason, note, created_at, students(full_name, clan)')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const cpToday = (cpRes.data ?? []).reduce((s, a) => s + a.amount, 0)

      setStats({
        students: studentsRes.count ?? 0,
        events:   eventsRes.count ?? 0,
        cpToday,
      })
      setClans(clansRes.data ?? [])
      setTop(topRes.data?.[0] ?? null)
      setFeed(feedRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const maxCp = Math.max(...clans.map(c => c.total_cp), 1)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-8 space-y-8 max-w-[1200px]">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/35 mt-1">{today}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/students"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: '#CC0000' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Student
          </Link>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Students" value={stats.students} icon="🎓" accent="#CC0000" loading={loading} />
        <StatCard label="Events This Month" value={stats.events}  icon="📅" accent="#C9A227" loading={loading} />
        <StatCard label="CP Awarded Today"  value={stats.cpToday} icon="⭐" accent="#4A7C3F" loading={loading} />
        <div
          className="relative rounded-2xl p-5 overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Top Student</p>
          {loading ? (
            <div className="mt-2 space-y-1.5">
              <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
            </div>
          ) : top ? (
            <div className="mt-1.5">
              <p className="text-base font-bold text-white leading-tight truncate">{top.full_name}</p>
              <p className="text-xs text-white/40 mt-0.5">
                <span className="font-semibold text-emerald-400">{top.cp} CP</span>
                {' · '}
                <span style={{ color: CLANS[top.clan]?.colorAccent }}>{CLANS[top.clan]?.name}</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-white/30 mt-2">No data yet</p>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: '#A0A0A0' }} />
        </div>
      </div>

      {/* ── Bottom two columns ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Clan race — 3 cols */}
        <div
          className="lg:col-span-3 rounded-2xl p-6 space-y-5"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Clan Race</h2>
            <Link to="/admin/rankings" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
              View rankings →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-5 rounded bg-white/10 animate-pulse" />
                  <div className="w-8 h-5 rounded bg-white/10 animate-pulse" />
                  <div className="w-20 h-5 rounded bg-white/10 animate-pulse" />
                  <div className="flex-1 h-8 rounded-full bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {clans.map((clan, i) => (
                <ClanRaceBar
                  key={clan.id} clan={clan} maxCp={maxCp}
                  rank={i} delay={i * 0.08}
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed — 2 cols */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
            <Link to="/admin/cp" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
              All awards →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded bg-white/10 animate-pulse" />
                    <div className="h-2.5 w-2/3 rounded bg-white/10 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <p className="text-sm text-white/25 text-center py-8">No activity yet</p>
          ) : (
            <div>
              {feed.map((award, i) => (
                <ActivityItem key={award.id} award={award} delay={i * 0.04} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick links ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/admin/students',   label: 'Manage Students', icon: '👥' },
          { to: '/admin/events',     label: 'Create Event',    icon: '📅' },
          { to: '/admin/cp',         label: 'Award CP',        icon: '⭐' },
          { to: '/admin/reset',      label: 'Monthly Reset',   icon: '🔄' },
        ].map(({ to, label, icon }) => (
          <Link
            key={to} to={to}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/10 transition-all"
          >
            <span className="text-lg">{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
