import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CLANS } from '@/constants/clans'

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

// ── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, icon, accentColor, loading, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="ad-surface rounded-2xl p-5 relative overflow-hidden group"
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
          background: `${accentColor}18`,
          fontSize: 18,
          transition: 'transform 0.2s',
        }}>
          {icon}
        </div>
      </div>
      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
        transition: 'opacity 0.2s',
      }}/>
    </motion.div>
  )
}

function ClanRaceBar({ clan, maxCp, rank, delay }) {
  const info = CLANS[clan.id]
  const pct  = maxCp > 0 ? (clan.total_cp / maxCp) * 100 : 0
  const rankEmoji = ['🥇', '🥈', '🥉', '4️⃣'][rank]

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{rankEmoji}</span>
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{info?.emoji}</span>
      <div style={{ width: 80, flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ad-text)', lineHeight: 1 }}>
          {clan.name}
          {clan.crown && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ marginLeft: 4 }}
            >👑</motion.span>
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
              {Math.round(pct)}%
            </span>
          )}
        </motion.div>
      </div>
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
      transition={{ delay, duration: 0.22 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0', borderBottom: '1px solid var(--ad-border-2)',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff',
        background: clanInfo?.colorAccent ?? '#555',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--ad-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 600 }}>{award.students?.full_name ?? 'Unknown'}</span>
          {' — '}{formatReason(award.reason)}
        </p>
        <p style={{ fontSize: 10, color: 'var(--ad-text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {award.note}
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

// ── Page ──────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState({ students: 0, events: 0, cpToday: 0 })
  const [clans,   setClans]   = useState([])
  const [top,     setTop]     = useState(null)
  const [feed,    setFeed]    = useState([])

  useEffect(() => {
    async function load() {
      const today      = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()

      const [studentsRes, clansRes, topRes, eventsRes, cpRes, feedRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('clans').select('*').order('total_cp', { ascending: false }),
        supabase.from('students').select('full_name, cp, clan').eq('is_active', true).order('cp', { ascending: false }).limit(1),
        supabase.from('events').select('*', { count: 'exact', head: true }).gte('event_date', monthStart.slice(0, 10)),
        supabase.from('cp_awards').select('amount').gte('created_at', todayStart),
        supabase.from('cp_awards')
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
  }, [])

  const maxCp = Math.max(...clans.map(c => c.total_cp), 1)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div style={{ padding: 32, maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Student
        </Link>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Active Students" value={stats.students} icon="🎓" accentColor="#e53e3e" loading={loading} delay={0.05} />
        <StatCard label="Events This Month" value={stats.events}  icon="📅" accentColor="#C9A227" loading={loading} delay={0.1} />
        <StatCard label="CP Awarded Today"  value={stats.cpToday} icon="⭐" accentColor="#4ade80" loading={loading} delay={0.15} />

        {/* Top student card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="ad-surface rounded-2xl p-5 relative overflow-hidden"
        >
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ad-text-3)', marginBottom: 6 }}>
            Top Student
          </p>
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
            background: 'linear-gradient(90deg, transparent, rgba(150,150,150,0.5), transparent)',
          }}/>
        </motion.div>
      </div>

      {/* ── Clan race + Activity feed ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

        {/* Clan race */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="ad-surface rounded-2xl p-6"
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
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
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {[24, 24, 80, undefined, 72].map((w, j) => (
                    <div key={j} style={{
                      width: w, height: j === 3 ? 32 : 20,
                      flex: j === 3 ? 1 : undefined,
                      borderRadius: j === 3 ? 8 : 4,
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
          className="ad-surface rounded-2xl p-6"
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
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--ad-skeleton)', flexShrink: 0 }}/>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { to: '/admin/students', label: 'Manage Students', icon: '👥', color: '#e53e3e' },
          { to: '/admin/events',   label: 'Create Event',    icon: '📅', color: '#C9A227' },
          { to: '/admin/cp',       label: 'Award CP',        icon: '⭐', color: '#4ade80' },
          { to: '/admin/reset',    label: 'Monthly Reset',   icon: '🔄', color: '#a78bfa' },
        ].map(({ to, label, icon, color }, i) => (
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
                fontSize: 18, width: 34, height: 34, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}14`, flexShrink: 0,
              }}>
                {icon}
              </span>
              {label}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
