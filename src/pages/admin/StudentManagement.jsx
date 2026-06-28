import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CLANS } from '@/constants/clans'
import { useToast } from '@/contexts/ToastContext'
import CreateStudentModal from '@/components/admin/CreateStudentModal'
import CredentialsModal  from '@/components/admin/CredentialsModal'

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
      <span>{info.emoji}</span>
      {info.name}
    </span>
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
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: `${40 + (i * 17) % 50}%` }} />
        </td>
      ))}
    </tr>
  )
}

function StudentRow({ student, onToggleActive, delay }) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onToggleActive(student)
    setToggling(false)
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

      {/* Active toggle */}
      <td className="px-4 py-3">
        <Toggle checked={student.is_active} onChange={handleToggle} disabled={toggling} />
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
          <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
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

  const [students, setStudents]     = useState([])
  const [loading,  setLoading]      = useState(true)
  const [search,   setSearch]       = useState('')
  const [filters,  setFilters]      = useState({ clan: '', level: '', status: 'active' })
  const [page,     setPage]         = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [credentials, setCredentials] = useState(null)   // { username, password, clan }
  const [newStudentName, setNewStudentName] = useState('')

  // ── Data loading ──────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('students').select('*').order('created_at', { ascending: false })

    if (filters.clan)   q = q.eq('clan', filters.clan)
    if (filters.level)  q = q.eq('level', filters.level)
    if (filters.status === 'active')   q = q.eq('is_active', true)
    if (filters.status === 'inactive') q = q.eq('is_active', false)

    const { data, error } = await q
    if (error) toast({ message: 'Failed to load students', type: 'error' })
    setStudents(data ?? [])
    setLoading(false)
  }, [filters, toast])

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
    const { error } = await supabase
      .from('students')
      .update({ is_active: next })
      .eq('id', student.id)

    if (error) {
      toast({ message: 'Failed to update student status', type: 'error' })
    } else {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_active: next } : s))
      toast({ message: `${student.full_name} ${next ? 'activated' : 'deactivated'}`, type: 'success' })
    }
  }

  function handleCreated(student, creds) {
    setShowCreate(false)
    setNewStudentName(student.full_name)
    setCredentials(creds)
    fetchStudents()
    toast({ message: `${student.full_name} created and assigned to ${creds.clan}`, type: 'success' })
  }

  return (
    <div className="p-8 space-y-6 max-w-[1200px]">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Students</h1>
          <p className="text-sm text-white/35 mt-1">
            {loading ? '…' : `${students.length} students`}
            {filtered.length !== students.length && ` · ${filtered.length} shown`}
          </p>
        </div>
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

      {/* ── Filters ────────────────────────────────────────── */}
      <FilterBar search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} />

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Student', 'Clan', 'Level', 'CP', 'Class Group', 'Age', 'Active'].map(h => (
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
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-white/25">
                  {search || filters.clan || filters.level
                    ? 'No students match your filters'
                    : 'No students yet — add one above'}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {visible.map((s, i) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onToggleActive={toggleActive}
                    delay={i * 0.025}
                  />
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>

        {/* ── Pagination ─────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30">
              {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                    ${i === page ? 'bg-brand-red text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.06]'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
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
          onClose={() => { setCredentials(null); setNewStudentName('') }}
        />
      )}
    </div>
  )
}
