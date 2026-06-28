import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
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
  const pct   = Math.min(((cp - current.min) / (next.min - current.min)) * 100, 100)
  const toNext = next.min - cp
  return { current, next, pct, toNext }
}

// ── Formatting ────────────────────────────────────────────────

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const REASON_META = {
  attendance:             { label: 'Attendance',          emoji: '📋' },
  volunteer:              { label: 'Volunteer',            emoji: '❤️' },
  competition_1st:        { label: '1st Place',            emoji: '🥇' },
  competition_2nd:        { label: '2nd Place',            emoji: '🥈' },
  competition_3rd:        { label: '3rd Place',            emoji: '🥉' },
  referral:               { label: 'Referral',             emoji: '🤝' },
  peer_spotlight:         { label: 'Peer Spotlight',       emoji: '⭐' },
  end_of_month_1st:       { label: '#1 of Month',          emoji: '👑' },
  end_of_month_top5:      { label: 'Top 5 Overall',        emoji: '💎' },
  end_of_month_top5_clan: { label: 'Top 5 in Clan',        emoji: '⚔️' },
  clan_winner_headstart:  { label: 'Clan Head Start',      emoji: '🏆' },
  perfect_month:          { label: 'Perfect Month',        emoji: '💯' },
}
const getReason = (r) => REASON_META[r] ?? { label: r, emoji: '✨' }

// ── Animated CP counter ────────────────────────────────────────

function CPCounter({ target }) {
  const raw      = useMotionValue(0)
  const smoothed = useSpring(raw, { stiffness: 55, damping: 18, mass: 1 })
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (target == null || started.current) return
    started.current = true
    // Small delay so the panel entrance finishes first
    const t = setTimeout(() => {
      raw.set(target)
    }, 200)
    return () => clearTimeout(t)
  }, [target, raw])

  useEffect(() => {
    const unsub = smoothed.on('change', v => setDisplay(Math.round(v)))
    return unsub
  }, [smoothed])

  return <>{display.toLocaleString()}</>
}

// ── Level progress bar ────────────────────────────────────────

