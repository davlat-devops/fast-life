import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, Trophy, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CLANS } from '@/constants/clans'
import { ClanIcon, RankBadge } from '@/components/ui/ClanIcons'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const LEVEL_COLOUR = {
  A1: '#6b7280', A2: '#6b7280',
  B1: '#3b82f6', B2: '#3b82f6',
  C1: '#C9A227', C2: '#C9A227',
}

const PER_PAGE = 25

// ── Clan Race Bar ──────────────────────────────────────────────

function ClanRaceBar({ clan, maxCp, memberCount, rank, delay }) {
  const info = CLANS[clan.id]
  const pct  = maxCp > 0 ? (clan.total_cp / maxCp) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-4 group"
    >
      {/* Rank badge */}
      <div className="w-8 shrink-0 flex justify-center">
        <RankBadge rank={rank + 1} size={24} />
      </div>

      {/* Clan icon */}
      <div className="w-9 shrink-0 flex justify-center">
        <ClanIcon clanId={clan.id} size={28} />
      </div>

      {/* Clan name + member count */}
      <div className="w-28 shrink-0">
        <p className="text-sm font-bold text-white leading-tight">{clan.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-[10px] text-white/30">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </p>
          {clan.crown && (
            <Crown size={9} className="text-amber-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Bar track */}
      <div
        className="flex-1 h-10 rounded-xl overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.2, duration: 1.2, type: 'spring', stiffness: 70, damping: 18 }}
          className="absolute inset-y-0 left-0 rounded-xl min-w-[6px] flex items-center"
          style={{ background: `linear-gradient(90deg, ${info?.colorAccent}88, ${info?.colorAccent})` }}
        >
          {pct > 22 && (
            <span className="absolute right-3 text-white text-[11px] font-bold whitespace-nowrap drop-shadow">
              {Math.round(pct)}%
            </span>
          )}
        </motion.div>
        {pct <= 22 && pct > 0 && (
          <span
            className="absolute left-[calc(max(4px,_var(--bar-pct))_+_8px)] top-1/2 -translate-y-1/2
              text-[11px] font-bold text-white/50 whitespace-nowrap"
            style={{ '--bar-pct': `${pct}%` }}
          >
            {Math.round(pct)}%
          </span>
        )}
      </div>

      {/* CP total */}
      <div className="w-24 shrink-0 text-right">
        <p className="text-sm font-black" style={{ color: info?.colorAccent }}>
          {clan.total_cp.toLocaleString()}
        </p>
        <p className="text-[10px] text-white/25">CP</p>
      </div>
    </motion.div>
  )
}

// ── Clan summary card ──────────────────────────────────────────

function ClanSummaryCard({ clan, members, rank, delay }) {
  const info = CLANS[clan.id]
  const top3 = [...members].sort((a, b) => b.cp - a.cp).slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-2xl p-5"
      style={{ background: 'var(--ad-surface)', border: `1px solid ${info?.colorAccent}28` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <RankBadge rank={rank + 1} size={22} />
          <ClanIcon clanId={clan.id} size={26} />
          <div>
            <h3 className="text-sm font-black text-white">{clan.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-[10px] text-white/30">{members.length} members</p>
              {clan.crown && (
                <>
                  <Crown size={9} className="text-amber-400 shrink-0" />
                  <span className="text-[10px] text-amber-400">Reigning</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black" style={{ color: info?.colorAccent }}>
            {clan.total_cp.toLocaleString()}
          </p>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Total CP</p>
        </div>
      </div>

      {/* Top 3 mini avatars */}
      {top3.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Top Members</p>
          {top3.map((s, i) => {
            const initials = s.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={s.id} className="flex items-center gap-2.5">
                <RankBadge rank={i + 1} size={18} />
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: info?.colorAccent ?? '#555' }}
                >
                  {initials}
                </div>
                <span className="text-xs text-white/70 flex-1 truncate">{s.full_name}</span>
                <span className="text-xs font-bold text-white/50">{s.cp.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ── Individual Student Row ─────────────────────────────────────

function StudentRow({ student, rank, delay }) {
  const clanInfo = CLANS[student.clan]
  const initials = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.15 }}
      className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors group"
    >
      {/* Rank */}
      <td className="px-4 py-3 w-14">
        <RankBadge rank={rank} size={22} />
      </td>

      {/* Student */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: clanInfo?.colorAccent ?? '#555' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{student.full_name}</p>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">{student.username}</p>
          </div>
        </div>
      </td>

      {/* Clan */}
      <td className="px-4 py-3">
        {clanInfo && (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: clanInfo.colorAccent }}
          >
            <ClanIcon clanId={student.clan} size={14} />
            {clanInfo.name}
          </span>
        )}
      </td>

      {/* Level */}
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold"
          style={{
            background: `${LEVEL_COLOUR[student.level] ?? '#666'}22`,
            color:       LEVEL_COLOUR[student.level] ?? '#888',
          }}
        >
          {student.level}
        </span>
      </td>

      {/* CP */}
      <td className="px-4 py-3">
        <span className="text-sm font-black text-white">{student.cp.toLocaleString()}</span>
      </td>

      {/* Class */}
      <td className="px-4 py-3">
        <span className="text-xs text-white/35">{student.class_group}</span>
      </td>
    </motion.tr>
  )
}

// ── Page ───────────────────────────────────────────────────────

export default function Rankings() {
  const [clans,    setClans]    = useState([])
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)

  const [search,      setSearch]      = useState('')
  const [clanFilter,  setClanFilter]  = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [page,        setPage]        = useState(0)

  useEffect(() => {
    async function load() {
      const [clansRes, studentsRes] = await Promise.all([
        supabase.from('clans').select('*').order('total_cp', { ascending: false }),
        supabase
          .from('students')
          .select('id, full_name, username, cp, clan, level, class_group')
          .eq('is_active', true)
          .order('cp', { ascending: false }),
      ])
      setClans(clansRes.data ?? [])
      setStudents(studentsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const maxCp = useMemo(() => Math.max(...clans.map(c => c.total_cp), 1), [clans])

  const membersByClid = useMemo(() => {
    const map = {}
    for (const s of students) {
      if (!map[s.clan]) map[s.clan] = []
      map[s.clan].push(s)
    }
    return map
  }, [students])

  const memberCounts = useMemo(() => {
    const counts = {}
    for (const [clan, list] of Object.entries(membersByClid)) {
      counts[clan] = list.length
    }
    return counts
  }, [membersByClid])

  const rankedStudents = useMemo(
    () => students.map((s, i) => ({ ...s, rank: i + 1 })),
    [students]
  )

  const filteredRanked = useMemo(() => {
    let list = rankedStudents
    if (clanFilter)  list = list.filter(s => s.clan  === clanFilter)
    if (levelFilter) list = list.filter(s => s.level === levelFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q)
      )
    }
    return list
  }, [rankedStudents, clanFilter, levelFilter, search])

  useEffect(() => { setPage(0) }, [search, clanFilter, levelFilter])

  const totalPages = Math.ceil(filteredRanked.length / PER_PAGE)
  const visible    = filteredRanked.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-[1200px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Rankings</h1>
        <p className="text-sm text-white/35 mt-1">
          {loading ? '…' : `${students.length} active students across ${clans.length} clans`}
        </p>
      </div>

      {/* ── Clan Race ──────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-white/50" />
          <h2 className="text-base font-black text-white">Clan Race</h2>
        </div>

        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
        >
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-6 rounded bg-white/10 animate-pulse" />
                <div className="w-9 h-6 rounded bg-white/10 animate-pulse" />
                <div className="w-28 space-y-1">
                  <div className="h-4 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-white/10 animate-pulse" />
                </div>
                <div className="flex-1 h-10 rounded-xl bg-white/[0.06] animate-pulse" />
                <div className="w-20 space-y-1">
                  <div className="h-4 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-8 rounded bg-white/10 animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            clans.map((clan, i) => (
              <ClanRaceBar
                key={clan.id}
                clan={clan}
                maxCp={maxCp}
                memberCount={memberCounts[clan.id] ?? 0}
                rank={i}
                delay={i * 0.08}
              />
            ))
          )}
        </div>

        {/* Clan detail cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {clans.map((clan, i) => (
              <ClanSummaryCard
                key={clan.id}
                clan={clan}
                members={membersByClid[clan.id] ?? []}
                rank={i}
                delay={0.2 + i * 0.07}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Individual Leaderboard ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-white/50" />
          <h2 className="text-base font-black text-white">Individual Leaderboard</h2>
          <span className="text-xs text-white/30 ml-auto">{filteredRanked.length} students</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-44">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or username…"
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/[0.04] border border-white/[0.07] outline-none focus:border-brand-red/50 transition-colors"
            />
          </div>

          <select
            value={clanFilter}
            onChange={e => setClanFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04]
              border border-white/[0.07] outline-none cursor-pointer"
          >
            <option value="">All Clans</option>
            {Object.values(CLANS).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04]
              border border-white/[0.07] outline-none cursor-pointer"
          >
            <option value="">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {(search || clanFilter || levelFilter) && (
            <button
              onClick={() => { setSearch(''); setClanFilter(''); setLevelFilter('') }}
              className="px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70
                bg-white/[0.04] border border-white/[0.07] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table — desktop */}
        <div
          className="hidden md:block rounded-2xl overflow-hidden"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
        >
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Rank', 'Student', 'Clan', 'Level', 'CP', 'Class'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[30, 180, 90, 50, 60, 70].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-white/25">
                    {students.length === 0 ? 'No active students to rank.' : 'No students match your filters'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {visible.map((s, i) => (
                    <StudentRow key={s.id} student={s} rank={s.rank} delay={i * 0.018} />
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/30">
                {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filteredRanked.length)} of {filteredRanked.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white
                    hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {totalPages <= 7 && [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                      ${i === page
                        ? 'bg-brand-red text-white'
                        : 'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                {totalPages > 7 && (
                  <span className="text-xs text-white/30 px-2">{page + 1} / {totalPages}</span>
                )}
                <button
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white
                    hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card list — mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl p-4 animate-pulse"
                style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded" style={{ background: 'var(--ad-skeleton)' }} />
                  <div className="w-9 h-9 rounded-full" style={{ background: 'var(--ad-skeleton)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded" style={{ background: 'var(--ad-skeleton)' }} />
                    <div className="h-3 w-24 rounded" style={{ background: 'var(--ad-skeleton)' }} />
                  </div>
                </div>
              </div>
            ))
          ) : visible.length === 0 ? (
            <p className="text-center py-12 text-sm text-white/25">
              {students.length === 0 ? 'No active students to rank.' : 'No students match your filters'}
            </p>
          ) : (
            visible.map((s, i) => {
              const clanInfo = CLANS[s.clan]
              const initials = s.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                  className="rounded-2xl p-3.5 flex items-center gap-3"
                  style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
                  <RankBadge rank={s.rank} size={22} />
                  <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: clanInfo?.colorAccent ?? '#555' }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {clanInfo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: clanInfo.colorAccent }}>
                          <ClanIcon clanId={s.clan} size={11} />
                          {clanInfo.name}
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${LEVEL_COLOUR[s.level] ?? '#666'}22`, color: LEVEL_COLOUR[s.level] ?? '#888' }}>
                        {s.level}
                      </span>
                      {s.class_group && <span className="text-[10px] text-white/30">{s.class_group}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-black text-white shrink-0">{s.cp.toLocaleString()}</span>
                </motion.div>
              )
            })
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/[0.07] disabled:opacity-30 min-h-[44px]">
                ← Prev
              </button>
              <span className="text-xs text-white/30">{page + 1} / {totalPages}</span>
              <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2.5 rounded-xl text-sm text-white/50 border border-white/[0.07] disabled:opacity-30 min-h-[44px]">
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
