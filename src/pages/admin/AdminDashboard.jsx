import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Calendar, Star, Trophy,
  CalendarPlus, RefreshCw, Crown,
  Zap, Award, Heart,
} from 'lucide-react'
import { supabaseAdminAuth } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { CLANS } from '@/constants/clans'
import { ClanIcon } from '@/components/ui/ClanIcons'

// ── Helpers ───────────────────────────────────────────────────

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const REASON_LABELS = {
  attendance:             'Attendance',
  volunteer:              'Volunteer',
  competition_1st:        '1st Place',
  competition_2nd:        '2nd Place',
  competition_3rd:        '3rd Place',
  referral:               'Referral',
  peer_spotlight:         'Peer Spotlight',
  end_of_month_1st:       '#1 of Month',
  end_of_month_top5:      'Top 5 Overall',
  end_of_month_top5_clan: 'Top 5 in Clan',
  clan_winner_headstart:  'Clan Head Start',
  perfect_month:          'Perfect Month',
}

const REASON_ICON = {
  attendance:             { Icon: Calendar,  color: '#60a5fa' },
  volunteer:              { Icon: Heart,     color: '#f472b6' },
  competition_1st:        { Icon: Trophy,    color: '#f59e0b' },
  competition_2nd:        { Icon: Trophy,    color: '#94a3b8' },
  competition_3rd:        { Icon: Trophy,    color: '#b45309' },
  referral:               { Icon: Users,     color: '#4ade80' },
  peer_spotlight:         { Icon: Star,      color: '#a78bfa' },
  end_of_month_1st:       { Icon: Crown,     color: '#f59e0b' },
  end_of_month_top5:      { Icon: Award,     color: '#fb923c' },
  end_of_month_top5_clan: { Icon: Award,     color: '#fb923c' },
  clan_winner_headstart:  { Icon: Zap,       color: '#e53e3e' },
  perfect_month:          { Icon: Star,      color: '#4ade80' },
}


function formatReason(r) { return REASON_LABELS[r] ?? r }

function AnimatedNumber({ target, duration = 1100 }) {
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


// ── Rank badge (#1 gold, #2 silver, #3 bronze, #4 plain) ──────

const RANK_STYLE = [
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' },
  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
  { color: '#b45309', bg: 'rgba(180,83,9,0.13)',   border: 'rgba(180,83,9,0.32)'  },
  { color: 'var(--ad-text-3)', bg: 'var(--ad-hover)', border: 'var(--ad-border)'  },
]

function RankBadge({ rank }) {
  const s = RANK_STYLE[rank] ?? RANK_STYLE[3]
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: '-0.01em',
    }}>
      #{rank + 1}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, Icon, accentColor, loading, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="ad-surface rounded-2xl p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ad-text-3)', marginBottom: 6 }}>
            {label}
          </p>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--ad-text)', lineHeight: 1 }}>
            {loading
              ? <span style={{ display: 'inline-block', width: 64, height: 28, borderRadius: 6, background: 'var(--ad-skeleton)' }} />
              : <AnimatedNumber target={value} />
            }
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${accentColor}18`, color: accentColor,
          transition: 'transform 0.2s',
        }}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
      }}/>
    </motion.div>
  )
}

function ClanRaceBar({ clan, maxCp, rank, delay }) {
  const pct = maxCp > 0 ? (clan.total_cp / maxCp) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <RankBadge rank={rank} />
      <ClanIcon clanId={clan.id} size={28} />

      <div style={{ width: 76, flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          {clan.name}
          {clan.crown && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}
            >
              <Crown size={11} fill="#f59e0b" strokeWidth={1.5} />
            </motion.span>
          )}
        </p>
        <p style={{ fontSize: 10, color: 'var(--ad-text-3)', marginTop: 2 }}>{clan.total_cp.toLocaleString()} CP</p>
      </div>

      <div style={{
        flex: 1, height: 32, borderRadius: 8, overflow: 'hidden',
        background: 'var(--ad-surface)', position: 'relative',
        border: '1px solid var(--ad-border)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.2, duration: 1.0, type: 'spring', stiffness: 80, damping: 20 }}
          style={{
            position: 'absolute', inset: '0 auto 0 0',
            borderRadius: 7, minWidth: 4,
            background: `linear-gradient(90deg, var(--ad-red) 0%, #ff6b35 100%)`,
            boxShadow: `0 0 12px var(--ad-red-glow)`,
            display: 'flex', alignItems: 'center',
          }}
        >
          {pct > 20 && (
            <span style={{
              position: 'absolute', right: 8,
              fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
            }}>
              {clan.total_cp.toLocaleString()}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

function ActivityItem({ award, delay }) {
  const clanInfo = CLANS[award.students?.clan]
  const { Icon, color } = REASON_ICON[award.reason] ?? { Icon: Star, color: '#a78bfa' }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0', borderBottom: '1px solid var(--ad-border-2)',
      }}
    >
      {/* Reason icon badge */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
      }}>
        <Icon size={14} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--ad-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 600 }}>{award.students?.full_name ?? 'Unknown'}</span>
          {' — '}{formatReason(award.reason)}
        </p>
        <p style={{ fontSize: 10, color: 'var(--ad-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {award.note ?? (clanInfo ? `${clanInfo.name} clan` : '')}
        </p>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <p style={{
          fontSize: 12, fontWeight: 800, color: '#4ade80',
          textShadow: '0 0 8px rgba(74,222,128,0.4)',
        }}>
          +{award.amount}
        </p>
        <p style={{ fontSize: 10, color: 'var(--ad-text-4)', marginTop: 1 }}>{timeAgo(award.created_at)}</p>
      </div>
    </motion.div>
  )
}

