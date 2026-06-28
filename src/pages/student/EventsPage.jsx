import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'

const CAT_STYLE = {
  English:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  IELTS:       { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Competition: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  Volunteer:   { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  Korean:      { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  Russian:     { color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  Math:        { color: '#a3e635', bg: 'rgba(163,230,53,0.12)'  },
}

const CATEGORIES = ['All', 'English', 'IELTS', 'Competition', 'Volunteer', 'Korean', 'Russian', 'Math']

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

function EventCard({ event, myAttendance, accent, delay }) {
  const cat       = CAT_STYLE[event.category] ?? { color: '#888', bg: 'rgba(136,136,136,0.12)' }
  const eventDay  = new Date(event.event_date + 'T00:00:00')
  const today     = new Date(new Date().toDateString())
  const isPast    = eventDay < today
  const attended  = myAttendance?.present && myAttendance?.finalised

  const month = eventDay.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day   = eventDay.getDate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.22 }}
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Date block */}
      <div className="shrink-0 w-10 text-center">
        <p className="text-[9px] font-bold text-white/30 leading-none tracking-widest">{month}</p>
        <p className="text-2xl font-black text-white leading-tight">{day}</p>
      </div>

      <div className="w-px h-10 bg-white/[0.07] shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-snug">{event.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ color: cat.color, background: cat.bg }}
          >
            {event.category}
          </span>
          {event.room && (
            <span className="text-[10px] text-white/25">{event.room}</span>
          )}
          {event.event_time && (
            <span className="text-[10px] text-white/25">{event.event_time.slice(0, 5)}</span>
          )}
        </div>
      </div>

      {/* Status / CP */}
      <div className="shrink-0 text-right">
        {attended ? (
          <div>
            <p className="text-[11px] font-bold text-emerald-400">✓ Attended</p>
            {myAttendance.cp_awarded > 0 && (
              <p className="text-[10px] text-emerald-400/50 mt-0.5">+{myAttendance.cp_awarded} CP</p>
            )}
          </div>
        ) : isPast && event.finalised ? (
          <p className="text-[11px] text-white/20">Missed</p>
        ) : (
          <div
            className="px-2 py-1.5 rounded-lg text-center"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
          >
            <p className="text-[11px] font-black" style={{ color: accent }}>+{event.cp_value}</p>
            <p className="text-[9px] text-white/30 leading-none mt-0.5">CP</p>
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
    <div className="min-h-screen bg-brand-dark">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="px-5 pt-12 pb-4">
        <motion.h1
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black text-white"
        >
          Events
        </motion.h1>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <div className="flex rounded-xl overflow-hidden"
             style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[['upcoming', 'Upcoming'], ['past', 'Past']].map(([key, label]) => (
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

      {/* ── Category pills ──────────────────────────────── */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
            style={category === cat
              ? { background: accent, color: '#fff' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── List ────────────────────────────────────────── */}
      <div className="px-5 pb-6 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />)
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <span className="text-4xl">📅</span>
            <p className="text-sm text-white/25">
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
