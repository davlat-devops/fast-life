import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { CLANS } from '@/constants/clans'
import { LEVEL_THRESHOLDS } from '@/constants/badges'

// ── Level helpers ──────────────────────────────────────────────

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

// ── Time helper ───────────────────────────────────────────────

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Inline Tabler-style SVG icons ─────────────────────────────

const I = ({ size = 16, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    {...rest}>
    {children}
  </svg>
)

const Icons = {
  calendarCheck: (s) => (
    <I size={s}>
      <rect x="4" y="5" width="16" height="16" rx="2"/>
      <line x1="16" y1="3" x2="16" y2="7"/>
      <line x1="8" y1="3" x2="8" y2="7"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <path d="M9 15l2 2 4-4"/>
    </I>
  ),
  heart: (s) => (
    <I size={s}>
      <path d="M19.5 12.572l-7.5 7.428l-7.5-7.428a5 5 0 1 1 7.5-6.566a5 5 0 1 1 7.5 6.572"/>
    </I>
  ),
  trophy: (s) => (
    <I size={s}>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <path d="M7 4h10l1 7a4 4 0 0 1-8 0a4 4 0 0 1-8 0z"/>
      <path d="M4 7H2v3a3 3 0 0 0 3 3h1M20 7h2v3a3 3 0 0 1-3 3h-1"/>
    </I>
  ),
  star: (s) => (
    <I size={s}>
      <path d="M12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.9-1l3.086-6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/>
    </I>
  ),
  crown: (s) => (
    <I size={s}>
      <path d="M12 6l4 6 5-4-2 12H5L3 8l5 4z"/>
    </I>
  ),
  diamond: (s) => (
    <I size={s}>
      <path d="M6 3h12l4 6-10 13L2 9z"/>
      <path d="M2 9h20M6 3l4 6 2-6 2 6 4-6"/>
    </I>
  ),
  shield: (s) => (
    <I size={s}>
      <path d="M12 3L4 7v5c0 5.25 3.75 10.15 8 11 4.25-.85 8-5.75 8-11V7z"/>
    </I>
  ),
  flag: (s) => (
    <I size={s}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </I>
  ),
  checkCircle: (s) => (
    <I size={s}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 12l2 2 4-4"/>
    </I>
  ),
  userPlus: (s) => (
    <I size={s}>
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </I>
  ),
  sparkle: (s) => (
    <I size={s}>
      <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2zm0-12a2 2 0 0 1 2 2a2 2 0 0 1 2-2a2 2 0 0 1-2-2a2 2 0 0 1-2 2zm-7 12a6 6 0 0 1 6-6a6 6 0 0 1-6-6a6 6 0 0 1-6 6a6 6 0 0 1 6 6z"/>
    </I>
  ),
  // Stat chip icons
  trendUp: (s) => (
    <I size={s}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </I>
  ),
  users: (s) => (
    <I size={s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </I>
  ),
  calendar: (s) => (
    <I size={s}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </I>
  ),
  award: (s) => (
    <I size={s}>
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </I>
  ),
  // Nav icons
  home: (s) => (
    <I size={s}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </I>
  ),
  sun: (s) => (
    <I size={s}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </I>
  ),
  moon: (s) => (
    <I size={s}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </I>
  ),
  barChart: (s) => (
    <I size={s}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </I>
  ),
  user: (s) => (
    <I size={s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </I>
  ),
}

// ── Reason metadata (no emojis, uses icon keys + colors) ──────

const REASON_META = {
  attendance:             { label: 'Attendance',     iconFn: Icons.calendarCheck, color: '#60a5fa' },
  volunteer:              { label: 'Volunteer',       iconFn: Icons.heart,         color: '#f87171' },
  competition_1st:        { label: '1st Place',       iconFn: Icons.trophy,        color: '#C9A227' },
  competition_2nd:        { label: '2nd Place',       iconFn: Icons.trophy,        color: '#9CA3AF' },
  competition_3rd:        { label: '3rd Place',       iconFn: Icons.trophy,        color: '#92613A' },
  referral:               { label: 'Referral',        iconFn: Icons.userPlus,      color: '#a78bfa' },
  peer_spotlight:         { label: 'Peer Spotlight',  iconFn: Icons.star,          color: '#fbbf24' },
  end_of_month_1st:       { label: '#1 of Month',     iconFn: Icons.crown,         color: '#C9A227' },
  end_of_month_top5:      { label: 'Top 5 Overall',   iconFn: Icons.diamond,       color: '#60a5fa' },
  end_of_month_top5_clan: { label: 'Top 5 in Clan',   iconFn: Icons.shield,        color: '#4ade80' },
  clan_winner_headstart:  { label: 'Clan Head Start', iconFn: Icons.flag,          color: '#fb923c' },
  perfect_month:          { label: 'Perfect Month',   iconFn: Icons.checkCircle,   color: '#4ade80' },
}
const getReason = (r) => REASON_META[r] ?? { label: r, iconFn: Icons.sparkle, color: '#94a3b8' }

// ── Animated CP counter ────────────────────────────────────────

function CPCounter({ target }) {
  const raw      = useMotionValue(0)
  const smoothed = useSpring(raw, { stiffness: 55, damping: 18, mass: 1 })
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

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

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton({ w, h, r = 8 }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: 'var(--fl-skeleton)', flexShrink: 0 }}
    />
  )
}

// ── Hero background (image + color base) ─────────────────────

function HeroBg({ clanId, clanBg }) {
  const [err, setErr] = useState(false)
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: clanBg ?? '#111' }} />
      {!err && clanId && (
        <img
          src={`/clans/${clanId.toLowerCase()}.png`}
          alt=""
          style={{
            position:       'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center center',
            display:        'block',
          }}
          onError={() => setErr(true)}
        />
      )}
    </>
  )
}

