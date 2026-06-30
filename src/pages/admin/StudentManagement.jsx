import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { supabaseAdminAuth } from '@/lib/supabase'
import { adminEdge } from '@/lib/adminEdge'
import { logAudit } from '@/lib/auditLog'
import { CLANS } from '@/constants/clans'
import { ClanIcon } from '@/components/ui/ClanIcons'
import { useToast } from '@/contexts/ToastContext'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import CreateStudentModal from '@/components/admin/CreateStudentModal'
import CredentialsModal  from '@/components/admin/CredentialsModal'

// ── Helpers ───────────────────────────────────────────────────

function generatePassword(len = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Constants ─────────────────────────────────────────────────
const LEVELS    = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const PER_PAGE  = 25

const LEVEL_COLOUR = {
  A1: '#6b7280', A2: '#6b7280',
  B1: '#3b82f6', B2: '#3b82f6',
  C1: '#C9A227', C2: '#C9A227',
}

// ── Sub-components ────────────────────────────────────────────

function Avatar({ name, clan }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const accent   = CLANS[clan]?.colorAccent ?? '#555'
  return (
    <div
      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
      style={{ background: accent }}
    >
      {initials}
    </div>
  )
}

function LevelBadge({ level }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
      style={{ background: `${LEVEL_COLOUR[level]}33`, color: LEVEL_COLOUR[level] }}
    >
      {level}
    </span>
  )
}

function ClanChip({ clanId }) {
  const info = CLANS[clanId]
  if (!info) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color: info.colorAccent }}>
      <ClanIcon clanId={clanId} size={14} />
      {info.name}
    </span>
  )
}

function EyeIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      )}
    </svg>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none
        ${checked ? 'bg-emerald-600' : 'bg-white/15'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04]">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: `${40 + (i * 17) % 50}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ── Delete single student modal ───────────────────────────────

