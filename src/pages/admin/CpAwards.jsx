import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CLANS } from '@/constants/clans'
import { MANUAL_CP_REASONS } from '@/constants/cp'
import { useToast } from '@/contexts/ToastContext'

// ── Reason label map (includes system reasons for full audit) ──
const REASON_LABELS = {
  attendance:             'Attendance',
  volunteer:              'Volunteer',
  competition_1st:        '🥇 1st Place',
  competition_2nd:        '🥈 2nd Place',
  competition_3rd:        '🥉 3rd Place',
  referral:               'Referral',
  peer_spotlight:         'Peer Spotlight',
  end_of_month_1st:       '#1 of Month',
  end_of_month_top5:      'Top 5 Overall',
  end_of_month_top5_clan: 'Top 5 in Clan',
  clan_winner_headstart:  'Clan Head Start',
  perfect_month:          'Perfect Month',
  other:                  'Other',
}

const AW_PER_PAGE = 20

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Student Picker ─────────────────────────────────────────────

function StudentPicker({ allStudents, selected, onSelect }) {
  const [search, setSearch]   = useState('')
  const [open,   setOpen]     = useState(false)
  const ref                   = useRef(null)

  useEffect(() => {
    function outside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const matches = useMemo(() => {
    if (!search.trim()) return allStudents.slice(0, 8)
    const q = search.toLowerCase()
    return allStudents
      .filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [allStudents, search])

  function handleFocus() {
    if (selected) {
      onSelect(null)
      setSearch('')
    }
    setOpen(true)
  }

  const displayValue = selected ? selected.full_name : search
  const clanInfo = selected ? CLANS[selected.clan] : null

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
        Student
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or username…"
          value={displayValue}
          onFocus={handleFocus}
          onChange={e => { setSearch(e.target.value); onSelect(null); setOpen(true) }}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white
            bg-white/[0.04] border border-white/[0.08] outline-none
            focus:border-brand-red/40 transition-colors"
        />
        {selected && clanInfo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
            {clanInfo.emoji}
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && !selected && matches.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden shadow-2xl"
            style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {matches.map(s => {
              const info     = CLANS[s.clan]
              const initials = s.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={() => { onSelect(s); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left
                      hover:bg-white/[0.06] transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center
                        text-[10px] font-bold text-white"
                      style={{ background: info?.colorAccent ?? '#555' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{s.full_name}</p>
                      <p className="text-[10px] text-white/35">
                        {info?.emoji} {info?.name}
                        <span className="text-white/20 mx-1">·</span>
                        {s.cp.toLocaleString()} CP
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Audit row ──────────────────────────────────────────────────

function AuditRow({ award, delay }) {
  const student  = award.students
  const clanInfo = CLANS[student?.clan]
  const initials = (student?.full_name ?? '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.15 }}
      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
    >
      {/* When */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-xs text-white/50">
          {new Date(award.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(award.created_at)}</p>
      </td>

      {/* Student */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center
              text-[10px] font-bold text-white"
            style={{ background: clanInfo?.colorAccent ?? '#555' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {student?.full_name ?? 'Unknown'}
            </p>
            <p className="text-[10px] text-white/30">
              {clanInfo?.emoji} {clanInfo?.name}
            </p>
          </div>
        </div>
      </td>

      {/* Reason */}
      <td className="px-4 py-3">
        <span className="text-xs text-white/55">
          {REASON_LABELS[award.reason] ?? award.reason}
        </span>
      </td>

      {/* CP */}
      <td className="px-4 py-3">
        <span className="text-sm font-black text-emerald-400">+{award.amount}</span>
      </td>

      {/* Note */}
      <td className="px-4 py-3 max-w-[240px]">
        <span className="text-xs text-white/40 truncate block">{award.note || '—'}</span>
      </td>
    </motion.tr>
  )
}

// ── Page ───────────────────────────────────────────────────────

export default function CpAwards() {
  const { toast } = useToast()

  // ── Students for picker ─────────────────────────────────────
  const [allStudents, setAllStudents] = useState([])

  // ── Award form ──────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [reason,          setReason]          = useState('')
  const [cpAmount,        setCpAmount]        = useState('')
  const [note,            setNote]            = useState('')
  const [submitting,      setSubmitting]      = useState(false)

  // ── Audit log ───────────────────────────────────────────────
  const [awards,        setAwards]        = useState([])
  const [awLoading,     setAwLoading]     = useState(true)
  const [awPage,        setAwPage]        = useState(0)
  const [awSearch,      setAwSearch]      = useState('')
  const [awReasonFilt,  setAwReasonFilt]  = useState('')

  // ── Load students ───────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('students')
      .select('id, full_name, username, clan, cp')
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => setAllStudents(data ?? []))
  }, [])

  // ── Load audit log ──────────────────────────────────────────
  const loadAwards = useCallback(async () => {
    setAwLoading(true)
    const { data, error } = await supabase
      .from('cp_awards')
      .select('id, amount, reason, note, created_at, students(id, full_name, clan)')
      .order('created_at', { ascending: false })
      .limit(500)
    if (!error) setAwards(data ?? [])
    setAwLoading(false)
  }, [])

  useEffect(() => { loadAwards() }, [loadAwards])

  // ── Auto-fill CP from reason ────────────────────────────────
  const selectedReasonObj = MANUAL_CP_REASONS.find(r => r.value === reason)

  useEffect(() => {
    if (selectedReasonObj?.cp != null) {
      setCpAmount(String(selectedReasonObj.cp))
    } else if (reason === 'other') {
      setCpAmount('')
    }
  }, [reason]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form validation ─────────────────────────────────────────
  const parsedCp   = parseInt(cpAmount, 10)
  const canSubmit  = (
    selectedStudent !== null &&
    reason.length > 0 &&
    parsedCp > 0 &&
    note.trim().length > 0
  )

  // ── Submit award ─────────────────────────────────────────────
  async function submitAward() {
    if (!canSubmit || submitting) return
    setSubmitting(true)

    try {
      // 1. Insert cp_award record
      const { error: insertErr } = await supabase.from('cp_awards').insert({
        student_id: selectedStudent.id,
        amount:     parsedCp,
        reason,
        note:       note.trim(),
      })
      if (insertErr) throw insertErr

      // 2. Read current student CP then increment
      const { data: fresh, error: readErr } = await supabase
        .from('students')
        .select('cp, clan')
        .eq('id', selectedStudent.id)
        .single()
      if (readErr) throw readErr

      const { error: studentErr } = await supabase
        .from('students')
        .update({ cp: fresh.cp + parsedCp })
        .eq('id', selectedStudent.id)
      if (studentErr) throw studentErr

      toast({
        message: `Awarded ${parsedCp} CP to ${selectedStudent.full_name}`,
        type: 'success',
      })

      // Reset form
      setSelectedStudent(null)
      setReason('')
      setCpAmount('')
      setNote('')

      // Refresh students list (CP changed) and audit log
      supabase
        .from('students')
        .select('id, full_name, username, clan, cp')
        .eq('is_active', true)
        .order('full_name')
        .then(({ data }) => setAllStudents(data ?? []))

      loadAwards()
    } catch (err) {
      toast({ message: err.message ?? 'Award failed', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Audit log filters (client-side) ─────────────────────────
  const filteredAwards = useMemo(() => {
    let list = awards
    if (awReasonFilt) list = list.filter(a => a.reason === awReasonFilt)
    if (awSearch.trim()) {
      const q = awSearch.toLowerCase()
      list = list.filter(a =>
        a.students?.full_name?.toLowerCase().includes(q) ||
        (a.note ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [awards, awReasonFilt, awSearch])

  useEffect(() => { setAwPage(0) }, [awSearch, awReasonFilt])

  const awTotalPages = Math.ceil(filteredAwards.length / AW_PER_PAGE)
  const awVisible    = filteredAwards.slice(awPage * AW_PER_PAGE, (awPage + 1) * AW_PER_PAGE)

  // ── Distinct reasons present in the log ─────────────────────
  const logReasons = useMemo(() => {
    const seen = new Set(awards.map(a => a.reason))
    return [...seen].sort()
  }, [awards])

  // ── Selected student's current clan info ─────────────────────
  const selClan = selectedStudent ? CLANS[selectedStudent.clan] : null

  return (
    <div className="p-8 space-y-8 max-w-[1100px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">CP Awards</h1>
        <p className="text-sm text-white/35 mt-1">
          {awLoading ? '…' : `${awards.length} total awards in log`}
        </p>
      </div>

      {/* ── Award Form ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 space-y-5"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#C9A227" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h2 className="text-sm font-bold text-white">Award CP Manually</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Student picker */}
          <StudentPicker
            allStudents={allStudents}
            selected={selectedStudent}
            onSelect={setSelectedStudent}
          />

          {/* Reason dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
              Reason
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white
                bg-white/[0.04] border border-white/[0.08] outline-none
                focus:border-brand-red/40 transition-colors cursor-pointer appearance-none"
            >
              <option value="">Select a reason…</option>
              {MANUAL_CP_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}{r.cp != null ? `  (+${r.cp} CP)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* CP amount */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
              CP Amount
            </label>
            <input
              type="number"
              min="1"
              value={cpAmount}
              onChange={e => setCpAmount(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white
                bg-white/[0.04] border border-white/[0.08] outline-none
                focus:border-brand-red/40 transition-colors"
            />
            {selectedReasonObj?.cp != null && (
              <p className="text-[10px] text-white/25 mt-1.5">
                Default {selectedReasonObj.cp} CP — edit to override
              </p>
            )}
            {reason === 'other' && (
              <p className="text-[10px] text-amber-500/60 mt-1.5">
                Enter the CP amount manually for "Other"
              </p>
            )}
          </div>

          {/* Note (mandatory) */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
              Note
              <span className="ml-1 text-red-500/80 normal-case tracking-normal font-normal">
                (required)
              </span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Context for this award — will appear in the audit log"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white resize-none
                bg-white/[0.04] border border-white/[0.08] outline-none
                focus:border-brand-red/40 transition-colors"
            />
          </div>
        </div>

        {/* Submit row */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">

          {/* Selected student preview */}
          <div className="h-8 flex items-center">
            <AnimatePresence mode="wait">
              {selectedStudent && (
                <motion.div
                  key={selectedStudent.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ background: selClan?.colorAccent ?? '#555' }}
                  >
                    {selectedStudent.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/70 font-medium">{selectedStudent.full_name}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/35">{selectedStudent.cp.toLocaleString()} CP now</span>
                  {parsedCp > 0 && (
                    <>
                      <span className="text-white/20">→</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {(selectedStudent.cp + parsedCp).toLocaleString()} CP
                      </span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: canSubmit ? 1.02 : 1 }}
            whileTap={{ scale: canSubmit ? 0.97 : 1 }}
            onClick={submitAward}
            disabled={!canSubmit || submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
              disabled:opacity-35 disabled:cursor-not-allowed transition-opacity"
            style={{ background: '#CC0000' }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Awarding…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Award{parsedCp > 0 ? ` ${parsedCp} CP` : ' CP'}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Audit Log ──────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Award History</h2>
          <span className="text-xs text-white/30">
            {filteredAwards.length !== awards.length
              ? `${filteredAwards.length} of ${awards.length}`
              : `${awards.length} records`}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-44">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={awSearch}
              onChange={e => setAwSearch(e.target.value)}
              placeholder="Search student or note…"
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/[0.04] border border-white/[0.07] outline-none focus:border-brand-red/50 transition-colors"
            />
          </div>
          <select
            value={awReasonFilt}
            onChange={e => setAwReasonFilt(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04]
              border border-white/[0.07] outline-none cursor-pointer"
          >
            <option value="">All Reasons</option>
            {logReasons.map(r => (
              <option key={r} value={r}>{REASON_LABELS[r] ?? r}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['When', 'Student', 'Reason', 'CP', 'Note'].map(h => (
                  <th key={h}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {awLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[40, 140, 80, 30, 160].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : awVisible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm text-white/25">
                    {awards.length === 0
                      ? 'No CP awards yet — use the form above to make the first one'
                      : 'No records match your filters'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {awVisible.map((award, i) => (
                    <AuditRow key={award.id} award={award} delay={i * 0.02} />
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {awTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/30">
                {awPage * AW_PER_PAGE + 1}–{Math.min((awPage + 1) * AW_PER_PAGE, filteredAwards.length)} of {filteredAwards.length}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={awPage === 0}
                  onClick={() => setAwPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white
                    hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {awTotalPages <= 7 && [...Array(awTotalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setAwPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                      ${i === awPage
                        ? 'bg-brand-red text-white'
                        : 'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={awPage === awTotalPages - 1}
                  onClick={() => setAwPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white
                    hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
