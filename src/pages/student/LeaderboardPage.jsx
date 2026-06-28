import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

// ── Podium slot ───────────────────────────────────────────────
// Display order: 2nd (left), 1st (center), 3rd (right)
const PODIUM_ORDER = [1, 0, 2] // index into top-3 array

function PodiumSlot({ student, rank, isMe, accent }) {
  if (!student) return <div className="flex-1" />

  const platformH = rank === 0 ? 'h-20' : rank === 1 ? 'h-14' : 'h-10'
  const medals    = ['🥇', '🥈', '🥉']
  const platColor = rank === 0 ? '#C9A227' : rank === 1 ? '#9CA3AF' : '#92613A'
  const initials  = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const clanAccent = CLANS[student.clan]?.colorAccent ?? '#555'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, type: 'spring', stiffness: 280, damping: 24 }}
      className="flex-1 flex flex-col items-center"
    >
      <span className="text-xl mb-2">{medals[rank]}</span>

      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white mb-1.5"
        style={{
          background:  clanAccent,
          boxShadow:   isMe ? `0 0 0 2px ${accent}, 0 0 0 5px ${accent}33` : 'none',
        }}
      >
        {initials}
      </div>

      <p className={`text-[11px] font-bold truncate w-full text-center px-1 leading-tight ${isMe ? 'text-white' : 'text-white/65'}`}>
        {student.full_name.split(' ')[0]}
      </p>
      <p className="text-[10px] text-white/30 mb-2">{student.cp.toLocaleString()}</p>

      {/* Platform */}
      <div className={`w-full ${platformH} rounded-t-lg`} style={{ background: platColor, opacity: 0.55 }} />
    </motion.div>
  )
}

// ── Row ───────────────────────────────────────────────────────

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
        ? { background: `${accent}15`, border: `1px solid ${accent}33` }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid transparent' }}
    >
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        {medals[rank]
          ? <span className="text-base">{medals[rank]}</span>
          : <span className="text-[11px] font-bold text-white/25">#{rank}</span>}
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
        <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-white/70'}`}>
          {student.full_name}
          {isMe && <span className="ml-1.5 text-[10px]" style={{ color: accent }}>(you)</span>}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px]">{clanInfo?.emoji}</span>
          <span className="text-[10px] text-white/28">{clanInfo?.name}</span>
        </div>
      </div>

      {/* CP */}
      <span className="text-sm font-black shrink-0" style={{ color: isMe ? accent : 'rgba(255,255,255,0.45)' }}>
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

  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3)
  const myEntry = ranked.find(s => s.id === studentRecord?.id)

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-5 pt-12 pb-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-white">Leaderboard</h1>
          {myEntry && (
            <p className="text-sm mt-0.5" style={{ color: accent }}>
              You're #{myEntry.rank} · {studentRecord.cp.toLocaleString()} CP
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <div className="flex rounded-xl overflow-hidden"
             style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[['overall', 'Overall'], ['clan', 'My Clan']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
              style={tab === key
                ? { background: accent, color: '#fff' }
                : { color: 'rgba(255,255,255,0.35)' }}
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
          <p className="text-sm text-white/25">No students found</p>
        </div>
      ) : (
        <>
          {/* ── Podium (overall tab only) ─────────────── */}
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