function DeleteStudentModal({ student, onConfirm, onClose, busy }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.18 }}
        style={{
          background: 'var(--ad-surface)', border: '1px solid rgba(185,28,28,0.35)',
          borderRadius: 16, padding: '24px', width: '100%', maxWidth: 420,
          boxShadow: '0 0 0 1px rgba(185,28,28,0.15), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'rgba(185,28,28,0.15)',
            border: '1px solid rgba(185,28,28,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={18} strokeWidth={2} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ad-text)', margin: '0 0 4px' }}>
              Delete Student
            </p>
            <p style={{ fontSize: 13, color: 'var(--ad-text-2)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: 'var(--ad-text)' }}>{student.full_name}</strong>?
              This will remove ALL their data — attendance, CP, badges, and snapshots.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'var(--ad-hover)', border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-2)', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: busy ? 'rgba(185,28,28,0.4)' : '#b91c1c',
              border: '1px solid rgba(185,28,28,0.5)',
              color: '#fff', cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy
              ? <><Loader2 size={13} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Deleting…</>
              : <><Trash2 size={13} strokeWidth={2} /> Delete</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Delete ALL students modal ─────────────────────────────────

function DeleteAllModal({ count, onConfirm, onClose, busy }) {
  const [input, setInput] = useState('')
  const ready = input === 'DELETE'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'var(--ad-surface)', border: '1px solid rgba(185,28,28,0.4)',
          borderRadius: 18, padding: '28px', width: '100%', maxWidth: 460,
          boxShadow: '0 0 0 1px rgba(185,28,28,0.2), 0 32px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Warning header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'rgba(185,28,28,0.18)',
            border: '1px solid rgba(185,28,28,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={20} strokeWidth={2} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#f87171', margin: 0 }}>
              Danger — Irreversible Action
            </p>
            <p style={{ fontSize: 12, color: 'var(--ad-text-3)', margin: '2px 0 0' }}>
              This cannot be undone
            </p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ad-text-2)', lineHeight: 1.6, margin: '0 0 20px' }}>
          This will permanently delete{' '}
          <strong style={{ color: '#f87171' }}>all {count} students</strong>{' '}
          and their data — attendance records, CP awards, badges, monthly snapshots, and auth accounts.
        </p>

        {/* Confirmation input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ad-text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
            Type <span style={{ color: '#f87171', fontFamily: 'monospace' }}>DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="DELETE"
            disabled={busy}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--ad-input-bg)', border: `1.5px solid ${ready ? '#b91c1c' : 'var(--ad-input-border)'}`,
              borderRadius: 10, padding: '10px 13px', fontSize: 15,
              fontWeight: 700, color: ready ? '#f87171' : 'var(--ad-text)',
              outline: 'none', letterSpacing: '0.08em',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'var(--ad-hover)', border: '1px solid var(--ad-border)',
              color: 'var(--ad-text-2)', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!ready || busy}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: ready && !busy ? '#b91c1c' : 'var(--ad-hover)',
              border: `1px solid ${ready && !busy ? 'rgba(185,28,28,0.5)' : 'var(--ad-border)'}`,
              color: ready && !busy ? '#fff' : 'var(--ad-text-3)',
              cursor: !ready || busy ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {busy
              ? <><Loader2 size={13} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Deleting all…</>
              : <><Trash2 size={13} strokeWidth={2} /> Delete All {count} Students</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Student row ───────────────────────────────────────────────

function StudentRow({ student, onToggleActive, onResetPassword, onDelete, delay }) {
  const [toggling,   setToggling]   = useState(false)
  const [showPw,     setShowPw]     = useState(false)
  const [resetting,  setResetting]  = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onToggleActive(student)
    setToggling(false)
  }

  async function handleReset() {
    setResetting(true)
    await onResetPassword(student)
    setResetting(false)
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
    >
      {/* Name + avatar */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.full_name} clan={student.clan} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{student.full_name}</p>
            <p className="text-[11px] text-white/35 font-mono">{student.username}</p>
          </div>
        </div>
      </td>

      {/* Clan */}
      <td className="px-4 py-3"><ClanChip clanId={student.clan} /></td>

      {/* Level */}
      <td className="px-4 py-3"><LevelBadge level={student.level} /></td>

      {/* CP */}
      <td className="px-4 py-3">
        <span className="text-sm font-bold text-white">{student.cp.toLocaleString()}</span>
      </td>

      {/* Class group */}
      <td className="px-4 py-3">
        <span className="text-xs text-white/50">{student.class_group}</span>
      </td>

      {/* Age */}
      <td className="px-4 py-3">
        <span className="text-xs text-white/40">{student.age}</span>
      </td>

      {/* Password */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPw(v => !v)}
            className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
            title={showPw ? 'Hide password' : 'Reveal password'}
          >
            <EyeIcon open={showPw} />
          </button>
          <span className="font-mono text-xs text-white/55 select-all min-w-[64px]">
            {showPw
              ? (student.password_plain ?? <span className="text-white/20 not-italic">not set</span>)
              : '••••••••'}
          </span>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold
              text-white/35 hover:text-white/70 border border-white/[0.07] hover:bg-white/[0.05]
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Reset password"
          >
            {resetting ? (
              <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M3 21v-5h5"/>
              </svg>
            )}
            Reset
          </button>
        </div>
      </td>

      {/* Active toggle */}
      <td className="px-4 py-3">
        <Toggle checked={student.is_active} onChange={handleToggle} disabled={toggling} />
      </td>

      {/* Delete */}
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(student)}
          title="Delete student"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold
            text-red-400/60 hover:text-red-400 border border-transparent hover:border-red-500/30
            hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={13} strokeWidth={2} />
          Delete
        </button>
      </td>
    </motion.tr>
  )
}

// ── Search + filter bar ───────────────────────────────────────

