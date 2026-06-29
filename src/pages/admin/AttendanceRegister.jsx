import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { CLANS } from '@/constants/clans'

// ── Category style map ────────────────────────────────────────

const CAT_STYLE = {
  English:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  IELTS:       { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Competition: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  Volunteer:   { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  Korean:      { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  Russian:     { color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  Math:        { color: '#a3e635', bg: 'rgba(163,230,53,0.12)'  },
}

// ── Helpers ───────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200
        ${checked ? 'bg-emerald-600' : 'bg-white/[0.12]'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 mt-0.5
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

// ── Student row ───────────────────────────────────────────────

function StudentRow({ student, present, onToggle, toggling, finalised, delay }) {
  const clanInfo = CLANS[student.clan]
  const initials = student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.15 }}
      className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0
        transition-colors ${present && !finalised ? 'bg-emerald-950/20' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
        style={{ background: clanInfo?.colorAccent ?? '#555' }}
      >
        {initials}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{student.full_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-white/30">{student.username}</span>
          {clanInfo && (
            <>
              <span className="text-white/15">·</span>
              <Shield size={11} style={{ color: clanInfo.colorAccent ?? 'var(--ad-text-3)' }} />
              <span className="text-[10px] text-white/30">{clanInfo.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Present status (read-only when finalised) */}
      {finalised ? (
        <span className={`text-[11px] font-bold ${present ? 'text-emerald-400' : 'text-white/20'}`}>
          {present ? '✓ Present' : 'Absent'}
        </span>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[11px] font-semibold transition-colors
            ${present ? 'text-emerald-400' : 'text-white/25'}`}>
            {present ? 'Present' : 'Absent'}
          </span>
          <Toggle
            checked={present}
            onChange={onToggle}
            disabled={toggling}
          />
        </div>
      )}
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function AttendanceRegister() {
  const { eventId } = useParams()
  const navigate    = useNavigate()
  const { toast }   = useToast()

  const [event,         setEvent]         = useState(null)
  const [students,      setStudents]      = useState([])
  const [attendanceMap, setAttendanceMap] = useState({}) // studentId → { id?, present, finalised }
  const [loading,       setLoading]       = useState(true)
  const [toggling,      setToggling]      = useState(new Set())
  const [search,        setSearch]        = useState('')
  const [confirmStep,   setConfirmStep]   = useState(0) // 0=idle, 1=confirm, 2=finalising

  // ── Load ────────────────────────────────────────────────────

  const loadAttendance = useCallback(async () => {
    const { data } = await supabase
      .from('attendance')
      .select('id, student_id, present, finalised')
      .eq('event_id', eventId)
    const map = {}
    for (const row of data ?? []) {
      map[row.student_id] = { id: row.id, present: row.present, finalised: row.finalised }
    }
    setAttendanceMap(map)
  }, [eventId])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [eventRes, studentsRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('students')
          .select('id, full_name, username, clan, level, class_group')
          .eq('is_active', true)
          .order('full_name'),
      ])

      if (eventRes.error || !eventRes.data) {
        toast({ message: 'Event not found', type: 'error' })
        navigate('/admin/events')
        return
      }

      setEvent(eventRes.data)
      setStudents(studentsRes.data ?? [])
      await loadAttendance()
      setLoading(false)
    }
    load()
  }, [eventId])

  // ── Toggle individual student ────────────────────────────────

  async function toggleStudent(studentId) {
    const current    = attendanceMap[studentId]
    const newPresent = !(current?.present ?? false)

    // Optimistic update
    setAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], present: newPresent } }))
    setToggling(prev => new Set([...prev, studentId]))

    let error

    if (current?.id) {
      // Row exists: update
      ;({ error } = await supabase
        .from('attendance')
        .update({ present: newPresent })
        .eq('id', current.id))
    } else {
      // No row yet: insert
      const { data, error: insertErr } = await supabase
        .from('attendance')
        .insert({ event_id: eventId, student_id: studentId, present: newPresent })
        .select('id, present, finalised')
        .single()
      error = insertErr
      if (!insertErr && data) {
        setAttendanceMap(prev => ({
          ...prev,
          [studentId]: { id: data.id, present: data.present, finalised: data.finalised },
        }))
      }
    }

    if (error) {
      // Revert optimistic update
      setAttendanceMap(prev => ({ ...prev, [studentId]: current }))
      toast({ message: error.message, type: 'error' })
    }

    setToggling(prev => { const s = new Set(prev); s.delete(studentId); return s })
  }

  // ── Mark all ─────────────────────────────────────────────────

  async function markAll(present) {
    // Optimistic
    setAttendanceMap(prev => {
      const next = { ...prev }
      for (const s of students) next[s.id] = { ...(prev[s.id] ?? {}), present }
      return next
    })

    const { error } = await supabase.from('attendance').upsert(
      students.map(s => ({
        event_id:   eventId,
        student_id: s.id,
        present,
        ...(attendanceMap[s.id]?.id ? { id: attendanceMap[s.id].id } : {}),
      })),
      { onConflict: 'event_id,student_id' }
    )

    if (error) {
      toast({ message: error.message, type: 'error' })
    }
    // Always reload to get accurate IDs for any newly inserted rows
    await loadAttendance()
  }

  // ── Finalise ─────────────────────────────────────────────────

  async function finalise() {
    setConfirmStep(2)

    try {
      // 1. Insert rows for any students not yet in attendanceMap (absent)
      const missing = students.filter(s => !attendanceMap[s.id]?.id)
      if (missing.length > 0) {
        const { error } = await supabase.from('attendance').upsert(
          missing.map(s => ({ event_id: eventId, student_id: s.id, present: false })),
          { onConflict: 'event_id,student_id' }
        )
        if (error) throw error
      }

      // 2. Set finalised=true on all attendance rows
      //    → triggers finalise_attendance per row → awards CP to present students
      const { error: finalErr } = await supabase
        .from('attendance')
        .update({ finalised: true })
        .eq('event_id', eventId)
      if (finalErr) throw finalErr

      // 3. Mark the event itself as finalised
      const { error: eventErr } = await supabase
        .from('events')
        .update({ finalised: true })
        .eq('id', eventId)
      if (eventErr) throw eventErr

      setEvent(prev => ({ ...prev, finalised: true }))
      await loadAttendance()

      const presentCount = students.filter(s =>
        attendanceMap[s.id]?.present
      ).length

      toast({
        message: `Attendance finalised — CP awarded to ${presentCount} student${presentCount !== 1 ? 's' : ''}`,
        type: 'success',
      })
    } catch (err) {
      toast({ message: err.message ?? 'Finalisation failed', type: 'error' })
    } finally {
      setConfirmStep(0)
    }
  }

  // ── Derived ───────────────────────────────────────────────────

  const presentCount = useMemo(
    () => students.filter(s => attendanceMap[s.id]?.present).length,
    [students, attendanceMap]
  )

  const visible = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.class_group ?? '').toLowerCase().includes(q)
    )
  }, [students, search])

  // ── Render ───────────────────────────────────────────────────

  const cat = event ? (CAT_STYLE[event.category] ?? { color: '#888', bg: '#222' }) : null

  return (
    <div className="p-8 max-w-[900px] space-y-6">

      {/* ── Back + breadcrumb ───────────────────────────────── */}
      <button
        onClick={() => navigate('/admin/events')}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Events
      </button>

      {/* ── Event header ────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : event && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-white leading-tight">{event.title}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ color: cat.color, background: cat.bg }}
                >
                  {event.category}
                </span>
                <span className="text-sm text-white/50">
                  {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric',
                  })}
                </span>
                {event.event_time && (
                  <span className="text-sm text-white/35">{event.event_time.slice(0, 5)}</span>
                )}
                {event.room && (
                  <span className="text-sm text-white/35">{event.room}</span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-white">+{event.cp_value}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">CP per student</p>
            </div>
          </div>

          {event.finalised && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30">
              <svg className="shrink-0 text-emerald-400" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className="text-emerald-400 text-xs font-semibold">
                Attendance finalised — CP has been awarded. This record is locked.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Controls ────────────────────────────────────────── */}
      {!loading && event && !event.finalised && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex flex-wrap items-center gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, username, class…"
              className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-white/25
                bg-white/[0.04] border border-white/[0.07] outline-none focus:border-brand-red/50 transition-colors"
            />
          </div>

          {/* Bulk actions */}
          <button
            onClick={() => markAll(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-800/40
              hover:bg-emerald-950/30 transition-colors"
          >
            ✓ Mark All Present
          </button>
          <button
            onClick={() => markAll(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white/40 border border-white/[0.08]
              hover:bg-white/[0.04] transition-colors"
          >
            Mark All Absent
          </button>
        </motion.div>
      )}

      {/* ── Student list ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
      >
        {/* List header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-bold text-white">
            {loading ? 'Loading…' : `${students.length} students`}
          </h2>
          {!loading && (
            <span className={`text-sm font-bold ${presentCount > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
              {presentCount} / {students.length} present
            </span>
          )}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="w-1/2 h-4" />
                  <Skeleton className="w-1/3 h-3" />
                </div>
                <Skeleton className="w-12 h-6 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center py-10 text-sm text-white/25">
            {search ? 'No students match your search' : 'No active students'}
          </p>
        ) : (
          visible.map((student, i) => (
            <StudentRow
              key={student.id}
              student={student}
              present={attendanceMap[student.id]?.present ?? false}
              onToggle={() => toggleStudent(student.id)}
              toggling={toggling.has(student.id)}
              finalised={event?.finalised ?? false}
              delay={i * 0.015}
            />
          ))
        )}
      </motion.div>

      {/* ── Finalise action ──────────────────────────────────── */}
      {!loading && event && !event.finalised && (
        <AnimatePresence mode="wait">
          {confirmStep === 0 && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between p-5 rounded-2xl"
              style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
            >
              <div>
                <p className="text-sm font-bold text-white">Finalise Attendance</p>
                <p className="text-xs text-white/35 mt-0.5">
                  Awards {event.cp_value} CP to {presentCount} present student{presentCount !== 1 ? 's' : ''}.
                  {' '}Cannot be undone.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmStep(1)}
                disabled={students.length === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#CC0000' }}
              >
                Finalise Attendance
              </motion.button>
            </motion.div>
          )}

          {confirmStep === 1 && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="p-5 rounded-2xl"
              style={{ background: 'var(--ad-red-dim)', border: '1px solid var(--ad-red-glow)' }}
            >
              <div className="flex items-start gap-3">
                <svg className="shrink-0 text-red-400 mt-0.5" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">
                    Finalise and award CP to {presentCount} student{presentCount !== 1 ? 's' : ''}?
                  </p>
                  <p className="text-xs text-white/40 mt-0.5 mb-4">
                    This will permanently award {event.cp_value} CP to each present student.
                    Absent students get 0 CP. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmStep(0)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white/80
                        border border-white/[0.08] hover:bg-white/[0.04] transition-all"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={finalise}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: '#CC0000' }}
                    >
                      Yes, Finalise Now
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {confirmStep === 2 && (
            <motion.div
              key="finalising"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-5 rounded-2xl"
              style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}
            >
              <svg className="animate-spin text-brand-red shrink-0" width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <p className="text-sm text-white/60">Finalising attendance and awarding CP…</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  )
}
