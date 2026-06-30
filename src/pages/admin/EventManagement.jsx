import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, supabaseAdminAuth } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/contexts/ToastContext'
import { EVENT_CATEGORIES, DEFAULT_EVENT_CP, CP_FOR_CATEGORY } from '@/constants/cp'
import { CLANS } from '@/constants/clans'
import { logAudit } from '@/lib/auditLog'

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
    if (!form.title.trim())    errs.title = 'Title is required'
    if (!form.event_date) {
      errs.event_date = 'Date is required'
    } else {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      if (new Date(form.event_date) < oneYearAgo) errs.event_date = 'Date cannot be more than 1 year in the past'
    }
    const cpNum = Number(form.cp_value)
    if (form.cp_value === '' || isNaN(cpNum) || cpNum < 1 || cpNum > 500) errs.cp_value = 'CP must be between 1 and 500'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)
    const { data: res, error } = await supabaseAdminAuth.functions.invoke('admin-operations', {
      body: {
        action:     'create_event',
        title:      form.title.trim(),
        category:   form.category,
        event_date: form.event_date,
        event_time: form.event_time || null,
        room:       form.room.trim() || null,
        cp_value:   Number(form.cp_value),
        created_by: adminUserId,
      },
    })

    setBusy(false)
    if (error || res?.error) {
      toast({ message: res?.error ?? error?.message ?? 'Failed to create event', type: 'error' })
      return
    }
    onCreated(res.event)
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
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}
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

// ── Edit Event Modal ──────────────────────────────────────────