function FilterBar({ search, setSearch, filters, setFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" width="14" height="14"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, username…"
          className="w-full pl-8 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-white/25
            bg-white/[0.04] border border-white/[0.07] outline-none focus:border-brand-red/50 transition-colors"
        />
      </div>

      {/* Clan filter */}
      <select
        value={filters.clan}
        onChange={e => setFilters(f => ({ ...f, clan: e.target.value }))}
        className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04] border border-white/[0.07] outline-none cursor-pointer"
      >
        <option value="">All Clans</option>
        {Object.values(CLANS).map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Level filter */}
      <select
        value={filters.level}
        onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}
        className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04] border border-white/[0.07] outline-none cursor-pointer"
      >
        <option value="">All Levels</option>
        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        className="px-3 py-2 rounded-xl text-sm text-white/60 bg-white/[0.04] border border-white/[0.07] outline-none cursor-pointer"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="">All</option>
      </select>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function StudentManagement() {
  const { toast } = useToast()
  const { session } = useAdminAuth()

  const [students, setStudents]     = useState([])
  const [loading,  setLoading]      = useState(true)
  const [search,   setSearch]       = useState('')
  const [filters,  setFilters]      = useState({ clan: '', level: '', status: 'active' })
  const [page,     setPage]         = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [credentials, setCredentials] = useState(null)   // { username, password, clan }
  const [newStudentName, setNewStudentName] = useState('')
  const [credentialMode, setCredentialMode] = useState('created')  // 'created' | 'reset'

  const [deletingStudent, setDeletingStudent] = useState(null)  // student object to confirm delete
  const [deleteStudentBusy, setDeleteStudentBusy] = useState(false)
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [deleteAllBusy, setDeleteAllBusy] = useState(false)

  // ── Data loading ──────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true)

    if (!session?.access_token) {
      toast({ message: 'Session lost — please log out and log back in', type: 'error' })
      setStudents([])
      setLoading(false)
      return
    }

    // Sync AdminAuthContext session into the Supabase client in case
    // the client's internal state was cleared (storageKey race condition).
    await supabaseAdminAuth.auth.setSession({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
    })

    let q = supabaseAdminAuth.from('students').select('*').order('created_at', { ascending: false })

    if (filters.clan)   q = q.eq('clan', filters.clan)
    if (filters.level)  q = q.eq('level', filters.level)
    if (filters.status === 'active')   q = q.eq('is_active', true)
    if (filters.status === 'inactive') q = q.eq('is_active', false)

    const { data, error } = await q
    if (error) toast({ message: `Failed to load students: ${error.message} (${error.code})`, type: 'error' })
    setStudents(data ?? [])
    setLoading(false)
  }, [filters, session, toast])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { setPage(0) }, [search, filters])

  // ── Client-side search ────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.class_group.toLowerCase().includes(q) ||
      s.phone.includes(q)
    )
  }, [students, search])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const visible    = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  // ── Handlers ──────────────────────────────────────────────
  async function toggleActive(student) {
    const next = !student.is_active
    const { error } = await supabaseAdminAuth
      .from('students')
      .update({ is_active: next })
      .eq('id', student.id)

    if (error) {
      toast({ message: 'Failed to update student status', type: 'error' })
    } else {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_active: next } : s))
      toast({ message: `${student.full_name} ${next ? 'activated' : 'deactivated'}`, type: 'success' })
      logAudit(next ? 'student_activated' : 'student_deactivated', { name: student.full_name, username: student.username })
    }
  }

  function handleCreated(student, creds) {
    setShowCreate(false)
    setNewStudentName(student.full_name)
    setCredentialMode('created')
    setCredentials(creds)
    fetchStudents()
    toast({ message: `${student.full_name} created and assigned to ${creds.clan}`, type: 'success' })
    logAudit('student_created', { name: student.full_name, username: creds.username, clan: creds.clan })
  }

  async function handleResetPassword(student) {
    const newPw = generatePassword(8)

    try {
      // 1. Update Supabase Auth password via Edge Function
      await adminEdge.resetPassword(student.auth_user_id, newPw)

      // 2. Save plain-text to students table
      const { error: dbErr } = await supabaseAdminAuth
        .from('students')
        .update({ password_plain: newPw })
        .eq('id', student.id)
      if (dbErr) throw dbErr

      // 3. Update local state so the row shows the new password immediately
      setStudents(prev =>
        prev.map(s => s.id === student.id ? { ...s, password_plain: newPw } : s)
      )

      // 4. Show credentials modal
      setNewStudentName(student.full_name)
      setCredentialMode('reset')
      setCredentials({ username: student.username, password: newPw, clan: student.clan })
    } catch (err) {
      toast({ message: `Password reset failed: ${err.message}`, type: 'error' })
    }
  }

  async function deleteStudentData(student) {
    const id     = student.id
    const authId = student.auth_user_id
    await supabaseAdminAuth.from('cp_awards').delete().eq('student_id', id)
    await supabaseAdminAuth.from('attendance').delete().eq('student_id', id)
    await supabaseAdminAuth.from('badges').delete().eq('student_id', id)
    await supabaseAdminAuth.from('monthly_snapshots').delete().eq('student_id', id)
    await supabaseAdminAuth.from('students').delete().eq('id', id)
    if (authId) await adminEdge.deleteAuthUser(authId)
  }

  async function handleDeleteStudent() {
    if (!deletingStudent) return
    setDeleteStudentBusy(true)
    try {
      const name = deletingStudent.full_name
      await deleteStudentData(deletingStudent)
      setStudents(prev => prev.filter(s => s.id !== deletingStudent.id))
      toast({ message: 'Student deleted successfully', type: 'success' })
      logAudit('student_deleted', { name, username: deletingStudent.username })
    } catch (err) {
      toast({ message: 'Delete failed: ' + err.message, type: 'error' })
    }
    setDeleteStudentBusy(false)
    setDeletingStudent(null)
  }

  async function handleDeleteAll() {
    setDeleteAllBusy(true)
    try {
      for (const student of students) {
        await deleteStudentData(student)
      }
      setStudents([])
      toast({ message: `All ${students.length} students deleted`, type: 'success' })
    } catch (err) {
      toast({ message: 'Delete all failed: ' + err.message, type: 'error' })
      await fetchStudents()
    }
    setDeleteAllBusy(false)
    setShowDeleteAll(false)
  }

  return (
    <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 max-w-[1200px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Students</h1>
          <p className="text-sm text-white/35 mt-1">
            {loading ? '…' : `${students.length} students`}
            {filtered.length !== students.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {students.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowDeleteAll(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(185,28,28,0.15)', border: '1px solid rgba(185,28,28,0.35)', color: '#f87171' }}
            >
              <Trash2 size={14} strokeWidth={2} />
              Delete All
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#CC0000' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Student
          </motion.button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <FilterBar search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} />

      {/* ── Table — desktop ────────────────────────────────── */}
      <div className="hidden md:block rounded-2xl overflow-x-auto"
        style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', backdropFilter: 'blur(12px)' }}>
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Student', 'Clan', 'Level', 'CP', 'Class Group', 'Age', 'Password', 'Active', ''].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-sm text-white/25">
                  {search || filters.clan || filters.level
                    ? 'No students match your filters'
                    : 'No students yet. Click Add Student to get started.'}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {visible.map((s, i) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onToggleActive={toggleActive}
                    onResetPassword={handleResetPassword}
                    onDelete={setDeletingStudent}
                    delay={i * 0.025}
                  />
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
            <div className="flex gap-2 flex-wrap">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                    ${i === page ? 'bg-brand-red text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}>
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
            <div key={i} className="rounded-2xl p-4 space-y-3 animate-pulse"
              style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--ad-skeleton)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded" style={{ background: 'var(--ad-skeleton)' }} />
                  <div className="h-3 w-24 rounded" style={{ background: 'var(--ad-skeleton)' }} />
                </div>
              </div>
            </div>
          ))
        ) : visible.length === 0 ? (
          <p className="text-center py-12 text-sm text-white/25">
            {search || filters.clan || filters.level ? 'No students match your filters' : 'No students yet. Click Add Student to get started.'}
          </p>
        ) : (
          visible.map((s, i) => {
            const accent   = CLANS[s.clan]?.colorAccent ?? '#555'
            const initials = s.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)' }}>
                {/* Row 1: avatar + name + actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: accent }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.full_name}</p>
                      <p className="text-[11px] text-white/35 font-mono">{s.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Toggle checked={s.is_active}
                      onChange={async () => { await toggleActive(s) }}
                      disabled={false} />
                    <button onClick={() => setDeletingStudent(s)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400/60 hover:text-red-400 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {/* Row 2: meta badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <ClanChip clanId={s.clan} />
                  <LevelBadge level={s.level} />
                  <span className="text-xs font-bold text-white">{s.cp.toLocaleString()} CP</span>
                  {s.class_group && <span className="text-[11px] text-white/40">{s.class_group}</span>}
                  {s.age && <span className="text-[11px] text-white/30">Age {s.age}</span>}
                </div>
                {/* Row 3: password + reset */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.05]">
                  <span className="font-mono text-xs text-white/40 flex-1 truncate">
                    {s.password_plain ?? 'no password set'}
                  </span>
                  <button
                    onClick={() => handleResetPassword(s)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold
                      text-white/35 hover:text-white/70 border border-white/[0.07] hover:bg-white/[0.05] transition-all min-h-[44px]"
                  >
                    Reset pw
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
        {/* Mobile pagination */}
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

      {/* ── Modals ─────────────────────────────────────────── */}
      {showCreate && (
        <CreateStudentModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {credentials && (
        <CredentialsModal
          credentials={credentials}
          studentName={newStudentName}
          mode={credentialMode}
          onClose={() => { setCredentials(null); setNewStudentName('') }}
        />
      )}

      <AnimatePresence>
        {deletingStudent && (
          <DeleteStudentModal
            student={deletingStudent}
            busy={deleteStudentBusy}
            onConfirm={handleDeleteStudent}
            onClose={() => !deleteStudentBusy && setDeletingStudent(null)}
          />
        )}
        {showDeleteAll && (
          <DeleteAllModal
            count={students.length}
            busy={deleteAllBusy}
            onConfirm={handleDeleteAll}
            onClose={() => !deleteAllBusy && setShowDeleteAll(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