// ── Tiny clan image for pill (with fallback) ──────────────────

function TinyClanImg({ clanId, size = 20 }) {
  const [err, setErr] = useState(false)
  if (err || !clanId) {
    return (
      <span style={{ fontSize: size * 0.65, lineHeight: 1, display: 'block' }}>
        {CLANS[clanId]?.emoji ?? ''}
      </span>
    )
  }
  return (
    <img
      src={`/clans/${clanId.toLowerCase()}.png`}
      width={size}
      height={size}
      alt=""
      style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      onError={() => setErr(true)}
    />
  )
}

// ── Stat chip ─────────────────────────────────────────────────

function StatChip({ iconFn, label, value, accent }) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          9,
        background:   'var(--fl-card)',
        border:       `1px solid ${accent ? accent + '40' : 'var(--fl-border)'}`,
        borderRadius: 999,
        padding:      '10px 18px 10px 13px',
        flexShrink:   0,
        boxShadow:    'var(--fl-shadow)',
        minHeight:    44,
      }}
    >
      <span style={{ color: accent ?? 'var(--fl-text-3)', display: 'flex', alignItems: 'center' }}>
        {iconFn(18)}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--fl-text-3)', textTransform: 'uppercase', lineHeight: 1.2 }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--fl-text)', lineHeight: 1.2 }}>
          {value}
        </span>
      </div>
    </div>
  )
}

// ── Activity item ─────────────────────────────────────────────