function EditEventModal({ event, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:      event.title ?? '',
    category:   event.category ?? 'English',
    event_date: event.event_date ?? '',
    event_time: event.event_time ?? '',
    room:       event.room ?? '',
    cp_value:   event.cp_value ?? DEFAULT_EVENT_CP,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  function set(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'category') next.cp_value = CP_FOR_CATEGORY[val] ?? DEFAULT_EVENT_CP
      return next
    })
    setErrors(e => ({ ...e, [key]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim())    errs.title = 'Title is required'
    if (!form.event_date) {
      errs.event_date = 'Date is required'
    } else {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      if (new Date(form.event_date) < oneYearAgo) errs.event_date = 'Date cannot be more than 1 year in the past'
    }
    const cpNum = Number(form.cp_value)
    if (form.cp_value === '' || isNaN(cpNum) || cpNum < 1 || cpNum > 500) errs.cp_value = 'CP must be between 1 and 500'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)
    const { data, error } = await supabaseAdminAuth.from('events').update({
      title:      form.title.trim(),
      category:   form.category,
      event_date: form.event_date,
      event_time: form.event_time || null,
      room:       form.room.trim() || null,
      cp_value:   Number(form.cp_value),
    }).eq('id', event.id).select().single()

    setBusy(false)
    if (error) { toast({ message: error.message, type: 'error' }); return }
    onSaved(data)
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
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white">Edit Event</h2>
              <p className="text-xs text-white/35 mt-0.5">Changes apply immediately after saving</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <Field label="Title *" id="edit-title" error={errors.title}>
              <input id="edit-title" className={inputCls} placeholder="e.g. IELTS Mock Test #4"
                value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category *" id="edit-category">
                <select id="edit-category" className={inputCls + ' cursor-pointer'}
                  value={form.category} onChange={e => set('category', e.target.value)}>
                  {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="CP Value *" id="edit-cp_value" error={errors.cp_value}>
                <input id="edit-cp_value" type="number" min="0" className={inputCls}
                  value={form.cp_value} onChange={e => set('cp_value', e.target.value)} />
              </Field>
            </div>

            <Field label="Date *" id="edit-event_date" error={errors.event_date}>
              <input id="edit-event_date" type="date" className={inputCls}
                value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Time (optional)" id="edit-event_time">
                <input id="edit-event_time" type="time" className={inputCls}
                  value={form.event_time} onChange={e => set('event_time', e.target.value)} />
              </Field>

              <Field label="Room (optional)" id="edit-room">
                <input id="edit-room" className={inputCls} placeholder="e.g. Room 3"
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
                {busy ? 'Saving…' : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Delete Confirmation Modal ──────────────────────────────────

function DeleteConfirmModal({ eventTitle, onConfirm, onClose, busy }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{   opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-sm rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-11 h-11 rounded-full mx-auto"
               style={{ background: 'rgba(229,62,62,0.12)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-white">Delete Event?</h3>
            <p className="text-sm text-white/40 mt-1">
              Are you sure you want to delete <span className="text-white/70 font-medium">"{eventTitle}"</span>?
              This cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70
                border border-white/[0.08] hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <motion.button
              onClick={onConfirm}
              disabled={busy}
              whileHover={busy ? {} : { scale: 1.02 }}
              whileTap={busy  ? {} : { scale: 0.97 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white
                flex items-center justify-center gap-2 transition-colors"
              style={{ background: busy ? '#7a0000' : '#DC2626' }}>
              {busy && (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              )}
              {busy ? 'Deleting…' : 'Delete'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Participants Modal ────────────────────────────────────────

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ParticipantsModal({ event, onClose }) {
  const [participants, setParticipants] = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    supabaseAdminAuth
      .from('event_rsvps')
      .select('id, created_at, students(full_name, username, clan)')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setParticipants(data ?? [])
        setLoading(false)
      })
  }, [event.id])

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
          className="relative w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-base font-bold text-white truncate">{event.title}</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {loading ? '…' : `${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded bg-white/[0.06] animate-pulse w-40" />
                      <div className="h-3 rounded bg-white/[0.06] animate-pulse w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-12">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3 text-white/15">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p className="text-sm text-white/25">No participants yet</p>
              </div>
            ) : (
              participants.map((p, i) => {
                const student    = p.students
                const clanAccent = CLANS[student?.clan]?.colorAccent ?? '#555'
                const clanName   = CLANS[student?.clan]?.name ?? student?.clan ?? '—'
                const initials   = (student?.full_name ?? '?').split(' ')
                  .map(w => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-6 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Index */}
                    <span className="text-[11px] font-bold w-5 text-center shrink-0 text-white/25">
                      {i + 1}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: clanAccent }}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{student?.full_name ?? '—'}</p>
                      <p className="text-[10px] text-white/35">
                        @{student?.username ?? '—'} · {clanName}
                      </p>
                    </div>

                    {/* Signed up */}
                    <p className="text-[10px] text-white/25 shrink-0">{timeAgo(p.created_at)}</p>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Event row ─────────────────────────────────────────────────

function EventRow({ event, onTakeAttendance, onEdit, onDelete, onShowParticipants, rsvpCount, delay }) {
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

      {/* Status + participant count */}
      <td className="px-4 py-3">
        <div className="space-y-1.5">
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
          <button
            onClick={() => onShowParticipants(event)}
            className="flex items-center gap-1 text-[10px] font-semibold transition-colors hover:text-blue-300"
            style={{
              color: rsvpCount > 0 ? '#60a5fa' : 'var(--ad-text-4)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {rsvpCount} going
          </button>
        </div>
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Attendance / View */}
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onTakeAttendance(event.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={event.finalised
              ? { background: 'var(--ad-hover)', color: 'var(--ad-text-2)', border: '1px solid var(--ad-border)' }
              : { background: '#CC0000', color: '#fff' }}
          >
            {event.finalised ? 'View' : 'Take Attendance'}
          </motion.button>

          {/* Edit */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onEdit(event)}
            title="Edit event"
            style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--ad-hover)',
              border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-2)',
              cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </motion.button>

          {/* Delete */}
          <motion.button
            whileHover={{ scale: 1.08, background: 'rgba(239,68,68,0.15)' }}
            whileTap={{ scale: 0.93 }}
            onClick={() => onDelete(event)}
            title="Delete event"
            style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </motion.button>
        </div>
      </td>
    </motion.tr>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function EventManagement() {
  const { user } = useAdminAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [events,        setEvents]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showCreate,    setShowCreate]    = useState(false)
  const [editingEvent,  setEditingEvent]  = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(null)
  const [deleteBusy,        setDeleteBusy]        = useState(false)
  const [rsvpCounts,        setRsvpCounts]        = useState({})
  const [participantsEvent, setParticipantsEvent] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [eventsRes, rsvpRes] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: false }),
      supabaseAdminAuth.from('event_rsvps').select('event_id'),
    ])
    if (eventsRes.error) toast({ message: 'Failed to load events', type: 'error' })
    setEvents(eventsRes.data ?? [])
    const counts = {}
    for (const r of rsvpRes.data ?? []) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1
    setRsvpCounts(counts)
    setLoading(false)
  }, [toast])

  useEffect(() => { load() }, [load])

  function handleCreated(event) {
    setEvents(prev => [event, ...prev])
    setShowCreate(false)
    toast({ message: `"${event.title}" created`, type: 'success' })
    logAudit('event_created', { title: event.title, category: event.category, cp_value: event.cp_value })
  }

  function handleSaved(updated) {
    setEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingEvent(null)
    toast({ message: `"${updated.title}" updated`, type: 'success' })
  }

  async function handleDeleteConfirm() {
    if (!deletingEvent) return
    setDeleteBusy(true)
    const { error } = await supabaseAdminAuth.from('events').delete().eq('id', deletingEvent.id)
    setDeleteBusy(false)
    if (error) { toast({ message: error.message, type: 'error' }); return }
    setEvents(prev => prev.filter(e => e.id !== deletingEvent.id))
    toast({ message: `"${deletingEvent.title}" deleted`, type: 'success' })
    logAudit('event_deleted', { title: deletingEvent.title })
    setDeletingEvent(null)
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
    <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 max-w-[1100px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Events</h1>
          <p className="text-sm text-white/35 mt-1">
            {loading ? '…' : `${stats.total} total · ${stats.thisMonth} this month · ${stats.finalised} finalised`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* TEMP DEBUG — remove after investigating */}
          <button
            onClick={async () => {
              const { data: { session } } = await supabaseAdminAuth.auth.getSession()
              console.log('=== ADMIN SESSION DEBUG ===')
              console.log('session exists:', !!session)
              console.log('user_metadata:', session?.user?.user_metadata)
              console.log('email:', session?.user?.email)
              console.log('access_token (first 40 chars):', session?.access_token?.slice(0, 40))
              console.log('token expires_at:', session?.expires_at)

              console.log('--- Testing edge function ---')
              const { data: res, error } = await supabaseAdminAuth.functions.invoke('admin-operations', {
                body: { action: 'list_admin_users' },
              })
              console.log('Edge fn error:', error)
              console.log('Edge fn response:', res)
            }}
            className="px-3 py-2 rounded-lg text-xs font-bold text-yellow-300 border border-yellow-500/40 bg-yellow-500/10"
          >
            Debug Session
          </button>
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
      </div>

      {/* ── Table — desktop ──────────────────────────────────── */}
      <div className="hidden md:block rounded-2xl overflow-hidden"
           style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Date', 'Event', 'CP', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
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
                      <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: `${40 + (j * 19) % 45}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-white/25">
                  No events this month. Click New Event to create one.
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {events.map((event, i) => (
                  <EventRow key={event.id} event={event}
                    onTakeAttendance={id => navigate(`/admin/attendance/${id}`)}
                    onEdit={setEditingEvent} onDelete={setDeletingEvent} delay={i * 0.025}
                    rsvpCount={rsvpCounts[event.id] ?? 0}
                    onShowParticipants={setParticipantsEvent} />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Card list — mobile ──────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-3 animate-pulse"
              style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
              <div className="h-4 rounded" style={{ background: 'var(--ad-skeleton)', width: '60%' }} />
              <div className="h-3 rounded" style={{ background: 'var(--ad-skeleton)', width: '40%' }} />
            </div>
          ))
        ) : events.length === 0 ? (
          <p className="text-center py-12 text-sm text-white/25">No events this month. Click New Event to create one.</p>
        ) : (
          events.map((event, i) => {
            const cat  = CAT_STYLE[event.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.12)' }
            const date = new Date(event.event_date + 'T00:00:00')
            return (
              <motion.div key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
                {/* Title + date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: cat.color, background: cat.bg }}>{event.category}</span>
                      {event.room && <span className="text-[10px] text-white/30">{event.room}</span>}
                      {event.event_time && <span className="text-[10px] text-white/30">{event.event_time.slice(0, 5)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{date.getDate()}</p>
                    <p className="text-[10px] text-white/30 uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                  </div>
                </div>
                {/* CP + status + actions */}
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white">+{event.cp_value} <span className="text-white/30 font-normal text-xs">CP</span></span>
                    <div className="flex flex-col gap-0.5">
                      {event.finalised
                        ? <span className="text-[11px] font-bold text-emerald-400">Finalised</span>
                        : <span className="text-[11px] text-white/35">Open</span>
                      }
                      <button
                        onClick={() => setParticipantsEvent(event)}
                        className="flex items-center gap-1 text-[10px] font-semibold transition-colors hover:text-blue-300"
                        style={{
                          color: (rsvpCounts[event.id] ?? 0) > 0 ? '#60a5fa' : 'var(--ad-text-4)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {rsvpCounts[event.id] ?? 0} going
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/admin/attendance/${event.id}`)}
                      className="px-3 py-2 rounded-lg text-xs font-bold min-h-[44px]"
                      style={event.finalised
                        ? { background: 'var(--ad-hover)', color: 'var(--ad-text-2)', border: '1px solid var(--ad-border)' }
                        : { background: '#CC0000', color: '#fff' }}>
                      {event.finalised ? 'View' : 'Attend'}
                    </motion.button>
                    <button onClick={() => setEditingEvent(event)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[44px]"
                      style={{ background: 'var(--ad-hover)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-2)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={() => setDeletingEvent(event)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[44px]"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* ── Create modal ───────────────────────────────────── */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          adminUserId={user?.id}
        />
      )}

      {/* ── Edit modal ─────────────────────────────────────── */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Delete confirmation ────────────────────────────── */}
      {deletingEvent && (
        <DeleteConfirmModal
          eventTitle={deletingEvent.title}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingEvent(null)}
          busy={deleteBusy}
        />
      )}

      {/* ── Participants modal ─────────────────────────────── */}
      {participantsEvent && (
        <ParticipantsModal
          event={participantsEvent}
          onClose={() => setParticipantsEvent(null)}
        />
      )}
    </div>
  )
}
