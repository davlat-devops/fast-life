import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CLANS, CLAN_NAMES } from '@/constants/clans'
import { CP_RULES } from '@/constants/cp'
import { useToast } from '@/contexts/ToastContext'

// ── Constants ─────────────────────────────────────────────────

const MONTH_LABEL = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

const WHAT_HAPPENS = [
  {
    icon: '👑',
    title: '#1 Student of the Month',
    detail: `Monthly Legend badge  ·  +${CP_RULES.END_OF_MONTH_1ST} CP bonus`,
    color: '#C9A227',
  },
  {
    icon: '💎',
    title: 'Top 5 Overall',
    detail: `Fast Life Elite badge  ·  +${CP_RULES.END_OF_MONTH_TOP5} CP bonus each`,
    color: '#60a5fa',
  },
  {
    icon: '⚔️',
    title: 'Top 5 per Clan  (4 × 5 = up to 20 students)',
    detail: `Clan Warrior badge  ·  +${CP_RULES.END_OF_MONTH_TOP5_PER_CLAN} CP bonus each`,
    color: '#f87171',
  },
  {
    icon: '🏆',
    title: 'Winning Clan — all members',
    detail: 'Clan Champion badge awarded to all winning-clan members',
    color: '#4ade80',
  },
  {
    icon: '📖',
    title: 'Hall of Fame entry',
    detail: `${MONTH_LABEL} results archived permanently`,
    color: '#a78bfa',
  },
  {
    icon: '🔀',
    title: 'Clan reshuffle',
    detail: 'All students randomly redistributed across all 4 clans',
    color: '#fb923c',
  },
  {
    icon: '🔄',
    title: 'CP reset to zero',
    detail: 'Everyone starts the new month at 0 CP',
    color: '#94a3b8',
  },
]

// ── Helpers ───────────────────────────────────────────────────

function initials(name) {
  return (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

// ── Sub-components ─────────────────────────────────────────────

function Avatar({ name, clan, size = 8 }) {
  const accent = CLANS[clan]?.colorAccent ?? '#555'
  return (
    <div
      className={`w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center
        text-[11px] font-bold text-white`}
      style={{ background: accent }}
    >
      {initials(name)}
    </div>
  )
}

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) return <span className="text-lg shrink-0">{medals[rank]}</span>
  return (
    <span className="text-sm font-bold text-white/30 w-6 text-center shrink-0">#{rank}</span>
  )
}

// ── Preview: top-5 overall ─────────────────────────────────────

function Top5Card({ students, loading }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Top 5 Overall</h2>
        <span className="text-xs text-white/30">by CP this month</span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Skeleton className="w-6 h-5" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="w-36 h-4" />
                  <Skeleton className="w-20 h-3" />
                </div>
                <Skeleton className="w-12 h-5" />
              </div>
            ))
          : students.map((s, i) => {
              const clanInfo = CLANS[s.clan]
              const badges = i === 0
                ? [{ icon: '👑', label: 'Monthly Legend' }]
                : [{ icon: '💎', label: 'Fast Life Elite' }]

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-5 py-3
                    ${i === 0 ? 'bg-amber-950/20' : ''}`}
                >
                  <RankBadge rank={i + 1} />
                  <Avatar name={s.full_name} clan={s.clan} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px]">{clanInfo?.emoji}</span>
                      <span className="text-[10px] text-white/30">{clanInfo?.name}</span>
                      {badges.map(b => (
                        <span key={b.label} className="text-[10px] text-white/25">
                          · {b.icon} {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-black text-white shrink-0">
                    {s.cp.toLocaleString()} <span className="text-white/30 font-normal text-xs">CP</span>
                  </span>
                </motion.div>
              )
            })}
      </div>
    </div>
  )
}

// ── Preview: clan standings ────────────────────────────────────

function ClanCard({ clan, topMembers, rank, isWinner, loading, delay }) {
  const info = CLANS[clan.id]
  const medals = ['🥇', '🥈', '🥉', '4️⃣']

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'var(--ad-surface)',
        border: `1px solid ${isWinner ? info?.colorAccent + '40' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      {/* Clan header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{medals[rank]}</span>
          <span className="text-2xl">{info?.emoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">{clan.name}</h3>
              {isWinner && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-amber-300"
                  style={{ background: 'rgba(201,162,39,0.15)' }}>
                  👑 WINNER
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/30 mt-0.5">
              {loading ? '…' : `${clan.total_cp.toLocaleString()} CP total`}
            </p>
          </div>
        </div>
        {isWinner && (
          <span className="text-[10px] text-emerald-400 font-semibold">
            Clan Champion badge
          </span>
        )}
      </div>

      {/* Top 3 members */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/25">Top 3 Members</p>
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="w-5 h-4" />
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="flex-1 h-3.5" />
                <Skeleton className="w-10 h-3.5" />
              </div>
            ))
          : topMembers.length === 0
            ? <p className="text-xs text-white/20 py-1">No members</p>
            : topMembers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <span className="text-sm w-5 text-center shrink-0">
                    {['🥇', '🥈', '🥉'][i]}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center
                      text-[9px] font-bold text-white"
                    style={{ background: info?.colorAccent ?? '#555' }}
                  >
                    {initials(s.full_name)}
                  </div>
                  <span className="text-xs text-white/70 flex-1 truncate">{s.full_name}</span>
                  <span className="text-xs font-bold text-white/50 shrink-0">
                    {s.cp.toLocaleString()}
                  </span>
                </div>
              ))
        }
      </div>
    </motion.div>
  )
}

