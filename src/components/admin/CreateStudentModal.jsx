import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { adminSupabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  )
}

const inputCls = `w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder:text-white/20
  bg-white/[0.04] border border-white/[0.08] outline-none
  focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/20 transition-all`

export default function CreateStudentModal({ onClose, onCreated }) {
  const { toast } = useToast()

  const [form, setForm] = useState({
    full_name: '', age: '', level: 'B1', phone: '', class_group: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    const age = Number(form.age)
    if (!form.age || isNaN(age) || age < 5 || age > 80) e.age = 'Enter a valid age (5–80)'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.class_group.trim()) e.class_group = 'Class group is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setBusy(true)

    try {
      // 1. Generate unique username + temp password via DB function
      const { data: creds, error: credsErr } = await adminSupabase
        .rpc('generate_student_credentials', { p_full_name: form.full_name.trim() })
      if (credsErr) throw new Error(`Credentials: ${credsErr.message}`)

      const { username, password } = creds

      // 2. Random clan assignment
      const CLANS = ['VIPERON', 'CRODON', 'AVERON', 'WOLFRIN']
      const clan = CLANS[Math.floor(Math.random() * CLANS.length)]

      // 3. Create auth user
      const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
        email: `${username}@fastlife.internal`,
        password,
        email_confirm: true,
        user_metadata: { role: 'student', username },
      })
      if (authErr) throw new Error(`Auth: ${authErr.message}`)

      // 4. Insert students row
      const { data: student, error: studentErr } = await adminSupabase
        .from('students')
        .insert({
          auth_user_id:   authData.user.id,
          full_name:      form.full_name.trim(),
          age:            Number(form.age),
          level:          form.level,
          phone:          form.phone.trim(),
          class_group:    form.class_group.trim(),
          clan,
          username,
          password_plain: password,
        })
        .select()
        .single()

      if (studentErr) {
        // Rollback: remove orphaned auth user
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        throw new Error(`DB: ${studentErr.message}`)
      }

      onCreated(student, { username, password, clan })
    } catch (err) {
      toast({ message: err.message ?? 'Failed to create student', type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white">New Student</h2>
              <p className="text-xs text-white/35 mt-0.5">Clan assigned randomly on creation</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <Field label="Full Name *" id="full_name" error={errors.full_name}>
              <input
                id="full_name" className={inputCls} placeholder="e.g. Dilnoza Yusupova"
                value={form.full_name} onChange={e => set('full_name', e.target.value)}
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Age *" id="age" error={errors.age}>
                <input
                  id="age" type="number" min="5" max="80" className={inputCls}
                  placeholder="18"
                  value={form.age} onChange={e => set('age', e.target.value)}
                />
              </Field>

              <Field label="Level *" id="level">
                <select
                  id="level" className={inputCls + ' cursor-pointer'}
                  value={form.level} onChange={e => set('level', e.target.value)}
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Phone *" id="phone" error={errors.phone}>
              <input
                id="phone" type="tel" className={inputCls} placeholder="+998 90 123 45 67"
                value={form.phone} onChange={e => set('phone', e.target.value)}
              />
            </Field>

            <Field label="Class Group *" id="class_group" error={errors.class_group}>
              <input
                id="class_group" className={inputCls} placeholder="e.g. IELTS-Mon-A"
                value={form.class_group} onChange={e => set('class_group', e.target.value)}
              />
            </Field>

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 border border-white/[0.08] hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <motion.button
                type="submit" disabled={busy}
                whileHover={busy ? {} : { scale: 1.02 }}
                whileTap={busy  ? {} : { scale: 0.97 }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
                style={{ background: busy ? '#7a0000' : '#CC0000' }}
              >
                {busy && (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                )}
                {busy ? 'Creating…' : 'Create Student'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
