import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText } from 'lucide-react'
import { supabaseAdminAuth } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'

const ACTION_LABELS = {
  student_created:       'Student Created',
  student_deleted:       'Student Deleted',
  student_deactivated:   'Student Deactivated',
  student_activated:     'Student Activated',
  cp_awarded:            'CP Awarded',
  cp_deducted:           'CP Deducted',
  event_created:         'Event Created',
  event_deleted:         'Event Deleted',
  attendance_finalised:  'Attendance Finalised',
  monthly_reset:         'Monthly Reset',
}

const ACTION_COLORS = {
  student_created:       '#4ade80',
  student_deleted:       '#f87171',
  student_deactivated:   '#fb923c',
  student_activated:     '#4ade80',
  cp_awarded:            '#C9A227',
  cp_deducted:           '#f87171',
  event_created:         '#60a5fa',
  event_deleted:         '#f87171',
  attendance_finalised:  '#a78bfa',
  monthly_reset:         '#f87171',
}

const PER_PAGE = 30

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function Skeleton({ className, style }) {
  return (
    <div
      className={`rounded animate-pulse ${className ?? ''}`}
      style={{ background: 'var(--ad-skeleton)', ...style }}
    />
  )
}

function ActionBadge({ action }) {
  const label = ACTION_LABELS[action] ?? action
  const color = ACTION_COLORS[action] ?? '#9ca3af'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap"
      style={{ background: `${color}1a`, color }}
    >
      {label}
    </span>
  )
}

function DetailsCell({ details }) {
  if (!details || Object.keys(details).length === 0) return <span className="text-white/20">—</span>
  const parts = Object.entries(details).map(([k, v]) => `${k}: ${v}`)
  return (
    <span className="text-xs text-white/45 truncate block max-w-[280px]" title={parts.join(', ')}>
      {parts.join(' · ')}
    </span>
  )
}

function AuditRow({ entry, delay }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.15 }}
      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-xs text-white/50">
          {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(entry.created_at)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-white/60 font-mono truncate max-w-[180px]">{entry.admin_email}</p>
      </td>
      <td className="px-4 py-3">
        <ActionBadge action={entry.action} />
      </td>
      <td className="px-4 py-3">
        <DetailsCell details={entry.details} />
      </td>
    </motion.tr>
  )
}

export default function AuditLog() {
  const { toast } = useToast()

  const [entries,   setEntries]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(0)
  const [search,    setSearch]    = useState('')
  const [actionFlt, setActionFlt] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabaseAdminAuth
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) {
      if (error.code === '42P01') {
        toast({ message: 'Audit log table not found — run the SQL setup in Supabase first.', type: 'error' })
      } else {
        toast({ message: 'Failed to load audit log: ' + error.message, type: 'error' })
      }
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let list = entries
    if (actionFlt) list = list.filter(e => e.action === actionFlt)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.admin_email?.toLowerCase().includes(q) ||
        e.action?.toLowerCase().includes(q) ||
        JSON.stringify(e.details ?? {}).toLowerCase().includes(q)
      )
    }
    return list
  }, [entries, actionFlt, search])

  useEffect(() => { setPage(0) }, [search, actionFlt])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const visible    = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const distinctActions = useMemo(() => [...new Set(entries.map(e => e.action))].sort(), [entries])

  return (
    <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 max-w-[1100px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Audit Log</h1>
          <p className="text-sm text-white/35 mt-1">
            {loading ? '…' : `${entries.length} total events recorded`}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: 'var(--ad-hover)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-2)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="13" height="13"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search admin, action, details…"
            className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-white/25
              bg-white/[0.04] border border-white/[0.07] outline-none focus:border-brand-red/50 transition-colors"
          />
        </div>
        <select
          value={actionFlt}
          onChange={e => setActionFlt(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04] border border-white/[0.07] outline-none cursor-pointer"
        >
          <option value="">All Actions</option>
          {distinctActions.map(a => (
            <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
          ))}
        </select>
      </div>

      {/* ── Table — desktop ──────────────────────────────────── */}
      <div className="hidden md:block rounded-2xl overflow-hidden"
        style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['When', 'Admin', 'Action', 'Details'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  {[70, 180, 110, 220].map((w, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <Skeleton style={{ height: 14, width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ScrollText size={36} style={{ color: 'var(--ad-text-3)', opacity: 0.35 }} />
                    <p className="text-sm" style={{ color: 'var(--ad-text-3)' }}>
                      {entries.length === 0
                        ? 'No audit events yet. Actions will appear here as admins use the panel.'
                        : 'No events match your filters.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {visible.map((entry, i) => (
                  <AuditRow key={entry.id} entry={entry} delay={i * 0.018} />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              {totalPages <= 7 && [...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${i === page ? 'bg-brand-red text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Card list — mobile ──────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-2 animate-pulse"
              style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
              <Skeleton style={{ height: 14, width: '40%' }} />
              <Skeleton style={{ height: 12, width: '65%' }} />
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <ScrollText size={36} className="mx-auto mb-3" style={{ color: 'var(--ad-text-3)', opacity: 0.35 }} />
            <p className="text-sm" style={{ color: 'var(--ad-text-3)' }}>
              {entries.length === 0 ? 'No audit events yet.' : 'No events match your filters.'}
            </p>
          </div>
        ) : (
          visible.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
              className="rounded-2xl p-4 space-y-2"
              style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
              <div className="flex items-start justify-between gap-2">
                <ActionBadge action={entry.action} />
                <span className="text-[10px] text-white/25 shrink-0">{timeAgo(entry.created_at)}</span>
              </div>
              <p className="text-xs text-white/45 font-mono truncate">{entry.admin_email}</p>
              {entry.details && Object.keys(entry.details).length > 0 && (
                <DetailsCell details={entry.details} />
              )}
            </motion.div>
          ))
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
    </div>
  )
}