// ── What Will Happen list ──────────────────────────────────────

function ActionList() {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <h2 className="text-sm font-bold text-white">What Will Happen</h2>
        <p className="text-xs text-white/30 mt-0.5">In this exact order, irreversibly</p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {WHAT_HAPPENS.map((item, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <div
              className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base"
              style={{ background: `${item.color}18` }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{item.detail}</p>
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: `${item.color}15`, color: item.color }}
            >
              Step {i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Danger zone ────────────────────────────────────────────────

function DangerZone({ studentCount, confirm, setConfirm, onExecute, disabled }) {
  const ready = confirm === 'RESET'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl p-6 space-y-5"
      style={{
        background: 'var(--ad-red-dim)',
        border: '1px solid rgba(204,0,0,0.3)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Warning */}
      <div className="flex items-start gap-3">
        <svg className="shrink-0 mt-0.5" width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="var(--ad-red)" strokeWidth="2" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ad-red)', marginBottom: 4 }}>
            This action cannot be undone
          </p>
          <p style={{ fontSize: 12, color: 'var(--ad-text-2)', lineHeight: 1.6 }}>
            Executing the reset will immediately award all badges, archive{' '}
            <span style={{ color: 'var(--ad-text)', fontWeight: 600 }}>{MONTH_LABEL}</span> to the Hall of Fame,
            reshuffle all{' '}
            <span style={{ color: 'var(--ad-text)', fontWeight: 600 }}>{studentCount} students</span>{' '}
            into new clans, and set everyone's CP to zero.
          </p>
        </div>
      </div>

      {/* Confirmation input */}
      <div>
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--ad-text-3)', marginBottom: 8,
        }}>
          Type{' '}
          <span style={{ color: 'var(--ad-red)', fontWeight: 800 }}>RESET</span>
          {' '}to confirm
        </label>
        <input
          type="text"
          value={confirm}
          onChange={e => setConfirm(e.target.value.toUpperCase())}
          placeholder="RESET"
          spellCheck={false}
          style={{
            width: '100%', maxWidth: 240,
            padding: '10px 16px', borderRadius: 12,
            fontSize: 14, fontFamily: 'monospace', fontWeight: 700,
            letterSpacing: '0.15em',
            background: 'var(--ad-input-bg)',
            border: ready
              ? '1px solid rgba(204,0,0,0.7)'
              : '1px solid var(--ad-input-border)',
            color: ready ? 'var(--ad-red)' : 'var(--ad-text)',
            outline: 'none',
            boxShadow: ready ? '0 0 0 3px rgba(204,0,0,0.15)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s, color 0.2s',
          }}
        />
      </div>

      {/* Execute button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <motion.button
          whileHover={ready && !disabled ? { scale: 1.02, boxShadow: '0 0 20px rgba(204,0,0,0.4)' } : {}}
          whileTap={ready && !disabled ? { scale: 0.97 } : {}}
          onClick={onExecute}
          disabled={!ready || disabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 24px', borderRadius: 12,
            fontSize: 14, fontWeight: 700,
            cursor: ready && !disabled ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, color 0.2s, opacity 0.2s',
            background: ready && !disabled ? 'var(--ad-red)' : 'var(--ad-hover)',
            color: ready && !disabled ? '#fff' : 'var(--ad-text-3)',
            border: ready && !disabled ? 'none' : '1px solid var(--ad-border)',
            opacity: ready ? 1 : 0.6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {ready
              ? <polygon points="5 3 19 12 5 21 5 3"/>
              : <><rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
            }
          </svg>
          Execute Monthly Reset
        </motion.button>

        {!ready && (
          <p style={{ fontSize: 12, color: 'var(--ad-text-4)' }}>
            Type RESET above to unlock
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ── Executing overlay ──────────────────────────────────────────

function ExecutingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-32 space-y-6"
    >
      <div className="relative">
        <svg className="animate-spin text-brand-red" width="48" height="48"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-white">Executing Reset…</p>
        <p className="text-sm text-white/35 mt-1">Awarding badges, shuffling clans, resetting CP</p>
      </div>
    </motion.div>
  )
}

// ── Success screen ─────────────────────────────────────────────

function SuccessScreen({ snapshot, result }) {
  const { top5, winningClan, clans, studentCount, month } = snapshot

  // RPC may return structured data or be null
  const rpcData       = result && typeof result === 'object' ? result : {}
  const badgesAwarded = rpcData.badges_awarded ?? null
  const newAssign     = rpcData.new_clan_assignments ?? {}

  const winnerInfo = CLANS[winningClan]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Hero banner */}
      <div
        className="rounded-2xl p-8 text-center space-y-3 overflow-hidden relative"
        style={{ background: '#0d1a0d', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30
            flex items-center justify-center text-3xl mx-auto"
        >
          ✓
        </motion.div>

        <div>
          <h2 className="text-2xl font-black text-white">Reset Complete</h2>
          <p className="text-sm text-white/50 mt-1">
            <span className="text-emerald-400 font-semibold">{month}</span> has been archived
            to the Hall of Fame
          </p>
        </div>

        {badgesAwarded != null && (
          <div className="flex items-center justify-center gap-6 pt-2">
            {[
              { label: 'Badges Awarded', value: badgesAwarded },
              { label: 'Students Reset', value: studentCount },
              { label: 'Clans Reshuffled', value: 4 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month's champions */}
      {top5.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h3 className="text-sm font-bold text-white">{month} — Final Rankings</h3>
            <p className="text-xs text-white/30 mt-0.5">Badges awarded before CP reset</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {top5.map((s, i) => {
              const clanInfo = CLANS[s.clan]
              const badge    = i === 0
                ? { icon: '👑', label: 'Monthly Legend' }
                : { icon: '💎', label: 'Fast Life Elite' }
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className={`flex items-center gap-3 px-5 py-3 ${i === 0 ? 'bg-amber-950/20' : ''}`}
                >
                  <RankBadge rank={i + 1} />
                  <Avatar name={s.full_name} clan={s.clan} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {clanInfo?.emoji} {clanInfo?.name}
                      <span className="ml-2 text-white/20">·</span>
                      <span className="ml-2">{badge.icon} {badge.label}</span>
                    </p>
                  </div>
                  <span className="text-sm font-black text-white/50 shrink-0">
                    {s.cp.toLocaleString()} CP
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Winning clan */}
      {winnerInfo && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'var(--ad-surface)',
            border: `1px solid ${winnerInfo.colorAccent}33`,
          }}
        >
          <span className="text-4xl">{winnerInfo.emoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">{winnerInfo.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded font-bold text-amber-300"
                style={{ background: 'rgba(201,162,39,0.15)' }}>
                👑 Winning Clan
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              All members received the Clan Champion badge.
              Everyone starts the new month at 0 CP.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-white/25 uppercase tracking-widest">Total CP</p>
            <p className="text-lg font-black" style={{ color: winnerInfo.colorAccent }}>
              {clans.find(c => c.id === winningClan)?.total_cp?.toLocaleString() ?? '—'}
            </p>
          </div>
        </motion.div>
      )}

      {/* New clan assignments (if RPC returned them) */}
      {Object.keys(newAssign).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
        >
          <h3 className="text-sm font-bold text-white mb-4">New Clan Assignments</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(newAssign).map(([clanId, count]) => {
              const info = CLANS[clanId]
              return (
                <div key={clanId} className="text-center p-3 rounded-xl"
                  style={{ background: `${info?.colorAccent ?? '#555'}10` }}>
                  <div className="text-2xl mb-1">{info?.emoji ?? '?'}</div>
                  <p className="text-sm font-black text-white">{count}</p>
                  <p className="text-[10px] text-white/35">{info?.name ?? clanId}</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Reshuffle note (if RPC didn't return assignments) */}
      {Object.keys(newAssign).length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
        >
          <span className="text-xl shrink-0">🔀</span>
          <p className="text-sm text-white/60">
            All <span className="text-white font-semibold">{studentCount} students</span> have
            been randomly reshuffled into new clans. CP reset to zero.
          </p>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Link
          to="/admin/dashboard"
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center transition-colors"
          style={{ background: '#CC0000' }}
        >
          Back to Dashboard
        </Link>
        <Link
          to="/admin/rankings"
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/60 text-center
            border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/80 transition-all"
        >
          View New Rankings
        </Link>
      </div>
    </motion.div>
  )
}

// ── Page ───────────────────────────────────────────────────────

export default function MonthlyReset() {
  const { toast } = useToast()

  // Phase: 'preview' | 'executing' | 'done'
  const [phase,        setPhase]        = useState('preview')
  const [loading,      setLoading]      = useState(true)
  const [confirm,      setConfirm]      = useState('')

  // Preview data
  const [top5,         setTop5]         = useState([])
  const [topByClan,    setTopByClan]    = useState({})
  const [clans,        setClans]        = useState([])
  const [studentCount, setStudentCount] = useState(0)

  // Snapshot captured just before executing (used in success screen)
  const [snapshot,     setSnapshot]     = useState(null)
  const [result,       setResult]       = useState(null)

  // ── Load preview data ─────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [studentsRes, clansRes, countRes] = await Promise.all([
        supabase
          .from('students')
          .select('id, full_name, cp, clan, level')
          .eq('is_active', true)
          .order('cp', { ascending: false })
          .limit(50),
        supabase.from('clans').select('*').order('total_cp', { ascending: false }),
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
      ])

      const students = studentsRes.data ?? []
      const clanData = clansRes.data ?? []

      setTop5(students.slice(0, 5))
      setClans(clanData)
      setStudentCount(countRes.count ?? 0)

      const byClan = {}
      for (const clanId of CLAN_NAMES) {
        byClan[clanId] = students.filter(s => s.clan === clanId).slice(0, 3)
      }
      setTopByClan(byClan)

      setLoading(false)
    }
    load()
  }, [])

  const winningClanId = clans[0]?.id ?? null

  // ── Execute reset ─────────────────────────────────────────
  async function executeReset() {
    if (confirm !== 'RESET' || phase !== 'preview') return

    // Snapshot the current state before it's wiped
    setSnapshot({
      top5:         [...top5],
      winningClan:  winningClanId,
      clans:        [...clans],
      studentCount,
      month:        MONTH_LABEL,
    })

    setPhase('executing')
    setConfirm('')

    try {
      const now = new Date()
      const { data, error } = await supabase.rpc('monthly_reset', {
        p_month: now.getMonth() + 1,   // 1–12, matches function parameter name
        p_year:  now.getFullYear(),
      })
      if (error) throw error
      setResult(data)
      setPhase('done')
    } catch (err) {
      toast({ message: err.message ?? 'Reset failed — check Supabase logs', type: 'error' })
      setPhase('preview')
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 max-w-[1000px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase !== 'done' && (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Monthly Reset</h1>
                <p className="text-sm text-white/35 mt-1">{MONTH_LABEL}</p>
              </div>
              {!loading && phase === 'preview' && (
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-xs text-white/25 uppercase tracking-widest">Students</p>
                    <p className="text-lg font-black text-white">{studentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/25 uppercase tracking-widest">Winning Clan</p>
                    <p className="text-lg font-black text-white">
                      {CLANS[winningClanId]?.emoji} {CLANS[winningClanId]?.name ?? '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content by phase ───────────────────────────────── */}
      <AnimatePresence mode="wait">

        {phase === 'executing' && (
          <motion.div key="executing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExecutingScreen />
          </motion.div>
        )}

        {phase === 'done' && snapshot && (
          <motion.div key="done"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SuccessScreen snapshot={snapshot} result={result} />
          </motion.div>
        )}

        {phase === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* ── Champions + clan cards ──────────────────── */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                This Month's Standings
              </h2>

              <Top5Card students={top5} loading={loading} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading
                  ? [...Array(4)].map((_, i) => (
                      <div key={i} className="rounded-2xl p-5 space-y-4"
                        style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-6 h-5 shrink-0" />
                          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="w-24 h-4" />
                            <Skeleton className="w-16 h-3" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[...Array(3)].map((_, j) => (
                            <div key={j} className="flex items-center gap-2.5">
                              <Skeleton className="w-5 h-4" />
                              <Skeleton className="w-6 h-6 rounded-full" />
                              <Skeleton className="flex-1 h-3" />
                              <Skeleton className="w-8 h-3" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  : clans.map((clan, i) => (
                      <ClanCard
                        key={clan.id}
                        clan={clan}
                        topMembers={topByClan[clan.id] ?? []}
                        rank={i}
                        isWinner={i === 0}
                        loading={loading}
                        delay={i * 0.07}
                      />
                    ))
                }
              </div>
            </section>

            {/* ── What will happen ───────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                Consequences
              </h2>
              <ActionList />
            </section>

            {/* ── Danger zone ────────────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                Execute
              </h2>
              <DangerZone
                studentCount={studentCount}
                confirm={confirm}
                setConfirm={setConfirm}
                onExecute={executeReset}
                disabled={loading}
              />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
