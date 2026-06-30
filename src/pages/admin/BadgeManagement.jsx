import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Search, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { supabaseAdminAuth } from '@/lib/supabase'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/contexts/ToastContext'
import { logAudit } from '@/lib/auditLog'
import { BADGES } from '@/constants/badges'

const ADMIN_BADGES = Object.values(BADGES).filter(b => b.adminOnly)

function syncSession(session) {
  return supabaseAdminAuth.auth.getSession().then(({ data: { session: cur } }) => {
    if (!cur || cur.access_token !== session.access_token) {
      return supabaseAdminAuth.auth.setSession({
        access_token:  session.access_token,
        refresh_token: session.refresh_token,
      })
    }
  })
}

// ── Badge chip ────────────────────────────────────────────────

function BadgeChip({ badge }) {
  return (
    <span
      title={badge.description}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: 'var(--ad-red-faint, rgba(204,0,0,0.12))', color: 'var(--ad-red, #CC0000)', border: '1px solid rgba(204,0,0,0.2)' }}
    >
      <span>{badge.icon}</span>
      {badge.label}
    </span>
  )
}

// ── Award modal ───────────────────────────────────────────────

function AwardModal({ student, earnedKeys, onAward, onClose, busy }) {
  const [selected, setSelected] = useState(null)

  function handleAward() {
    if (!selected || busy) return
    onAward(student, selected)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 12 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--ad-border)' }}
        >
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--ad-text)' }}>Award Badge</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ad-text-3)' }}>{student.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--ad-text-3)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Badge grid */}
        <div className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ad-text-3)' }}>
            Select a badge
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ADMIN_BADGES.map(badge => {
              const earned   = earnedKeys.has(badge.key)
              const isActive = selected?.key === badge.key

              return (
                <button
                  key={badge.key}
                  disabled={earned}
                  onClick={() => !earned && setSelected(badge)}
                  title={earned ? `${badge.label} — already awarded` : badge.description}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all"
                  style={{
                    border: isActive
                      ? '1px solid var(--ad-red, #CC0000)'
                      : '1px solid var(--ad-border)',
                    background: isActive
                      ? 'rgba(204,0,0,0.08)'
                      : earned
                        ? 'var(--ad-hover)'
                        : 'var(--ad-bg)',
                    opacity: earned ? 0.45 : 1,
                    cursor:  earned ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="text-lg leading-none">{badge.icon}</span>
                  <span
                    className="text-[9px] font-semibold leading-tight"
                    style={{ color: isActive ? 'var(--ad-red, #CC0000)' : 'var(--ad-text-2)' }}
                  >
                    {badge.label}
                  </span>
                  {earned && (
                    <Check size={9} style={{ color: 'var(--ad-text-3)' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--ad-border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
            style={{ color: 'var(--ad-text-3)', background: 'var(--ad-hover)', border: '1px solid var(--ad-border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleAward}
            disabled={!selected || busy}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--ad-red, #CC0000)', boxShadow: selected ? '0 2px 12px rgba(204,0,0,0.35)' : 'none' }}
          >
            {busy ? (
              <>
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Awarding…
              </>
            ) : (
              <>
                <Award size={11} />
                Award Badge
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Student row ───────────────────────────────────────────────

function StudentRow({ student, studentBadges, onAward, busy }) {
  const [expanded, setExpanded] = useState(false)

  const adminBadgesEarned = studentBadges.filter(k => BADGES[k]?.adminOnly).map(k => BADGES[k]).filter(Boolean)
  const earnedKeys        = new Set(studentBadges)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ background: 'var(--ad-red, #CC0000)' }}
        >
          {student.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--ad-text)' }}>
            {student.full_name}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {adminBadgesEarned.length === 0 ? (
              <span className="text-[10px]" style={{ color: 'var(--ad-text-4)' }}>No admin badges</span>
            ) : (
              adminBadgesEarned.map(b => <BadgeChip key={b.key} badge={b} />)
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={{ color: 'var(--ad-text-3)', background: 'var(--ad-hover)', border: '1px solid var(--ad-border)' }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Award'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--ad-border)' }}
          >
            <div className="px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--ad-text-4)' }}>
                Award admin badge
              </p>
              <div className="flex flex-wrap gap-2">
                {ADMIN_BADGES.map(badge => {
                  const earned = earnedKeys.has(badge.key)
                  return (
                    <button
                      key={badge.key}
                      disabled={earned || busy}
                      onClick={() => !earned && !busy && onAward(student, badge)}
                      title={earned ? `${badge.label} — already awarded` : `Award ${badge.label}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: earned ? 'var(--ad-hover)' : 'var(--ad-bg)',
                        border:     earned ? '1px solid var(--ad-border)' : '1px solid var(--ad-border)',
                        color:      earned ? 'var(--ad-text-4)' : 'var(--ad-text-2)',
                        opacity:    earned ? 0.6 : 1,
                        cursor:     earned || busy ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={e => {
                        if (!earned && !busy) {
                          e.currentTarget.style.borderColor = 'var(--ad-red, #CC0000)'
                          e.currentTarget.style.color = 'var(--ad-red, #CC0000)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--ad-border)'
                        e.currentTarget.style.color = earned ? 'var(--ad-text-4)' : 'var(--ad-text-2)'
                      }}
                    >
                      <span className="text-sm leading-none">{badge.icon}</span>
                      {badge.label}
                      {earned && <Check size={10} />}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function BadgeManagement() {
  const { session } = useAdminAuth()
  const { toast }   = useToast()

  const [students, setStudents] = useState([])
  const [badges,   setBadges]   = useState({}) // { [student_id]: [badge_key, ...] }
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [busy,     setBusy]     = useState(false)
  const [modal,    setModal]    = useState(null) // { student, earnedKeys }

  useEffect(() => {
    if (!session?.access_token) return
    async function load() {
      await syncSession(session)

      const [studRes, badgeRes] = await Promise.all([
        supabaseAdminAuth
          .from('students')
          .select('id, full_name, clan, is_active')
          .eq('is_active', true)
          .order('full_name'),
        supabaseAdminAuth
          .from('badges')
          .select('student_id, badge_key'),
      ])

      if (studRes.error)  { toast({ message: studRes.error.message,  type: 'error' }); return }
      if (badgeRes.error) { toast({ message: badgeRes.error.message, type: 'error' }); return }

      const badgeMap = {}
      for (const row of badgeRes.data ?? []) {
        if (!badgeMap[row.student_id]) badgeMap[row.student_id] = []
        badgeMap[row.student_id].push(row.badge_key)
      }

      setStudents(studRes.data ?? [])
      setBadges(badgeMap)
      setLoading(false)
    }
    load()
  }, [session])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(s => s.full_name.toLowerCase().includes(q))
  }, [students, search])

  async function handleAward(student, badge) {
    if (busy) return
    setBusy(true)
    try {
      await syncSession(session)

      const { error } = await supabaseAdminAuth
        .from('badges')
        .insert({ student_id: student.id, badge_key: badge.key })

      if (error) {
        if (error.code === '23505') {
          toast({ message: `${student.full_name} already has ${badge.label}`, type: 'warning' })
        } else {
          toast({ message: error.message, type: 'error' })
        }
        return
      }

      await logAudit('badge_awarded', { student: student.full_name, badge: badge.key, badge_label: badge.label })

      setBadges(prev => {
        const existing = prev[student.id] ?? []
        if (existing.includes(badge.key)) return prev
        return { ...prev, [student.id]: [...existing, badge.key] }
      })

      toast({ message: `${badge.label} awarded to ${student.full_name}`, type: 'success' })
      setModal(null)
    } catch (err) {
      toast({ message: err.message ?? 'Failed to award badge', type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black" style={{ color: 'var(--ad-text)' }}>Badge Management</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--ad-text-3)' }}>
          Award admin badges to students. Automatic badges are awarded by the system when earned.
        </p>
      </div>

      {/* Legend */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ad-text-4)' }}>
          Admin-only badges
        </p>
        <div className="flex flex-wrap gap-2">
          {ADMIN_BADGES.map(b => (
            <span
              key={b.key}
              title={b.description}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px]"
              style={{ background: 'var(--ad-bg)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-2)' }}
            >
              <span>{b.icon}</span>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--ad-text-4)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background:   'var(--ad-surface)',
            border:       '1px solid var(--ad-border)',
            color:        'var(--ad-text)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ad-text-4)' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Student list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--ad-surface)' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Award size={32} style={{ color: 'var(--ad-text-4)', margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: 'var(--ad-text-3)' }}>
            {search ? 'No students match your search' : 'No active students'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(student => (
            <StudentRow
              key={student.id}
              student={student}
              studentBadges={badges[student.id] ?? []}
              onAward={handleAward}
              busy={busy}
            />
          ))}
        </div>
      )}

      {/* Modal (unused — inline awards used instead, but kept for possible future use) */}
      <AnimatePresence>
        {modal && (
          <AwardModal
            student={modal.student}
            earnedKeys={modal.earnedKeys}
            onAward={handleAward}
            onClose={() => setModal(null)}
            busy={busy}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
