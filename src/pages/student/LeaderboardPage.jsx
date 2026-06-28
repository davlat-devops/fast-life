import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'

// ── Clan image with fallback ───────────────────────────────────

function ClanImg({ clanId, size = 40 }) {
  const [err, setErr] = useState(false)
  if (err || !clanId) {
    return (
      <span
        aria-hidden
        style={{
          fontSize: (size ?? 40) * 0.55,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
        }}
      >
        {CLANS[clanId]?.emoji ?? '⚔️'}
      </span>
    )
  }
  return (
    <img
      src={`/clans/${clanId.toLowerCase()}.png`}
      width={size}
      height={size}
      alt=""
      style={{ objectFit: 'cover', display: 'block' }}
      onError={() => setErr(true)}
    />
  )
}

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

// ── Podium slot ───────────────────────────────────────────────

const PODIUM_ORDER = [1, 0, 2]

function PodiumSlot({ student, rank, isMe, accent }) {
  if (!student) return <div className="flex-1" />

  const platformH  = rank === 0 ? 80 : rank === 1 ? 56 : 40
  const medals     = ['🥇', '🥈', '🥉']
  const platColor  = rank === 0 ? '#C9A227' : rank === 1 ? '#9CA3AF' : '#92613A'
  const initials   = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const clanAccent = CLANS[student.clan]?.colorAccent ?? '#555'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, type: 'spring', stiffness: 280, damping: 24 }}
      className="flex-1 flex flex-col items-center"
    >
      <span className="text-xl mb-2">{medals[rank]}</span>

      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white mb-1.5"
        style={{
          background: clanAccent,
          boxShadow: isMe ? `0 0 0 2px ${accent}, 0 0 0 5px ${accent}33` : 'none',
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
      <p className="text-[10px] mb-2 tabular-nums" style={{ color: 'var(--fl-text-3)' }}>
        {student.cp.toLocaleString()}
      </p>

      <div
        className="w-full rounded-t-lg"
        style={{ height: platformH, background: platColor, opacity: 0.55 }}
      />
    </motion.div>
  )
}

// ── Leaderboard row ───────────────────────────────────────────

function LeaderRow({ student, rank, isMe, accent, delay }) {
  const initials  = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const clanInfo  = CLANS[student.clan]
  const medals    = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={isMe
        ? {
            background: `${accent}12`,
            border: `1px solid ${accent}30`,
            boxShadow: `0 0 0 1px ${accent}18`,
          }
        : {
            background: 'var(--fl-card)',
            border: '1px solid var(--fl-border)',
          }}
    >
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        {medals[rank]
          ? <span className="text-base">{medals[rank]}</span>
          : (
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: 'var(--fl-text-3)' }}
            >
              #{rank}
            </span>
          )}
      </div>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
        style={{ background: clanInfo?.colorAccent ?? '#555' }}
      >
        {initials}
      </div>

      {/* Name + clan */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isMe ? 'var(--fl-text)' : 'var(--fl-text-2)' }}
        >
          {student.full_name}
          {isMe && <span className="ml-1.5 text-[10px]" style={{ color: accent }}>(you)</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Tiny clan thumbnail */}
          <div
            className="w-4 h-4 rounded overflow-hidden shrink-0"
            style={{ background: clanInfo?.colorBg ?? '#222' }}
          >
            <ClanImg clanId={student.clan} size={16} />
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
          <h1 className="text-2xl font-black" style={{ color: 'var(--fl-text)' }}>
            Leaderboard
          </h1>
          {myEntry && (
            <p className="text-sm mt-0.5 font-medium" style={{ color: accent }}>
              You're #{myEntry.rank} · {(studentRecord?.cp ?? 0).toLocaleString()} CP
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <div
          className="flex rounded-xl overflow-hidden p-1 gap-1"
          style={{ background: 'var(--fl-card-alt)', border: '1px solid var(--fl-border)' }}
        >
          {[['overall', 'Overall'], ['clan', 'My Clan']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              style={tab === key
                ? { background: accent, color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }
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
        <div className="text-center py-16 space-y-2">
          <span className="text-4xl">🏆</span>
          <p className="text-sm" style={{ color: 'var(--fl-text-3)' }}>No students found</p>
        </div>
      ) : (
        <>
          {/* ── Podium (overall only) ─────────────────── */}
          {tab === 'overall' && top3.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="px-8 mb-6"
            >
              <div className="flex items-end gap-3">
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
