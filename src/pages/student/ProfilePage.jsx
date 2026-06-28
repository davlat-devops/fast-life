import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'
import { BADGES, LEVEL_THRESHOLDS } from '@/constants/badges'

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
  const pct = Math.min(((cp - current.min) / (next.min - current.min)) * 100, 100)
  return { current, next, pct, toNext: next.min - cp }
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
  attendance:             { label: 'Attendance',     emoji: '📋' },
  volunteer:              { label: 'Volunteer',       emoji: '❤️' },
  competition_1st:        { label: '1st Place',       emoji: '🥇' },
  competition_2nd:        { label: '2nd Place',       emoji: '🥈' },
  competition_3rd:        { label: '3rd Place',       emoji: '🥉' },
  referral:               { label: 'Referral',        emoji: '🤝' },
  peer_spotlight:         { label: 'Peer Spotlight',  emoji: '⭐' },
  end_of_month_1st:       { label: '#1 of Month',     emoji: '👑' },
  end_of_month_top5:      { label: 'Top 5 Overall',   emoji: '💎' },
  end_of_month_top5_clan: { label: 'Top 5 in Clan',   emoji: '⚔️' },
  clan_winner_headstart:  { label: 'Clan Head Start', emoji: '🏆' },
  perfect_month:          { label: 'Perfect Month',   emoji: '💯' },
}
const getReason = r => REASON_META[r] ?? { label: r, emoji: '✨' }

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

// ── Page ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { studentRecord, signOut } = useAuth()
  const clanInfo = CLANS[studentRecord?.clan]
  const accent   = clanInfo?.colorAccent ?? '#CC0000'
  const cp       = studentRecord?.cp ?? 0

  const [earnedBadges, setEarnedBadges] = useState([])
  const [history,      setHistory]      = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!studentRecord) return
    Promise.all([
      supabase.from('badges').select('badge_key, earned_at').eq('student_id', studentRecord.id),
      supabase.from('cp_awards').select('*').eq('student_id', studentRecord.id)
        .order('created_at', { ascending: false }),
    ]).then(([badgesRes, historyRes]) => {
      setEarnedBadges(badgesRes.data ?? [])
      setHistory(historyRes.data ?? [])
      setLoading(false)
    })
  }, [studentRecord?.id])

  const earnedKeys = useMemo(
    () => new Set(earnedBadges.map(b => b.badge_key)),
    [earnedBadges]
  )

  const { current: level, next: nextLevel, pct, toNext } = getLevelProgress(cp)

  const allBadges = Object.values(BADGES)
  const initials  = studentRecord?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const joinDate  = studentRecord?.created_at
    ? new Date(studentRecord.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative px-5 pt-12 pb-6 overflow-hidden"
        style={{
          background: clanInfo
            ? `linear-gradient(160deg, ${clanInfo.colorBg}cc 0%, ${clanInfo.colorBg}40 60%, transparent 100%)`
            : 'transparent',
        }}
      >
        {clanInfo && (
          <div
            className="absolute top-0 right-0 pointer-events-none select-none"
            style={{ fontSize: 130, lineHeight: 1, opacity: 0.07, transform: 'translate(20%, -15%)' }}
            aria-hidden
          >
            {clanInfo.emoji}
          </div>
        )}

        <div className="relative z-10">
          {/* Avatar + name row */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0"
              style={{ background: accent }}
            >
              {initials}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h1 className="text-xl font-black text-white leading-tight">{studentRecord?.full_name}</h1>
              <p className="text-[11px] font-mono text-white/35 mt-0.5">@{studentRecord?.username}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {clanInfo && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${accent}22`,
                      color: accent,
                      border: `1px solid ${accent}33`,
                    }}
                  >
                    {clanInfo.emoji} {clanInfo.name}
                  </span>
                )}
                <span className="text-[10px] text-white/30">{studentRecord?.level}</span>
                {studentRecord?.class_group && (
                  <>
                    <span className="text-[10px] text-white/20">·</span>
                    <span className="text-[10px] text-white/30">{studentRecord.class_group}</span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Level progress */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-5 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-white/70">{level.label}</span>
              {nextLevel
                ? <span className="text-white/30">{toNext} CP to {nextLevel.label}</span>
                : <span className="text-white/30">Max level</span>}
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.5, duration: 1, type: 'spring', stiffness: 70, damping: 20 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }}
              />
            </div>
          </motion.div>

          {/* CP total */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-[11px] text-white/35 mt-2"
          >
            {cp.toLocaleString()} CP · joined {joinDate}
          </motion.p>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">

        {/* ── Badges ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Badges</h2>
            <span className="text-[11px] text-white/30">
              {loading ? '…' : `${earnedKeys.size} / ${allBadges.length}`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {allBadges.map((badge, i) => {
                const earned = earnedKeys.has(badge.key)
                return (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.025 }}
                    title={`${badge.label}: ${badge.description}`}
                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-default"
                    style={earned
                      ? { background: `${accent}1a`, border: `1px solid ${accent}40` }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span
                      className="text-xl leading-none"
                      style={{ filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.2 }}
                    >
                      {badge.icon}
                    </span>
                    <span
                      className="text-[8px] font-bold text-center leading-none px-0.5"
                      style={{ color: earned ? accent : 'rgba(255,255,255,0.2)' }}
                    >
                      {badge.label.split(' ')[0]}
                    </span>
                    {earned && (
                      <div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: accent }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── CP History ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="rounded-2xl p-5"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">CP History</h2>
            {history.length > 0 && (
              <span className="text-[11px] text-white/30">{history.length} awards</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="w-3/4 h-3" />
                    <Skeleton className="w-1/2 h-2.5" />
                  </div>
                  <Skeleton className="w-10 h-4 shrink-0" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl">🎯</span>
              <p className="text-sm text-white/25 mt-2">No CP earned yet — attend events to start!</p>
            </div>
          ) : (
            history.map((award, i) => {
              const { label, emoji } = getReason(award.reason)
              return (
                <motion.div
                  key={award.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0"
                >
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
            })
          )}
        </motion.div>

        {/* ── Sign out ─────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={signOut}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white/35 hover:text-white/65 border border-white/[0.07] hover:bg-white/[0.04] transition-all"
        >
          Sign out
        </motion.button>

      </div>
    </div>
  )
}