// ── Quick link icon components ────────────────────────────────

const QUICK_LINKS = [
  { to: '/admin/students', label: 'Manage Students', Icon: Users,       color: '#e53e3e' },
  { to: '/admin/events',   label: 'Create Event',    Icon: CalendarPlus, color: '#C9A227' },
  { to: '/admin/cp',       label: 'Award CP',        Icon: Star,         color: '#4ade80' },
  { to: '/admin/reset',    label: 'Monthly Reset',   Icon: RefreshCw,    color: '#a78bfa' },
]

// ── Page ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { session } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState({ students: 0, events: 0, cpToday: 0 })
  const [clans,   setClans]   = useState([])
  const [top,     setTop]     = useState(null)
  const [feed,    setFeed]    = useState([])

  useEffect(() => {
    if (!session?.access_token) return

    async function load() {
      const { data: { session: clientSession } } = await supabaseAdminAuth.auth.getSession()
      if (!clientSession || clientSession.access_token !== session.access_token) {
        await supabaseAdminAuth.auth.setSession({
          access_token:  session.access_token,
          refresh_token: session.refresh_token,
        })
      }

      const today      = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()

      const [studentsRes, clansRes, topRes, eventsRes, cpRes, feedRes] = await Promise.all([
        supabaseAdminAuth.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabaseAdminAuth.from('clans').select('*').order('total_cp', { ascending: false }),
        supabaseAdminAuth.from('students').select('full_name, cp, clan').eq('is_active', true).order('cp', { ascending: false }).limit(1),
        supabaseAdminAuth.from('events').select('*', { count: 'exact', head: true }).gte('event_date', monthStart.slice(0, 10)),
        supabaseAdminAuth.from('cp_awards').select('amount').gte('created_at', todayStart),
        supabaseAdminAuth.from('cp_awards')
          .select('id, amount, reason, note, created_at, students(full_name, clan)')
          .order('created_at', { ascending: false }).limit(10),
      ])

      setStats({
        students: studentsRes.count ?? 0,
        events:   eventsRes.count ?? 0,
        cpToday:  (cpRes.data ?? []).reduce((s, a) => s + a.amount, 0),
      })
      setClans(clansRes.data ?? [])
      setTop(topRes.data?.[0] ?? null)
      setFeed(feedRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [session])

  const maxCp = Math.max(...clans.map(c => c.total_cp), 1)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-4 sm:p-8 max-w-[1200px] flex flex-col gap-6 sm:gap-7">

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--ad-text)', letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ad-text-3)', marginTop: 4 }}>{today}</p>
        </div>
        <Link
          to="/admin/students"
          className="ad-btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <Users size={13} strokeWidth={2.5} />
          Add Student
        </Link>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard label="Active Students"  value={stats.students} Icon={Users}    accentColor="#e53e3e" loading={loading} delay={0.05} />
        <StatCard label="Events This Month" value={stats.events}  Icon={Calendar} accentColor="#C9A227" loading={loading} delay={0.1}  />
        <StatCard label="CP Awarded Today"  value={stats.cpToday} Icon={Star}     accentColor="#4ade80" loading={loading} delay={0.15} />

        {/* Top student card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="ad-surface rounded-2xl p-5 relative overflow-hidden"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ad-text-3)', marginBottom: 6 }}>
              Top Student
            </p>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            }}>
              <Trophy size={18} strokeWidth={2} />
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <div style={{ height: 16, width: 128, borderRadius: 4, background: 'var(--ad-skeleton)' }}/>
              <div style={{ height: 12, width: 80,  borderRadius: 4, background: 'var(--ad-skeleton)' }}/>
            </div>
          ) : top ? (
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--ad-text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {top.full_name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ad-text-3)', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>{top.cp.toLocaleString()} CP</span>
                {' · '}
                <span style={{ color: CLANS[top.clan]?.colorAccent }}>{CLANS[top.clan]?.name}</span>
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ad-text-4)', marginTop: 4 }}>No data yet</p>
          )}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)',
          }}/>
        </motion.div>
      </div>

      {/* ── Clan race + Activity feed ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Clan race */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="ad-surface rounded-2xl p-4 sm:p-6 lg:col-span-3 flex flex-col gap-5"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ad-text)', margin: 0 }}>Clan Race</h2>
            <Link to="/admin/rankings" style={{ fontSize: 11, color: 'var(--ad-text-3)', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = 'var(--ad-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--ad-text-3)'}
            >
              View rankings →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {[26, 28, 80, undefined].map((w, j) => (
                    <div key={j} style={{
                      width: w, height: j === 2 ? 16 : j === 3 ? 32 : w,
                      flex: j === 3 ? 1 : undefined,
                      borderRadius: j === 1 ? '50%' : j === 3 ? 8 : 7,
                      background: 'var(--ad-skeleton)',
                    }}/>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {clans.map((clan, i) => (
                <ClanRaceBar key={clan.id} clan={clan} maxCp={maxCp} rank={i} delay={i * 0.08} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="ad-surface rounded-2xl p-4 sm:p-6 lg:col-span-2"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ad-text)', margin: 0 }}>Recent Activity</h2>
            <Link to="/admin/cp" style={{ fontSize: 11, color: 'var(--ad-text-3)', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = 'var(--ad-text)'}
              onMouseLeave={e => e.target.style.color = 'var(--ad-text-3)'}
            >
              All awards →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ad-skeleton)', flexShrink: 0 }}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 12, borderRadius: 4, background: 'var(--ad-skeleton)' }}/>
                    <div style={{ height: 10, width: '60%', borderRadius: 4, background: 'var(--ad-skeleton)' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ad-text-4)', textAlign: 'center', padding: '32px 0' }}>
              No activity yet
            </p>
          ) : (
            <div>
              {feed.map((award, i) => (
                <ActivityItem key={award.id} award={award} delay={i * 0.04} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Quick links ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {QUICK_LINKS.map(({ to, label, Icon, color }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.05 }}
          >
            <Link
              to={to}
              className="ad-surface"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 12,
                textDecoration: 'none',
                color: 'var(--ad-text-2)',
                fontSize: 13, fontWeight: 600,
                transition: 'color 0.2s, box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--ad-text)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--ad-text-2)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{
                width: 34, height: 34, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}14`, color, flexShrink: 0,
              }}>
                <Icon size={16} strokeWidth={2} />
              </span>
              {label}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