function ActivityItem({ award, delay, accent }) {
  const meta = getReason(award.reason)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22 }}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '10px 0 10px 12px',
        borderLeft:    `3px solid ${accent}55`,
        borderBottom:  '1px solid var(--fl-border-2)',
        marginLeft:    -12,
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width:           44,
          height:          44,
          borderRadius:    '50%',
          background:      meta.color + '1A',
          border:          `1.5px solid ${meta.color}40`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          color:           meta.color,
          flexShrink:      0,
        }}
      >
        {meta.iconFn(18)}
      </div>

      {/* Label + note */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--fl-text)', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.3 }}>
          {meta.label}
        </p>
        {award.note && (
          <p style={{ fontSize: 11, color: 'var(--fl-text-3)', margin: '1px 0 0', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {award.note}
          </p>
        )}
      </div>

      {/* CP pill + time */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span
          style={{
            background:   'rgba(34,197,94,0.14)',
            border:       '1.5px solid rgba(34,197,94,0.35)',
            borderRadius: 999,
            color:        '#22c55e',
            fontSize:     13,
            fontWeight:   800,
            padding:      '4px 11px',
            whiteSpace:   'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          +{award.amount} CP
        </span>
        <span style={{ fontSize: 10, color: 'var(--fl-text-3)' }}>{timeAgo(award.created_at)}</span>
      </div>
    </motion.div>
  )
}

// ── Quick nav card ─────────────────────────────────────────────

function NavCard({ to, iconFn, label, accent }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        style={{
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             10,
          padding:         '20px 12px',
          borderRadius:    16,
          background:      'var(--fl-card)',
          border:          '1px solid var(--fl-border)',
          boxShadow:       'var(--fl-shadow)',
          cursor:          'pointer',
        }}
      >
        <span style={{ color: accent ?? '#CC0000' }}>{iconFn(22)}</span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--fl-text-2)', textTransform: 'uppercase' }}>
          {label}
        </span>
      </motion.div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { studentRecord } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [rank,         setRank]         = useState(null)
  const [total,        setTotal]        = useState(null)
  const [feed,         setFeed]         = useState([])
  const [eventsCount,  setEventsCount]  = useState(null)
  const [badgeCount,   setBadgeCount]   = useState(null)
  const [dataReady,    setDataReady]    = useState(false)

  const clanInfo = CLANS[studentRecord?.clan] ?? null
  const cp       = studentRecord?.cp ?? 0
  const accent   = clanInfo?.colorAccent ?? '#CC0000'

  useEffect(() => {
    if (!studentRecord) return

    async function load() {
      const [rankRes, totalRes, feedRes, eventsRes, badgesRes] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .gt('cp', cp)
          .eq('is_active', true),
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('cp_awards')
          .select('id, amount, reason, note, created_at')
          .eq('student_id', studentRecord.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentRecord.id)
          .eq('present', true)
          .eq('finalised', true),
        supabase
          .from('badges')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentRecord.id),
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
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  const firstName = studentRecord?.full_name?.split(' ')[0] ?? ''
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  const { current: level, next: nextLevel, pct: levelPct, toNext } = getLevelProgress(cp)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--fl-bg)' }}>

      {/* ═══════════════════════════════════════════════════
          HERO — 280px+, clan image fills it end-to-end
          ═══════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', minHeight: 'clamp(320px, 52vw, 400px)', overflow: 'hidden' }}>

        {/* Background layer: clan image covering the full hero */}
        <HeroBg clanId={studentRecord?.clan} clanBg={clanInfo?.colorBg} />

        {/* Vignette ONLY at the bottom where text sits — top of image stays vivid */}
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.40) 32%, rgba(0,0,0,0.05) 58%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* ── Top row: clan pill + theme toggle ── */}
        <div style={{
          position: 'absolute',
          top:      0,
          left:     0,
          right:    0,
          padding:  '14px 16px',
          display:  'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          zIndex:   10,
        }}>
          {/* Clan pill */}
          {clanInfo && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            8,
                background:     `${clanInfo.colorBg ?? '#111'}CC`,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border:         `1px solid ${accent}50`,
                borderRadius:   999,
                padding:        '4px 14px 4px 6px',
                height:         44,
              }}
            >
              <TinyClanImg clanId={studentRecord?.clan} size={36} />
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {clanInfo.name}
              </span>
            </motion.div>
          )}

          {/* Theme toggle — glassmorphism, always dark since hero is dark */}
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              background:     'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border:         '1px solid rgba(255,255,255,0.2)',
              borderRadius:   999,
              width:          36,
              height:         36,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              cursor:         'pointer',
              color:          'rgba(255,255,255,0.85)',
            }}
          >
            {theme === 'dark' ? Icons.sun(16) : Icons.moon(16)}
          </motion.button>
        </div>

        {/* ── Bottom content: name, CP number, level ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            bottom:   0,
            left:     0,
            right:    0,
            padding:  '0 20px 20px',
            zIndex:   10,
          }}
        >
          {/* Date */}
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 2px' }}>
            {today}
          </p>

          {/* Student name */}
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 10px' }}>
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>

          {/* CP + level row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12 }}>
            {/* Animated CP */}
            <div style={{ color: accent, fontSize: 56, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
              {studentRecord ? <CPCounter target={cp} /> : '–'}
            </div>
            <div style={{ paddingBottom: 6 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1 }}>
                CP
              </div>
              {/* Level pill */}
              <div style={{
                marginTop:      4,
                background:     accent + '28',
                backdropFilter: 'blur(6px)',
                border:         `1px solid ${accent}55`,
                borderRadius:   999,
                padding:        '2px 9px',
                color:          accent,
                fontSize:       10,
                fontWeight:     700,
                letterSpacing:  '0.05em',
                display:        'inline-block',
              }}>
                {level.label}
              </div>
            </div>
          </div>

          {/* Level progress bar */}
          <div style={{ maxWidth: 230 }}>
            <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelPct}%` }}
                transition={{ delay: 0.5, duration: 1, type: 'spring', stiffness: 70, damping: 20 }}
                style={{ height: '100%', borderRadius: 999, background: accent }}
              />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, margin: '4px 0 0' }}>
              {nextLevel ? `${toNext.toLocaleString()} CP to ${nextLevel.label}` : 'Max level reached'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════
          STAT CHIPS — horizontal scroll row
          ═══════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.3 }}
        className="overflow-x-auto scrollbar-hide"
        style={{ paddingTop: 16 }}
      >
        <div style={{ display: 'flex', gap: 10, paddingLeft: 20, paddingRight: 20, paddingBottom: 4 }}>
          {/* Rank */}
          {dataReady ? (
            <StatChip
              iconFn={Icons.trendUp}
              label="Rank"
              value={`#${rank} / ${total}`}
              accent={accent}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--fl-card)', border: '1px solid var(--fl-border)', borderRadius: 999, padding: '10px 18px 10px 13px', flexShrink: 0, minHeight: 44 }}>
              <Skeleton w={14} h={14} r={4} />
              <Skeleton w={60} h={22} r={6} />
            </div>
          )}

          {/* Clan */}
          {clanInfo && (
            <StatChip
              iconFn={Icons.shield}
              label="Clan"
              value={clanInfo.name}
              accent={accent}
            />
          )}

          {/* Events attended */}
          {dataReady ? (
            <StatChip
              iconFn={Icons.calendar}
              label="Events"
              value={eventsCount}
              accent="#60a5fa"
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--fl-card)', border: '1px solid var(--fl-border)', borderRadius: 999, padding: '10px 18px 10px 13px', flexShrink: 0, minHeight: 44 }}>
              <Skeleton w={14} h={14} r={4} />
              <Skeleton w={55} h={22} r={6} />
            </div>
          )}

          {/* Badges */}
          {dataReady ? (
            <StatChip
              iconFn={Icons.award}
              label="Badges"
              value={badgeCount}
              accent="#fbbf24"
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--fl-card)', border: '1px solid var(--fl-border)', borderRadius: 999, padding: '10px 18px 10px 13px', flexShrink: 0, minHeight: 44 }}>
              <Skeleton w={14} h={14} r={4} />
              <Skeleton w={55} h={22} r={6} />
            </div>
          )}
        </div>
      </motion.div>

      <div style={{ padding: '12px 20px 24px' }}>

        {/* ═════════════════════════════════════════════════
            RECENT ACTIVITY
            ═════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.32 }}
          style={{
            borderRadius: 16,
            padding:      '16px 16px 4px 16px',
            background:   'var(--fl-card)',
            border:       '1px solid var(--fl-border)',
            boxShadow:    'var(--fl-shadow)',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: 'var(--fl-text)', letterSpacing: '-0.02em', margin: 0 }}>
              Recent Activity
            </h2>
            <Link
              to="/profile"
              style={{ fontSize: 11, fontWeight: 600, color: accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
            >
              See all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          {!dataReady ? (
            <div style={{ paddingBottom: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--fl-border-2)' }}>
                  <Skeleton w={44} h={44} r={999} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Skeleton w="70%" h={12} r={4} />
                    <Skeleton w="45%" h={10} r={4} />
                  </div>
                  <Skeleton w={56} h={22} r={999} />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0 20px', color: 'var(--fl-text-3)', fontSize: 13 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: 'var(--fl-text-3)' }}>
                {Icons.calendar(32)}
              </div>
              No activity yet — attend events to earn CP!
            </div>
          ) : (
            <div style={{ paddingLeft: 12, marginLeft: -12 }}>
              {feed.map((award, i) => (
                <ActivityItem key={award.id} award={award} delay={i * 0.04} accent={accent} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ═════════════════════════════════════════════════
            QUICK NAV 2×2 GRID
            ═════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.32 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
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
