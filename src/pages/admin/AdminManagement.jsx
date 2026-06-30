import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Trash2, UserPlus, Loader2, Mail, Lock, AlertTriangle } from 'lucide-react'
import { adminEdge } from '@/lib/adminEdge'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/contexts/ToastContext'

// ── Shared input style ────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ad-text-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          background:   'var(--ad-input-bg)',
          border:       '1px solid var(--ad-input-border)',
          borderRadius: 10,
          padding:      '10px 13px',
          fontSize:     14,
          color:        'var(--ad-text)',
          outline:      'none',
          width:        '100%',
          boxSizing:    'border-box',
          transition:   'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--ad-red)')}
        onBlur={e  => (e.target.style.borderColor = 'var(--ad-input-border)')}
      />
    </div>
  )
}

// ── Section card wrapper ──────────────────────────────────────

function Card({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background:    'var(--ad-surface)',
        border:        '1px solid var(--ad-border)',
        borderRadius:  16,
        overflow:      'hidden',
      }}
    >
      {children}
    </motion.div>
  )
}

function CardHeader({ icon: Icon, title, count }) {
  return (
    <div style={{
      padding:       '16px 20px',
      borderBottom:  '1px solid var(--ad-border)',
      display:       'flex',
      alignItems:    'center',
      gap:           10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--ad-red-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ad-red)', flexShrink: 0,
      }}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ad-text)', margin: 0, flex: 1 }}>
        {title}
      </h2>
      {count != null && (
        <span style={{
          background: 'var(--ad-hover)',
          border: '1px solid var(--ad-border)',
          borderRadius: 999, padding: '2px 10px',
          fontSize: 12, fontWeight: 700, color: 'var(--ad-text-2)',
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ── Admin row ─────────────────────────────────────────────────

function AdminRow({ admin, isSelf, onDelete, deleting }) {
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (isSelf) return
    if (!confirming) { setConfirming(true); return }
    onDelete(admin.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, transition: { duration: 0.18 } }}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '13px 20px',
        borderBottom:  '1px solid var(--ad-border)',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: 'var(--ad-red-dim)',
        border: '1.5px solid var(--ad-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: 'var(--ad-red)',
      }}>
        {admin.email[0].toUpperCase()}
      </div>

      {/* Email + created date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ad-text)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {admin.email}
          {isSelf && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              color: 'var(--ad-red)', background: 'var(--ad-red-dim)',
              border: '1px solid var(--ad-red)', borderRadius: 999,
              padding: '1px 7px', verticalAlign: 'middle',
            }}>
              YOU
            </span>
          )}
        </p>
        <p style={{ fontSize: 11, color: 'var(--ad-text-3)', margin: '2px 0 0' }}>
          Admin · joined {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Delete button */}
      {!isSelf && (
        <button
          onClick={handleClick}
          disabled={deleting}
          title={confirming ? 'Click again to confirm deletion' : 'Delete admin'}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            6,
            padding:        '7px 14px',
            borderRadius:   8,
            border:         confirming ? '1px solid var(--ad-red)' : '1px solid var(--ad-border)',
            background:     confirming ? 'var(--ad-red-dim)' : 'var(--ad-hover)',
            color:          confirming ? 'var(--ad-red)' : 'var(--ad-text-2)',
            fontSize:       12,
            fontWeight:     600,
            cursor:         deleting ? 'not-allowed' : 'pointer',
            opacity:        deleting ? 0.5 : 1,
            transition:     'all 0.15s',
            whiteSpace:     'nowrap',
            flexShrink:     0,
          }}
        >
          {deleting
            ? <Loader2 size={13} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Trash2 size={13} strokeWidth={2} />
          }
          {confirming ? 'Confirm delete' : 'Delete'}
        </button>
      )}
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function AdminManagement() {
  const { user }  = useAdminAuth()
  const { toast } = useToast()

  const [admins,   setAdmins]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null) // userId being deleted

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [adding,   setAdding]   = useState(false)
  const [addError, setAddError] = useState('')

  // ── Load admins ───────────────────────────────────────────

  async function loadAdmins() {
    setLoading(true)
    try {
      const data = await adminEdge.listAdminUsers()
      const adminUsers = (data?.users ?? [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      setAdmins(adminUsers)
    } catch (err) {
      toast({ message: 'Failed to load admins: ' + err.message, type: 'error' })
    }
    setLoading(false)
  }

  useEffect(() => { loadAdmins() }, [])

  // ── Delete admin ──────────────────────────────────────────

  async function handleDelete(userId) {
    setDeleting(userId)
    try {
      await adminEdge.deleteAdminUser(userId)
      setAdmins(prev => prev.filter(a => a.id !== userId))
      toast({ message: 'Admin removed.', type: 'success' })
    } catch (err) {
      toast({ message: 'Delete failed: ' + err.message, type: 'error' })
    }
    setDeleting(null)
  }

  // ── Add admin ─────────────────────────────────────────────

  async function handleAdd(e) {
    e.preventDefault()
    setAddError('')
    setAdding(true)

    try {
      const data = await adminEdge.createAdminUser(email.trim().toLowerCase(), password)
      setAdmins(prev => [...prev, data.user])
      setEmail('')
      setPassword('')
      toast({ message: `Admin ${data.user.email} added.`, type: 'success' })
    } catch (err) {
      setAddError(err.message || 'Failed to create admin.')
    }
    setAdding(false)
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 720 }}>

      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ad-text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Admin Management
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ad-text-3)', margin: 0 }}>
          Manage who has access to this admin panel.
        </p>
      </motion.div>

      {/* ── Current Admins ───────────────────────────── */}
      <Card delay={0.05}>
        <CardHeader icon={Shield} title="Current Admins" count={loading ? null : admins.length} />

        {loading ? (
          <div style={{ padding: '32px 20px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ad-text-3)' }}>
            <Loader2 size={16} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Loading admins…</span>
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ad-text-3)', fontSize: 13 }}>
            No admins found.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {admins.map(admin => (
              <AdminRow
                key={admin.id}
                admin={admin}
                isSelf={admin.id === user?.id}
                onDelete={handleDelete}
                deleting={deleting === admin.id}
              />
            ))}
          </AnimatePresence>
        )}
      </Card>

      {/* ── Add New Admin ────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <Card delay={0.12}>
          <CardHeader icon={UserPlus} title="Add New Admin" />

          <form onSubmit={handleAdd} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ad-text-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} strokeWidth={2} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--ad-text-3)', pointerEvents: 'none',
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setAddError('') }}
                    placeholder="admin@example.com"
                    autoComplete="off"
                    required
                    style={{
                      background: 'var(--ad-input-bg)', border: '1px solid var(--ad-input-border)',
                      borderRadius: 10, padding: '10px 13px 10px 34px',
                      fontSize: 14, color: 'var(--ad-text)', outline: 'none',
                      width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--ad-red)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--ad-input-border)')}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ad-text-2)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} strokeWidth={2} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--ad-text-3)', pointerEvents: 'none',
                  }} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setAddError('') }}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    style={{
                      background: 'var(--ad-input-bg)', border: '1px solid var(--ad-input-border)',
                      borderRadius: 10, padding: '10px 13px 10px 34px',
                      fontSize: 14, color: 'var(--ad-text)', outline: 'none',
                      width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--ad-red)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--ad-input-border)')}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {addError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(185,28,28,0.12)', border: '1px solid rgba(185,28,28,0.3)',
                    borderRadius: 8, padding: '9px 12px', overflow: 'hidden',
                  }}
                >
                  <AlertTriangle size={14} strokeWidth={2} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{addError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={adding || !email || !password}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            8,
                  padding:        '10px 22px',
                  borderRadius:   10,
                  border:         'none',
                  background:     adding || !email || !password ? 'var(--ad-hover)' : 'var(--ad-red)',
                  color:          adding || !email || !password ? 'var(--ad-text-3)' : '#fff',
                  fontSize:       14,
                  fontWeight:     700,
                  cursor:         adding || !email || !password ? 'not-allowed' : 'pointer',
                  transition:     'background 0.15s, color 0.15s',
                  letterSpacing:  '0.01em',
                }}
              >
                {adding
                  ? <><Loader2 size={15} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} /> Adding…</>
                  : <><UserPlus size={15} strokeWidth={2} /> Add Admin</>
                }
              </button>
            </div>
          </form>
        </Card>
      </div>

    </div>
  )
}
