import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { EVENT_CATEGORIES, DEFAULT_EVENT_CP, CP_FOR_CATEGORY } from '@/constants/cp'

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

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

// ── Field wrapper ─────────────────────────────────────────────

const inputCls = `w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20
  bg-white/[0.04] border border-white/[0.08] outline-none
  focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/20 transition-all`

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

// ── Create Event Modal ────────────────────────────────────────

function CreateEventModal({ onClose, onCreated, adminUserId }) {
  const [form, setForm] = useState({
    title: '', category: 'English', event_date: '',
    event_time: '', room: '', cp_value: DEFAULT_EVENT_CP,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  function set(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val }
      // Auto-suggest CP when category changes
      if (key === 'category') next.cp_value = CP_FOR_CATEGORY[val] ?? DEFAULT_EVENT_CP
      return next
    })
    setErrors(e => ({ ...e, [key]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim())    errs.title      = 'Title is required'
    if (!form.event_date)      errs.event_date = 'Date is required'
    if (form.cp_value === '' || Number(form.cp_value) < 0) errs.cp_value = 'CP must be 0 or more'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)
    const { data, error } = await supabase.from('events').insert({
      title:      form.title.trim(),
      category:   form.category,
      event_date: form.event_date,
      event_time: form.event_time || null,
      room:       form.room.trim() || null,
      cp_value:   Number(form.cp_value),
      created_by: adminUserId,
    }).select().single()

    setBusy(false)
    if (error) { toast({ message: error.message, type: 'error' }); return }
    onCreated(data)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{   opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white">New Event</h2>
              <p className="text-xs text-white/35 mt-0.5">CP is auto-awarded when attendance is finalised</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <Field label="Title *" id="title" error={errors.title}>
              <input id="title" className={inputCls} placeholder="e.g. IELTS Mock Test #4"
                value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category *" id="category">
                <select id="category" className={inputCls + ' cursor-pointer'}
                  value={form.category} onChange={e => set('category', e.target.value)}>
                  {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="CP Value *" id="cp_value" error={errors.cp_value}>
                <input id="cp_value" type="number" min="0" className={inputCls}
                  value={form.cp_value} onChange={e => set('cp_value', e.target.value)} />
              </Field>
            </div>

            <Field label="Date *" id="event_date" error={errors.event_date}>
              <input id="event_date" type="date" className={inputCls}
                value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Time (optional)" id="event_time">
                <input id="event_time" type="time" className={inputCls}
                  value={form.event_time} onChange={e => set('event_time', e.target.value)} />
              </Field>

              <Field label="Room (optional)" id="room">
                <input id="room" className={inputCls} placeholder="e.g. Room 3"
                  value={form.room} onChange={e => set('room', e.target.value)} />
              </Field>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70
                  border border-white/[0.08] hover:bg-white/[0.04] transition-all">
                Cancel
              </button>
              <motion.button type="submit" disabled={busy}
                whileHover={busy ? {} : { scale: 1.02 }}
                whileTap={busy  ? {} : { scale: 0.97 }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white
                  flex items-center justify-center gap-2 transition-colors"
                style={{ background: busy ? '#7a0000' : '#CC0000' }}>
                {busy && (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                )}
                {busy ? 'Creating…' : 'Create Event'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Event row ─────────────────────────────────────────────────

function EventRow({ event, onTakeAttendance, delay }) {
  const cat  = CAT_STYLE[event.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.12)' }
  const date = new Date(event.event_date + 'T00:00:00')

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
    >
      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-sm font-semibold text-white">{date.getDate()}</p>
        <p className="text-[10px] text-white/30 uppercase tracking-widest">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </p>
      </td>

      {/* Title + category */}
      <td className="px-4 py-3 min-w-0">
        <p className="text-sm font-semibold text-white truncate max-w-xs">{event.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: cat.color, background: cat.bg }}>
            {event.category}
          </span>
          {event.room && <span className="text-[10px] text-white/30">{event.room}</span>}
          {event.event_time && (
            <span className="text-[10px] text-white/30">{event.event_time.slice(0, 5)}</span>
          )}
        </div>
      </td>

      {/* CP */}
      <td className="px-4 py-3">
        <span className="text-sm font-black text-white">+{event.cp_value}</span>
        <span className="text-[10px] text-white/30 ml-1">CP</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {event.finalised ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Finalised
          </span>
        ) : (
          <span className="text-[11px] font-bold text-white/35">Open</span>
        )}
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => onTakeAttendance(event.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={event.finalised
            ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
            : { background: '#CC0000', color: '#fff' }}
        >
          {event.finalised ? 'View' : 'Take Attendance'}
        </motion.button>
      </td>
    </motion.tr>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function EventManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [events,      setEvents]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
    if (error) toast({ message: 'Failed to load events', type: 'error' })
    setEvents(data ?? [])
    setLoading(false)
  }, [toast])

  useEffect(() => { load() }, [load])

  function handleCreated(event) {
    setEvents(prev => [event, ...prev])
    setShowCreate(false)
    toast({ message: `"${event.title}" created`, type: 'success' })
  }

  const thisMonth = new Date().getMonth()
  const thisYear  = new Date().getFullYear()

  const stats = {
    total:     events.length,
    thisMonth: events.filter(e => {
      const d = new Date(e.event_date)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length,
    finalised: events.filter(e => e.finalised).length,
  }

  return (
    <div className="p-8 space-y-6 max-w-[1100px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Events</h1>
          <p className="text-sm text-white/35 mt-1">
            {loading ? '…' : `${stats.total} total · ${stats.thisMonth} this month · ${stats.finalised} finalised`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#CC0000' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Event
        </motion.button>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
           style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Date', 'Event', 'CP', 'Status', 'Action'].map(h => (
                <th key={h}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 rounded bg-white/[0.06] animate-pulse"
                           style={{ width: `${40 + (j * 19) % 45}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-white/25">
                  No events yet — create one above
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {events.map((event, i) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onTakeAttendance={id => navigate(`/admin/attendance/${id}`)}
                    delay={i * 0.025}
                  />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Create modal ───────────────────────────────────── */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          adminUserId={user?.id}
        />
      )}
    </div>
  )
}
