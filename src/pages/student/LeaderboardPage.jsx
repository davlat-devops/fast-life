import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

// ── Podium slot ───────────────────────────────────────────────

const PODIUM_ORDER = [1, 0, 2]

const RANK_STYLE = [
  { platH: 90,  bg: 'linear-gradient(180deg, #C9A227 0%, #8B6914 100%)', badge: '#C9A227', text: '#FEF3C7', num: '1' },
  { platH: 65,  bg: 'linear-gradient(180deg, #9CA3AF 0%, #6B7280 100%)', badge: '#9CA3AF', text: '#F3F4F6', num: '2' },
  { platH: 45,  bg: 'linear-gradient(180deg, #92613A 0%, #5C3A1E 100%)', badge: '#92613A', text: '#FDE8D0', num: '3' },
]

function PodiumSlot({ student, rank, isMe, accent }) {
  if (!student) return <div className="flex-1" />

  const rs         = RANK_STYLE[rank]
  const initials   = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const clanAccent = CLANS[student.clan]?.colorAccent ?? '#555'
  const avatarSize = rank === 0 ? 62 : 48

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, type: 'spring', stiffness: 280, damping: 24 }}
      className="flex-1 flex flex-col items-center"
    >
      {/* Rank badge */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black mb-2"
        style={{ background: rs.bg, color: rs.text, boxShadow: `0 2px 8px ${rs.badge}55` }}
      >
        {rs.num}
      </div>

      {/* Avatar */}
      <div
        className="rounded-full flex items-center justify-center font-black text-white mb-1.5"
        style={{
          width:     avatarSize,
          height:    avatarSize,
          background: clanAccent,
          fontSize:  avatarSize * 0.32,
          boxShadow: isMe
            ? `0 0 0 3px ${accent}, 0 0 20px ${accent}60`
            : `0 0 0 2px ${rs.badge}55`,
        }}
      >
        {initials}
      </div>

      <p
        className="text-[11px] font-bold truncate w-full text-center px-1 leading-tight"
        style={{ color: isMe ? 'var(--fl-text)' : 'var(--fl-text-2)' }}
      >
        {student.full_name.split(' ')[0]}
      </p>
      <p
        className="text-[10px] font-semibold mb-3 tabular-nums"
        style={{ color: rs.badge }}
      >
        {student.cp.toLocaleString()} CP
      </p>

      {/* Platform */}
      <div
        className="w-full rounded-t-xl flex items-start justify-center pt-2"
        style={{
          height:     rs.platH,
          background: `linear-gradient(180deg, ${rs.badge}44, ${rs.badge}18)`,
          border:     `1px solid ${rs.badge}44`,
          borderBottom: 'none',
        }}
      >
        <span className="text-lg font-black" style={{ color: `${rs.badge}cc` }}>
          {rs.num}
        </span>
      </div>
    </motion.div>
  )
}

// ── Leaderboard row ───────────────────────────────────────────

function LeaderRow({ student, rank, isMe, accent, delay }) {
  const initials   = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const clanInfo   = CLANS[student.clan]
  const rankColors = { 1: '#C9A227', 2: '#9CA3AF', 3: '#92613A' }

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={isMe
        ? {
            background: `${accent}12`,
            border: `1px solid ${accent}35`,
            boxShadow: `0 0 0 1px ${accent}18`,
          }
        : {
            background: 'var(--fl-card)',
            border: '1px solid var(--fl-border)',
          }}
    >
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        <span
          className="text-[11px] font-black tabular-nums"
          style={{ color: rankColors[rank] ?? (isMe ? accent : 'var(--fl-text-3)') }}
        >
          #{rank}
        </span>
      </div>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
        style={{
          background: clanInfo?.colorAccent ?? '#555',
          boxShadow: isMe ? `0 0 0 2px ${accent}50` : 'none',
        }}
      >
        {initials}
      </div>

      {/* Name + clan badge */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isMe ? 'var(--fl-text)' : 'var(--fl-text-2)' }}
        >
          {student.full_name}
          {isMe && <span className="ml-1.5 text-[10px]" style={{ color: accent }}>(you)</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className="w-4 h-4 rounded flex items-center justify-center font-black text-white shrink-0"
            style={{ background: clanInfo?.colorAccent ?? '#555', fontSize: 7 }}
          >
            {clanInfo?.name?.[0] ?? '?'}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--fl-text-3)' }}>{clanInfo?.name}</span>
        </div>
      </div>

      {/* CP */}
      <span
        className="text-sm font-black shrink-0 tabular-nums"
        style={{ color: isMe ? accent : 'var(--fl-text-2)' }}
      >
        {student.cp.toLocaleString()}
      </span>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { studentRecord } = useAuth()
  const accent = CLANS[studentRecord?.clan]?.colorAccent ?? '#CC0000'

  const [all,     setAll]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('overall')

  useEffect(() => {
    if (!studentRecord) return
    supabase
      .from('students')
      .select('id, full_name, cp, clan, level, username')
      .eq('is_active', true)
      .order('cp', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setAll(data ?? [])
        setLoading(false)
      })
  }, [studentRecord?.id])

  const ranked = useMemo(() => {
    const list = tab === 'clan'
      ? all.filter(s => s.clan === studentRecord?.clan)
      : all
    return list.map((s, i) => ({ ...s, rank: i + 1 }))
  }, [all, tab, studentRecord?.clan])

  const top3    = ranked.slice(0, 3)
  const rest    = ranked.slice(3)
  const myEntry = ranked.find(s => s.id === studentRecord?.id)

  return (
    <div className="min-h-screen" style={{ background: 'var(--fl-bg)' }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-0.5">
            <Trophy size={22} style={{ color: accent }} />
            <h1 className="text-2xl font-black" style={{ color: 'var(--fl-text)' }}>Leaderboard</h1>
          </div>
          {myEntry && (
            <p className="text-sm mt-0.5 font-medium" style={{ color: accent }}>
              You are #{myEntry.rank} · {(studentRecord?.cp ?? 0).toLocaleString()} CP
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Tabs (premium pill) ─────────────────────────── */}
      <div className="px-5 mb-5">
        <div
          className="flex rounded-2xl overflow-hidden p-1 gap-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[['overall', 'Overall'], ['clan', 'My Clan']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              style={tab === key
                ? {
                    background: accent,
                    color: '#fff',
                    boxShadow: `0 2px 12px ${accent}50`,
                  }
                : { color: 'var(--fl-text-3)', background: 'transparent' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="flex justify-center">
            <Trophy size={44} style={{ color: 'var(--fl-text-3)', opacity: 0.5 }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--fl-text-3)' }}>No students found</p>
        </div>
      ) : (
        <>
          {/* ── Podium ───────────────────────────────── */}
          {tab === 'overall' && top3.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="px-6 mb-8"
            >
              <div className="flex items-end gap-2">
                {PODIUM_ORDER.map(idx => (
                  <PodiumSlot
                    key={idx}
                    student={top3[idx]}
                    rank={idx}
                    isMe={top3[idx]?.id === studentRecord?.id}
                    accent={accent}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Ranked list ──────────────────────────── */}
          <div className="px-5 pb-6 space-y-2">
            {(tab === 'overall' ? rest : ranked).map((s, i) => (
              <LeaderRow
                key={s.id}
                student={s}
                rank={s.rank}
                isMe={s.id === studentRecord?.id}
                accent={accent}
                delay={i * 0.02}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
