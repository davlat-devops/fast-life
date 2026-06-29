import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'
import SlideBackground from '@/components/ui/SlideBackground'

// ── Category styles + icons ────────────────────────────────────

const CAT_META = {
  English:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  )},
  IELTS:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )},
  Competition: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  )},
  Volunteer:   { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )},
  Korean:      { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )},
  Russian:     { color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 5h12M3 12h12M3 19h5M21 5l-3 14-4-6-4 6"/>
    </svg>
  )},
  Math:        { color: '#84cc16', bg: 'rgba(132,204,22,0.12)',  icon: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )},
}

const CATEGORIES = ['All', 'English', 'IELTS', 'Competition', 'Volunteer', 'Korean', 'Russian', 'Math']

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

function EventCard({ event, myAttendance, accent, delay }) {
  const cat      = CAT_META[event.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.1)', icon: null }
  const eventDay = new Date(event.event_date + 'T00:00:00')
  const today    = new Date(new Date().toDateString())
  const isPast   = eventDay < today
  const attended = myAttendance?.present && myAttendance?.finalised

  const month = eventDay.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day   = eventDay.getDate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }}
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{
        background:       'rgba(255,255,255,0.03)',
        backdropFilter:   'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border:           '1px solid rgba(255,255,255,0.07)',
        boxShadow:        '0 4px 20px rgba(0,0,0,0.25)',
        borderLeft:       `4px solid ${cat.color}`,
      }}
    >
      {/* Date block */}
      <div className="shrink-0 w-10 text-center">
        <p
          className="text-[9px] font-bold leading-none tracking-widest"
          style={{ color: 'var(--fl-text-3)' }}
        >
          {month}
        </p>
        <p className="text-2xl font-black leading-tight" style={{ color: 'var(--fl-text)' }}>
          {day}
        </p>
      </div>

      <div className="w-px h-10 shrink-0" style={{ background: 'var(--fl-border)' }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate leading-snug" style={{ color: 'var(--fl-text)' }}>
          {event.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: cat.color, background: cat.bg }}
          >
            {cat.icon && <span style={{ display: 'flex' }}>{cat.icon}</span>}
            {event.category}
          </span>
          {event.room && (
            <span className="text-[10px]" style={{ color: 'var(--fl-text-3)' }}>{event.room}</span>
          )}
          {event.event_time && (
            <span className="text-[10px]" style={{ color: 'var(--fl-text-3)' }}>{event.event_time.slice(0, 5)}</span>
          )}
        </div>
      </div>

      {/* Status / CP badge */}
      <div className="shrink-0 text-right">
        {attended ? (
          <div>
            <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle size={11} />
              Attended
            </p>
            {myAttendance.cp_awarded > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(34,197,94,0.6)' }}>+{myAttendance.cp_awarded} CP</p>
            )}
          </div>
        ) : isPast && event.finalised ? (
          <p className="text-[11px]" style={{ color: 'var(--fl-text-3)' }}>Missed</p>
        ) : (
          <div
            className="px-2 py-1.5 rounded-lg text-center"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
          >
            <p className="text-[11px] font-black" style={{ color: accent }}>+{event.cp_value}</p>
            <p className="text-[9px] leading-none mt-0.5" style={{ color: 'var(--fl-text-3)' }}>CP</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function EventsPage() {
  const { studentRecord } = useAuth()
  const accent = CLANS[studentRecord?.clan]?.colorAccent ?? '#CC0000'

  const [events,        setEvents]        = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState('upcoming')
  const [category,      setCategory]      = useState('All')

  useEffect(() => {
    if (!studentRecord) return
    Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: false }),
      supabase.from('attendance')
        .select('event_id, present, finalised, cp_awarded')
        .eq('student_id', studentRecord.id),
    ]).then(([eventsRes, attendRes]) => {
      setEvents(eventsRes.data ?? [])
      const map = {}
      for (const a of attendRes.data ?? []) map[a.event_id] = a
      setAttendanceMap(map)
      setLoading(false)
    })
  }, [studentRecord?.id])

  const today = new Date(new Date().toDateString())

  const filtered = useMemo(() => {
    return events.filter(e => {
      const d = new Date(e.event_date + 'T00:00:00')
      if (tab === 'upcoming' && d < today)  return false
      if (tab === 'past'     && d >= today) return false
      if (category !== 'All' && e.category !== category) return false
      return true
    })
  }, [events, tab, category])

  const sorted = useMemo(() => (
    [...filtered].sort((a, b) => {
      const diff = new Date(a.event_date) - new Date(b.event_date)
      return tab === 'upcoming' ? diff : -diff
    })
  ), [filtered, tab])

  return (
    <div className="min-h-screen" style={{ background: 'var(--fl-bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: 110 }}>
        <SlideBackground overlay="rgba(0,0,0,0.60)" bottomFade />
        <div className="relative z-10 px-5 pt-5 pb-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Calendar size={22} style={{ color: accent }} />
            <h1 className="text-2xl font-black text-white">Events</h1>
          </motion.div>
        </div>
      </div>

      {/* ── Upcoming / Past tabs (premium pill) ─────────── */}
      <div className="px-5 mb-4">
        <div
          className="flex rounded-2xl overflow-hidden p-1 gap-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {[['upcoming', 'Upcoming'], ['past', 'Past']].map(([key, label]) => (
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

      {/* ── Category pills ──────────────────────────────── */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(cat => {
          const meta   = CAT_META[cat]
          const active = category === cat
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={active
                ? {
                    background: meta?.color ?? accent,
                    color: '#fff',
                    boxShadow: `0 2px 10px ${meta?.color ?? accent}55`,
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--fl-text-2)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
            >
              {meta?.icon && (
                <span style={{ color: active ? '#fff' : meta.color, display: 'flex' }}>
                  {meta.icon}
                </span>
              )}
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Event list ──────────────────────────────────── */}
      <div className="px-5 pb-6 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />)
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="flex justify-center">
              <Calendar size={44} style={{ color: 'var(--fl-text-3)', opacity: 0.5 }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--fl-text-3)' }}>
              {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
              {category !== 'All' ? ` in ${category}` : ''}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sorted.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                myAttendance={attendanceMap[event.id]}
                accent={accent}
                delay={i * 0.035}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
