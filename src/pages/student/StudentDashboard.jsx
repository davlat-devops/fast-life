import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { CLANS } from '@/constants/clans'
import { LEVEL_THRESHOLDS } from '@/constants/badges'
import HeroSlideshow from '@/components/student/HeroSlideshow'

// ── Level helpers ─────────────────────────────────────────────

const LEVELS = [...LEVEL_THRESHOLDS].sort((a, b) => a.min - b.min)

function getLevel(cp) {
  return [...LEVELS].reverse().find(l => cp >= l.min) ?? LEVELS[0]
}

function getLevelProgress(cp) {
  const current = getLevel(cp)
  const nextIdx = LEVELS.findIndex(l => l.key === current.key) + 1
  const next    = LEVELS[nextIdx] ?? null
  if (!next) return { current, next: null, pct: 100, toNext: 0 }
  const pct    = Math.min(((cp - current.min) / (next.min - current.min)) * 100, 100)
  const toNext = next.min - cp
  return { current, next, pct, toNext }
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Inline SVG icon set ───────────────────────────────────────

const I = ({ size = 16, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    {...rest}>
    {children}
  </svg>
)

const Icons = {
  calendarCheck: s => <I size={s}><rect x="4" y="5" width="16" height="16" rx="2"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="4" y1="11" x2="20" y2="11"/><path d="M9 15l2 2 4-4"/></I>,
  heart:         s => <I size={s}><path d="M19.5 12.572l-7.5 7.428l-7.5-7.428a5 5 0 1 1 7.5-6.566a5 5 0 1 1 7.5 6.572"/></I>,
  trophy:        s => <I size={s}><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4h10l1 7a4 4 0 0 1-8 0a4 4 0 0 1-8 0z"/><path d="M4 7H2v3a3 3 0 0 0 3 3h1M20 7h2v3a3 3 0 0 1-3 3h-1"/></I>,
  star:          s => <I size={s}><path d="M12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.9-1l3.086-6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/></I>,
  crown:         s => <I size={s}><path d="M12 6l4 6 5-4-2 12H5L3 8l5 4z"/></I>,
  diamond:       s => <I size={s}><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20M6 3l4 6 2-6 2 6 4-6"/></I>,
  shield:        s => <I size={s}><path d="M12 3L4 7v5c0 5.25 3.75 10.15 8 11 4.25-.85 8-5.75 8-11V7z"/></I>,
  flag:          s => <I size={s}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></I>,
  checkCircle:   s => <I size={s}><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></I>,
  userPlus:      s => <I size={s}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></I>,
  sparkle:       s => <I size={s}><path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2zm0-12a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2zm-7 12a6 6 0 0 1 6-6a6 6 0 0 1-6-6a6 6 0 0 1-6 6a6 6 0 0 1 6 6z"/></I>,
  trendUp:       s => <I size={s}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></I>,
  users:         s => <I size={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></I>,
  calendar:      s => <I size={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>,
  award:         s => <I size={s}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></I>,
  barChart:      s => <I size={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></I>,
  user:          s => <I size={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I>,
  sun:           s => <I size={s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></I>,
  moon:          s => <I size={s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></I>,
}

const REASON_META = {
  attendance:             { label: 'Attendance',    iconFn: Icons.calendarCheck, color: '#60a5fa' },
  volunteer:              { label: 'Volunteer',      iconFn: Icons.heart,         color: '#f87171' },
  competition_1st:        { label: '1st Place',      iconFn: Icons.trophy,        color: '#C9A227' },
  competition_2nd:        { label: '2nd Place',      iconFn: Icons.trophy,        color: '#9CA3AF' },
  competition_3rd:        { label: '3rd Place',      iconFn: Icons.trophy,        color: '#92613A' },
  referral:               { label: 'Referral',       iconFn: Icons.userPlus,      color: '#a78bfa' },
  peer_spotlight:         { label: 'Peer Spotlight', iconFn: Icons.star,          color: '#fbbf24' },
  end_of_month_1st:       { label: '#1 of Month',    iconFn: Icons.crown,         color: '#C9A227' },
  end_of_month_top5:      { label: 'Top 5 Overall',  iconFn: Icons.diamond,       color: '#60a5fa' },
  end_of_month_top5_clan: { label: 'Top 5 in Clan',  iconFn: Icons.shield,        color: '#4ade80' },
  clan_winner_headstart:  { label: 'Clan Head Start',iconFn: Icons.flag,          color: '#fb923c' },
  perfect_month:          { label: 'Perfect Month',  iconFn: Icons.checkCircle,   color: '#4ade80' },
}
const getReason = r => REASON_META[r] ?? { label: r, iconFn: Icons.sparkle, color: '#94a3b8' }

// ── Animated CP counter ───────────────────────────────────────

function CPCounter({ target }) {
  const raw      = useMotionValue(0)
  const smoothed = useSpring(raw, { stiffness: 55, damping: 18, mass: 1 })
  const [display, setDisplay] = useState(0)
  const started  = useRef(false)

  useEffect(() => {
    if (target == null || started.current) return
    started.current = true
    const t = setTimeout(() => { raw.set(target) }, 300)
    return () => clearTimeout(t)
  }, [target, raw])

  useEffect(() => {
    const unsub = smoothed.on('change', v => setDisplay(Math.round(v)))
    return unsub
  }, [smoothed])

  return <>{display.toLocaleString()}</>
}

function Skeleton({ w, h, r = 8 }) {
  return (
    <div className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: 'var(--fl-skeleton)', flexShrink: 0 }} />
  )
}

// ── Clan letter badge ─────────────────────────────────────────

function ClanLetterBadge({ clanId, accent }) {
  const info   = CLANS[clanId]
  const letter = info?.name[0]?.toUpperCase() ?? '?'
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 900, color: '#fff',
      background: `${accent}28`,
      border: `1.5px solid ${accent}55`,
      backdropFilter: 'blur(8px)',
      boxShadow: `0 0 12px ${accent}35`,
      letterSpacing: '-0.02em',
    }}>
      {letter}
    </div>
  )
}

// ── Rank badge ────────────────────────────────────────────────

const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309']

function RankBadge({ rank, total }) {
  const isTop3 = rank != null && rank <= 3
  const color  = rank != null ? (MEDAL_COLORS[rank - 1] ?? 'rgba(255,255,255,0.45)') : 'rgba(255,255,255,0.3)'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 10px', borderRadius: 10,
      background: isTop3 ? `${color}20` : 'rgba(255,255,255,0.08)',
      border: `1px solid ${isTop3 ? color + '50' : 'rgba(255,255,255,0.15)'}`,
      backdropFilter: 'blur(8px)',
      boxShadow: isTop3 ? `0 0 14px ${color}28` : 'none',
      minWidth: 48,
    }}>
      <span style={{
        fontSize: 16, fontWeight: 900, color, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
        textShadow: isTop3 ? `0 0 10px ${color}70` : 'none',
      }}>
        {rank != null ? `#${rank}` : '—'}
      </span>
      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginTop: 1 }}>
        {total != null ? `of ${total}` : 'rank'}
      </span>
    </div>
  )
}

