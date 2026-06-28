import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'

// ── Animation variants ───────────────────────────────────────

const cardVariants = {
  hidden:  { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
}

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

// ── Input field ───────────────────────────────────────────────

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder:text-white/20 bg-white/[0.04] outline-none transition-all duration-200"
        style={{
          border: `1px solid ${focused ? 'rgba(204,0,0,0.6)' : 'rgba(255,255,255,0.09)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(204,0,0,0.12)' : 'none',
        }}
      />
    </motion.div>
  )
}

// ── Error banner ──────────────────────────────────────────────

function ErrorBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-950/60 border border-red-800/40">
        <svg className="shrink-0 text-red-400" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
        </svg>
        <p className="text-red-300 text-xs">{message}</p>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────

export default function AdminLogin() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)

    let data, authError
    try {
      ;({ data, error: authError } = await signIn(email.trim(), password))
    } catch (networkErr) {
      // signIn itself threw — treat as a network error
      console.error('[AdminLogin] signIn threw:', networkErr)
      setError('Network error — could not reach the server. Check your internet connection.')
      setBusy(false)
      return
    }

    if (authError) {
      console.error('[AdminLogin] Auth error:', authError)

      const msg = authError.message ?? ''
      // Network / DNS failures arrive as "Load failed" (Safari) or "Failed to fetch" (Chrome/Firefox)
      if (msg === 'Load failed' || msg === 'Failed to fetch' || msg.toLowerCase().includes('network')) {
        setError(
          'Cannot reach Supabase. Check your internet connection and confirm ' +
          'VITE_SUPABASE_URL in .env.local points to your real project.'
        )
      } else if (msg === 'Invalid login credentials') {
        setError('Incorrect email or password.')
      } else {
        setError(msg || 'Sign-in failed. Please try again.')
      }

      setBusy(false)
      return
    }

    // Guard: only admin users may use this portal
    if (data?.user?.user_metadata?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('This portal is for authorised staff only.')
      setBusy(false)
      return
    }

    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">

      {/* Subtle vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Decorative grid lines */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-sm z-10"
      >
        {/* ── Branding header ───────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center mb-8 select-none"
        >
          <motion.div variants={fadeUp} className="mb-5">
            <Logo size={72} color="white" />
          </motion.div>

          <motion.div variants={fadeUp} className="text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span
                className="text-3xl font-black tracking-[0.18em] leading-none"
                style={{ color: '#CC0000' }}
              >
                FAST
              </span>
              <span className="text-3xl font-light tracking-[0.18em] leading-none text-white">
                EDUCATION
              </span>
            </div>
            <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mt-2.5">
              Today is your tomorrow
            </p>
          </motion.div>
        </motion.div>

        {/* ── Login card ────────────────────────────────────── */}
        <div
          className="rounded-2xl px-8 pt-7 pb-8"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Portal label */}
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-6">
            Staff portal · Fast&nbsp;Life
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              <Field
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@fasteducation.uz"
                autoComplete="email"
              />

              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {/* Error */}
              <AnimatePresence mode="wait">
                {error && <ErrorBanner key="err" message={error} />}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={fadeUp} className="mt-1">
                <motion.button
                  type="submit"
                  disabled={busy}
                  whileHover={busy ? {} : { scale: 1.015 }}
                  whileTap={busy   ? {} : { scale: 0.975 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="relative w-full py-3.5 rounded-xl text-sm font-semibold text-white tracking-wide overflow-hidden"
                  style={{ background: busy ? '#7a0000' : '#CC0000' }}
                >
                  {/* Shimmer on idle */}
                  {!busy && (
                    <motion.span
                      className="absolute inset-0 -translate-x-full"
                      animate={{ translateX: ['−100%', '200%'] }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                      }}
                    />
                  )}

                  {busy ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/15 text-[10px] tracking-widest uppercase mt-5">
          Authorised personnel only
        </p>
      </motion.div>
    </div>
  )
}