function LevelBar({ cp }) {
  const { current, next, pct, toNext } = getLevelProgress(cp)

  return (
    <div className="space-y-1.5">
      {/* Labels */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-white/70">{current.label}</span>
        {next ? (
          <span className="text-white/30">{toNext} CP to {next.label}</span>
        ) : (
          <span className="text-white/30">Max level</span>
        )}
      </div>

      {/* Track */}
      <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.4, duration: 1, type: 'spring', stiffness: 70, damping: 20 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #CC0000, #ff3333)' }}
        />
      </div>
    </div>
  )
}

// ── Activity feed item ────────────────────────────────────────

function ActivityItem({ award, delay }) {
  const { label, emoji } = getReason(award.reason)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22 }}
      className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0"
    >
      {/* Icon circle */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 bg-white/[0.06]">
        {emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate">{label}</p>
        <p className="text-[11px] text-white/35 truncate leading-snug">{award.note}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-emerald-400">+{award.amount}</p>
        <p className="text-[10px] text-white/25">{timeAgo(award.created_at)}</p>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

// ── Quick nav card ────────────────────────────────────────────

function NavCard({ to, emoji, label, accent }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]"
      >
        <span className="text-2xl">{emoji}</span>
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{label}</span>
      </motion.div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { studentRecord } = useAuth()

  const [rank,    setRank]    = useState(null)
  const [total,   setTotal]   = useState(null)
  const [feed,    setFeed]    = useState([])
  const [dataReady, setDataReady] = useState(false)

  const clanInfo  = CLANS[studentRecord?.clan] ?? null
  const cp        = studentRecord?.cp ?? 0

  useEffect(() => {
    if (!studentRecord) return

    async function load() {
      const [rankRes, totalRes, feedRes] = await Promise.all([
        // Count students with strictly more CP (= number of people ahead of me)
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .gt('cp', cp)
          .eq('is_active', true),

        // Total active students for context
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),

        // Recent CP activity for this student
        supabase
          .from('cp_awards')
          .select('id, amount, reason, note, created_at')
          .eq('student_id', studentRecord.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      setRank((rankRes.count ?? 0) + 1)
      setTotal(totalRes.count ?? 0)
      setFeed(feedRes.data ?? [])
      setDataReady(true)
    }

    load()
  }, [studentRecord?.id, cp])

  // Greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  const firstName = studentRecord?.full_name?.split(' ')[0] ?? ''

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Clan-tinted hero header ────────────────────── */}
      <div
        className="relative px-5 pt-12 pb-6 overflow-hidden"
        style={{
          background: clanInfo
            ? `linear-gradient(160deg, ${clanInfo.colorBg}cc 0%, ${clanInfo.colorBg}40 60%, transparent 100%)`
            : 'transparent',
        }}
      >
        {/* Clan mascot watermark */}
        {clanInfo && (
          <div
            className="absolute top-0 right-0 pointer-events-none select-none"
            style={{ fontSize: 120, lineHeight: 1, opacity: 0.07, transform: 'translate(20%, -15%)' }}
            aria-hidden
          >
            {clanInfo.emoji}
          </div>
        )}

        <div className="relative z-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm text-white/40">{today}</p>
            <h1 className="text-2xl font-black text-white mt-0.5 leading-tight">
              {greeting}{firstName ? `, ${firstName}` : '!'}
            </h1>
          </motion.div>

          {/* Clan chip */}
          {clanInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full"
              style={{
                background: `${clanInfo.colorAccent}22`,
                border: `1px solid ${clanInfo.colorAccent}44`,
              }}
            >
              <span className="text-sm">{clanInfo.emoji}</span>
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: clanInfo.colorAccent }}
              >
                {clanInfo.name}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">

        {/* ── CP card ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: '#161616',
            border: `1px solid ${clanInfo ? clanInfo.colorAccent + '30' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          {/* CP number */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-1">
                Community Points
              </p>
              <div
                className="text-5xl font-black leading-none tabular-nums"
                style={{ color: clanInfo?.colorAccent ?? '#CC0000' }}
              >
                {studentRecord ? <CPCounter target={cp} /> : <Skeleton className="w-24 h-12" />}
              </div>
            </div>

            {/* Rank badge */}
            <div className="text-right">
              <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Rank</p>
              {dataReady ? (
                <div>
                  <span className="text-2xl font-black text-white">
                    #{rank}
                  </span>
                  <span className="text-sm text-white/30 ml-1">/ {total}</span>
                </div>
              ) : (
                <Skeleton className="w-16 h-7 ml-auto" />
              )}
            </div>
          </div>

          {/* Level bar */}
          {studentRecord ? (
            <LevelBar cp={cp} />
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="w-16 h-3" />
                <Skeleton className="w-24 h-3" />
              </div>
              <Skeleton className="w-full h-1.5" />
            </div>
          )}

          {/* Level + class group meta */}
          <div className="flex items-center gap-3 pt-1">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <span>{studentRecord?.level ?? '–'}</span>
            </div>
            <span className="text-xs text-white/30">{studentRecord?.class_group ?? ''}</span>
          </div>
        </motion.div>

        {/* ── Activity feed ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
            <Link to="/profile" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
              See all →
            </Link>
          </div>

          {!dataReady ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="w-3/4 h-3" />
                    <Skeleton className="w-1/2 h-2.5" />
                  </div>
                  <Skeleton className="w-10 h-4 shrink-0" />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <span className="text-3xl">🎯</span>
              <p className="text-sm text-white/30">No activity yet — attend events to earn CP!</p>
            </div>
          ) : (
            feed.map((award, i) => (
              <ActivityItem key={award.id} award={award} delay={i * 0.04} />
            ))
          )}
        </motion.div>

        {/* ── Quick nav grid ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="grid grid-cols-4 gap-3"
        >
          <NavCard to="/clan"        emoji={clanInfo?.emoji ?? '👥'} label="Clan"   accent={clanInfo?.colorAccent} />
          <NavCard to="/events"      emoji="📅"                       label="Events" />
          <NavCard to="/leaderboard" emoji="🏆"                       label="Ranks"  />
          <NavCard to="/profile"     emoji="🎖️"                       label="Badges" />
        </motion.div>

      </div>
    </div>
  )
}
