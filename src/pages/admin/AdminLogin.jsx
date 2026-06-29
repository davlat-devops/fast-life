import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/logo.png'

// ── Clan slideshow images ─────────────────────────────────────

const SLIDES = [
  { src: '/clans/wolfrin.png',  accent: 'rgba(139,0,0,0.55)'    },
  { src: '/clans/averon.png',   accent: 'rgba(10,22,40,0.55)'   },
  { src: '/clans/viperon.png',  accent: 'rgba(74,124,63,0.45)'  },
  { src: '/clans/crodon.png',   accent: 'rgba(13,13,13,0.65)'   },
]

function ClanSlideshow() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent(i => (i + 1) % SLIDES.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {SLIDES.map((slide, i) => (
        <AnimatePresence key={i}>
          {current === i && (
            <motion.div
              key={`slide-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {/* Clan image */}
              <img
                src={slide.src}
                alt=""
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                }}
              />
              {/* Per-clan colour tint */}
              <div style={{
                position: 'absolute', inset: 0,
                background: slide.accent,
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      {/* Universal dark overlay for card readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* Slide dots */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 2,
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: current === i ? 20 : 6,
              height: 6, borderRadius: 3,
              background: current === i ? '#fff' : 'rgba(255,255,255,0.35)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Input field ───────────────────────────────────────────────

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1.5"
    >
      <label htmlFor={id} style={{
        fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.55)',
      }}>
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
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          fontSize: 14, color: '#fff',
          background: 'rgba(255,255,255,0.12)',
          border: focused
            ? '1px solid rgba(220,38,38,0.85)'
            : '1px solid rgba(255,255,255,0.2)',
          boxShadow: focused
            ? '0 0 0 3px rgba(204,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
            : 'inset 0 1px 0 rgba(255,255,255,0.05)',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          caretColor: '#ff4444',
        }}
        className="placeholder:text-white/30"
      />
    </motion.div>
  )
}

// ── Error banner ──────────────────────────────────────────────

function ErrorBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderRadius: 10,
        background: 'rgba(127,0,0,0.45)',
        border: '1px solid rgba(220,38,38,0.4)',
        backdropFilter: 'blur(8px)',
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="rgba(252,165,165,1)">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
        </svg>
        <p style={{ fontSize: 13, color: '#fca5a5' }}>{message}</p>
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
        setError('Cannot reach Supabase. Check your internet connection.')
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
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Clan background slideshow ──────────────────── */}
      <ClanSlideshow />

      {/* ── Centered card ─────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 10,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* ── Logo ──────────────────────────────────── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12, marginBottom: 28,
          }}>
            <div style={{
              position: 'relative',
              filter: 'drop-shadow(0 0 24px rgba(220,38,38,0.45)) drop-shadow(0 4px 16px rgba(0,0,0,0.6))',
            }}>
              <img
                src={logo}
                alt="Fast Education"
                style={{
                  height: 100, width: 'auto', objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </div>
            <p style={{
              fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.4)',
            }}>
              Today is your tomorrow
            </p>
          </div>

          {/* ── Glass card ────────────────────────────── */}
          <div style={{
            borderRadius: 20, padding: '28px 32px 32px',
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: [
              '0 0 0 1px rgba(204,0,0,0.25)',
              '0 0 40px rgba(204,0,0,0.18)',
              '0 8px 48px rgba(0,0,0,0.5)',
              'inset 0 1px 0 rgba(255,255,255,0.12)',
            ].join(', '),
          }}>
            <p style={{
              textAlign: 'center', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.4)', marginBottom: 22,
            }}>
              Staff portal
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={busy ? {} : { scale: 1.015, boxShadow: '0 0 28px rgba(204,0,0,0.55)' }}
                whileTap={busy   ? {} : { scale: 0.975 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  position: 'relative', width: '100%',
                  padding: '13px 0', borderRadius: 12, marginTop: 4,
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  background: busy
                    ? 'rgba(100,0,0,0.7)'
                    : 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                  border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                  boxShadow: busy ? 'none' : '0 4px 20px rgba(204,0,0,0.4)',
                  overflow: 'hidden',
                }}
              >
                {/* Shine sweep */}
                {!busy && (
                  <motion.span
                    style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                      transform: 'skewX(-15deg)',
                    }}
                    animate={{ translateX: ['-100%', '250%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                  />
                )}
                {busy ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </motion.button>
            </form>
          </div>

          {/* ── Footer ────────────────────────────────── */}
          <p style={{
            textAlign: 'center', marginTop: 20,
            fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.22em',
            color: '#ef4444',
            textShadow: '0 0 12px rgba(239,68,68,0.6)',
          }}>
            Authorised Personnel Only
          </p>
        </motion.div>
      </div>
    </div>
  )
}
