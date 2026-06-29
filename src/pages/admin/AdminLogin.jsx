import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/logo.png'

// ── Animations ────────────────────────────────────────────────

const cardVariants = {
  hidden:  { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
}

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

// ── Animated mesh background ──────────────────────────────────

function MeshBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        top: '-20%', left: '-10%',
        background: 'rgba(204,0,0,0.07)',
        filter: 'blur(90px)',
        animation: 'adMeshA 18s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        bottom: '-15%', right: '-5%',
        background: 'rgba(100,80,255,0.05)',
        filter: 'blur(80px)',
        animation: 'adMeshB 22s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        top: '30%', right: '20%',
        background: 'rgba(204,0,0,0.04)',
        filter: 'blur(70px)',
        animation: 'adMeshC 26s ease-in-out infinite',
      }}/>
    </div>
  )
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
        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/[0.06] outline-none"
        style={{
          border: `1px solid ${focused ? 'rgba(204,0,0,0.65)' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(204,0,0,0.18)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
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
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
        </svg>
        <p className="text-red-300 text-xs">{message}</p>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────

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
      console.error('[AdminLogin] signIn threw:', networkErr)
      setError('Network error — could not reach the server. Check your internet connection.')
      setBusy(false)
      return
    }

    if (authError) {
      console.error('[AdminLogin] Auth error:', authError)
      const msg = authError.message ?? ''
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

    if (data?.user?.user_metadata?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('This portal is for authorised staff only.')
      setBusy(false)
      return
    }

    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#080810', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Animated gradient mesh */}
      <MeshBg />

      {/* Subtle radial vignette */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)',
      }}/>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-sm z-10"
      >
        {/* ── Logo + branding ───────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center mb-8 select-none"
        >
          <motion.div variants={fadeUp} className="mb-5">
            <img
              src={logo}
              alt="Fast Education"
              style={{
                height: 80, width: 'auto', objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                transition: 'filter 0.3s ease',
              }}
            />
          </motion.div>

          <motion.p variants={fadeUp} className="text-white/30 text-[10px] tracking-[0.25em] uppercase">
            Today is your tomorrow
          </motion.p>
        </motion.div>

        {/* ── Glass login card ──────────────────────────── */}
        <div
          className="rounded-2xl px-8 pt-7 pb-8"
          style={{
            background: 'rgba(0,0,0,0.60)',
            border: '1px solid rgba(204,0,0,0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(204,0,0,0.12), 0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-6">
            Staff portal
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
                  whileHover={busy ? {} : { scale: 1.015, boxShadow: '0 0 24px rgba(204,0,0,0.45)' }}
                  whileTap={busy   ? {} : { scale: 0.975 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="relative w-full py-3.5 rounded-xl text-sm font-semibold text-white tracking-wide overflow-hidden"
                  style={{
                    background: busy
                      ? '#7a0000'
                      : 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                    boxShadow: busy ? 'none' : '0 4px 16px rgba(204,0,0,0.3)',
                  }}
                >
                  {/* Shine sweep */}
                  {!busy && (
                    <motion.span
                      className="absolute inset-0 pointer-events-none"
                      animate={{ translateX: ['-100%', '250%'] }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                        transform: 'skewX(-15deg)',
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
        <p className="text-center text-[10px] tracking-widest uppercase mt-5"
          style={{ color: '#e53e3e', opacity: 0.7 }}>
          Authorised Personnel Only
        </p>
      </motion.div>
    </div>
  )
}