// ── Glass stat card ───────────────────────────────────────────

function StatCard({ iconFn, label, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, boxShadow: `0 8px 20px ${accent}22, 0 0 0 1px ${accent}28` }}
      style={{
        flex: '1 1 0', minWidth: 60,
        padding: '10px 8px 8px',
        borderRadius: 14,
        background: 'var(--fl-card)',
        border: `1px solid ${accent}25`,
        boxShadow: `0 0 0 1px ${accent}08, var(--fl-shadow)`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 5,
        cursor: 'default',
        transition: 'box-shadow 0.2s',
      }}
    >
      <span style={{ color: accent, opacity: 0.85 }}>{iconFn(14)}</span>
      <div>
        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--fl-text)', lineHeight: 1, margin: 0 }}>
          {value ?? <Skeleton w={28} h={16} r={4} />}
        </p>
        <p style={{ fontSize: 8, fontWeight: 600, color: 'var(--fl-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '2px 0 0' }}>
          {label}
        </p>
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
      }}/>
    </motion.div>
  )
}

// ── Activity item ─────────────────────────────────────────────

function ActivityItem({ award, delay, accent }) {
  const meta = getReason(award.reason)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0 8px 12px',
        borderLeft: `2.5px solid ${meta.color}50`,
        borderBottom: '1px solid var(--fl-border-2)',
        marginLeft: -12,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: meta.color + '16',
        border: `1px solid ${meta.color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: meta.color,
      }}>
        {meta.iconFn(14)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fl-text)', margin: 0, lineHeight: 1.3 }}>
          {meta.label}
        </p>
        {award.note && (
          <p style={{ fontSize: 10, color: 'var(--fl-text-3)', margin: '1px 0 0', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {award.note}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span style={{
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.30)',
          borderRadius: 999, color: '#22c55e',
          fontSize: 11, fontWeight: 700,
          padding: '2px 8px', whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
          textShadow: '0 0 6px rgba(34,197,94,0.35)',
        }}>
          +{award.amount} CP
        </span>
        <span style={{ fontSize: 9, color: 'var(--fl-text-3)' }}>{timeAgo(award.created_at)}</span>
      </div>
    </motion.div>
  )
}

// ── Quick nav card ────────────────────────────────────────────

function NavCard({ to, iconFn, label, accent }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 7,
          padding: '13px 10px',
          borderRadius: 16,
          background: 'var(--fl-card)',
          border: `1px solid ${accent}22`,
          boxShadow: `0 0 0 1px ${accent}06, var(--fl-shadow)`,
          cursor: 'pointer',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <span style={{ color: accent ?? '#CC0000' }}>{iconFn(18)}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.03em', color: 'var(--fl-text-2)', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 50, height: 50,
          background: `radial-gradient(circle at top left, ${accent}14, transparent 70%)`,
          pointerEvents: 'none',
        }}/>
      </motion.div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { studentRecord } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [rank,        setRank]        = useState(null)
  const [total,       setTotal]       = useState(null)
  const [feed,        setFeed]        = useState([])
  const [eventsCount, setEventsCount] = useState(null)
  const [badgeCount,  setBadgeCount]  = useState(null)
  const [dataReady,   setDataReady]   = useState(false)

  const clanInfo = CLANS[studentRecord?.clan] ?? null
  const cp       = studentRecord?.cp ?? 0
  const accent   = clanInfo?.colorAccent ?? '#CC0000'

  useEffect(() => {
    if (!studentRecord) return
    async function load() {
      const [rankRes, totalRes, feedRes, eventsRes, badgesRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).gt('cp', cp).eq('is_active', true),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('cp_awards').select('id, amount, reason, note, created_at').eq('student_id', studentRecord.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', studentRecord.id).eq('present', true).eq('finalised', true),
        supabase.from('badges').select('*', { count: 'exact', head: true }).eq('student_id', studentRecord.id),
      ])
      setRank((rankRes.count ?? 0) + 1)
      setTotal(totalRes.count ?? 0)
      setFeed(feedRes.data ?? [])
      setEventsCount(eventsRes.count ?? 0)
      setBadgeCount(badgesRes.count ?? 0)
      setDataReady(true)
    }
    load()
  }, [studentRecord?.id, cp])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = studentRecord?.full_name?.split(' ')[0] ?? ''
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const { current: level, next: nextLevel, pct: levelPct, toNext } = getLevelProgress(cp)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fl-bg)' }}>

      {/* ════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', minHeight: 'clamp(220px, 45vh, 300px)', overflow: 'hidden' }}>

        <HeroSlideshow />
        {/* Bottom fade blends photo into page background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, var(--fl-bg) 0%, rgba(0,0,0,0.18) 40%, transparent 72%)',
        }} />

        {/* ── Top row: clan badge + rank badge + theme toggle ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10,
        }}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {clanInfo && (
              <>
                <ClanLetterBadge clanId={studentRecord?.clan} accent={accent} />
                <div>
                  <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
                    {clanInfo.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 9, margin: 0, letterSpacing: '0.04em' }}>
                    Clan
                  </p>
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {dataReady && <RankBadge rank={rank} total={total} />}

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 999, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
              }}
            >
              {theme === 'dark' ? Icons.sun(13) : Icons.moon(13)}
            </button>
          </motion.div>
        </div>

        {/* ── Bottom: greeting, CP, level progress ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 16px 14px', zIndex: 10,
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
            {today}
          </p>

          <h1 style={{
            color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em',
            lineHeight: 1.2, margin: '0 0 10px',
            textShadow: '0 2px 16px rgba(0,0,0,0.4)',
          }}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
            <div style={{
              color: accent,
              fontSize: 44, fontWeight: 900, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
              textShadow: `0 0 22px ${accent}70, 0 0 44px ${accent}28`,
            }}>
              {studentRecord ? <CPCounter target={cp} /> : '–'}
            </div>
            <div style={{ paddingBottom: 5 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', lineHeight: 1 }}>
                CP
              </div>
              <div style={{
                marginTop: 4,
                background: `${accent}24`,
                backdropFilter: 'blur(6px)',
                border: `1px solid ${accent}50`,
                borderRadius: 999, padding: '2px 8px',
                color: accent, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.04em', display: 'inline-block',
                textShadow: `0 0 6px ${accent}55`,
              }}>
                {level.label}
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 200 }}>
            <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelPct}%` }}
                transition={{ delay: 0.5, duration: 1.1, type: 'spring', stiffness: 65, damping: 18 }}
                style={{
                  height: '100%', borderRadius: 999,
                  background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                  boxShadow: `0 0 8px ${accent}70`,
                }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '4px 0 0' }}>
              {nextLevel ? `${toNext.toLocaleString()} CP to ${nextLevel.label}` : 'Max level reached'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════
          STAT CARDS
          ════════════════════════════════════════════════ */}
      <div style={{ padding: '10px 12px 0', display: 'flex', gap: 8 }}>
        <StatCard iconFn={Icons.trendUp} label="Rank"   value={dataReady ? `#${rank}` : null}       accent={accent}    delay={0.12} />
        <StatCard iconFn={Icons.shield}  label="Clan"   value={clanInfo?.name ?? '—'}                accent={accent}    delay={0.18} />
        <StatCard iconFn={Icons.calendar} label="Events" value={dataReady ? eventsCount : null}       accent="#60a5fa"   delay={0.24} />
        <StatCard iconFn={Icons.award}   label="Badges" value={dataReady ? badgeCount : null}        accent="#fbbf24"   delay={0.30} />
      </div>

      <div style={{ padding: '10px 12px 16px' }}>

        {/* ════════════════════════════════════════════════
            RECENT ACTIVITY
            ════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.3 }}
          style={{
            borderRadius: 16, padding: '12px 12px 4px 12px',
            background: 'var(--fl-card)',
            border: '1px solid var(--fl-border)',
            boxShadow: 'var(--fl-shadow)',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--fl-text)', letterSpacing: '-0.01em', margin: 0 }}>
              Recent Activity
            </h2>
            <Link to="/profile" style={{ fontSize: 10, fontWeight: 600, color: accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              See all
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          {!dataReady ? (
            <div style={{ paddingBottom: 8 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--fl-border-2)' }}>
                  <Skeleton w={32} h={32} r={999} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Skeleton w="65%" h={11} r={4} />
                    <Skeleton w="42%" h={9} r={4} />
                  </div>
                  <Skeleton w={52} h={20} r={999} />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0 14px', color: 'var(--fl-text-3)', fontSize: 12 }}>
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                {Icons.calendar(22)}
              </div>
              No activity yet — attend events to earn CP!
            </div>
          ) : (
            <div style={{ paddingLeft: 12, marginLeft: -12 }}>
              {feed.map((award, i) => (
                <ActivityItem key={award.id} award={award} delay={i * 0.035} accent={accent} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ════════════════════════════════════════════════
            QUICK NAV 2×2
            ════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          <NavCard to="/clan"        iconFn={Icons.users}    label="My Clan"  accent={accent} />
          <NavCard to="/events"      iconFn={Icons.calendar} label="Events"   accent={accent} />
          <NavCard to="/leaderboard" iconFn={Icons.barChart} label="Rankings" accent={accent} />
          <NavCard to="/profile"     iconFn={Icons.user}     label="Profile"  accent={accent} />
        </motion.div>

      </div>
    </div>
  )
}
