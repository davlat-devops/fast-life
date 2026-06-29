import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/logo.png'
import SlideBackground from '@/components/ui/SlideBackground'

// ── Background slideshow with overlays ───────────────────────

function ClanSlideshow() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <SlideBackground overlay="rgba(0,0,0,0)" />

      {/* Heavy dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.70)' }} />

      {/* Red edge vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)',
          'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(180,0,0,0.18) 0%, transparent 70%)',
        ].join(', '),
      }} />

      {/* Bottom red glow */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 220,
        background: 'linear-gradient(to top, rgba(160,0,0,0.28) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Red light streaks ─────────────────────────────────────────

function LightStreaks() {
  const streaks = [
    { left: '15%',  top: '20%', angle: 35,  length: 220, delay: 0    },
    { left: '72%',  top: '10%', angle: -25, length: 180, delay: 0.8  },
    { left: '45%',  top: '65%', angle: 20,  length: 260, delay: 1.6  },
    { left: '85%',  top: '45%', angle: -40, length: 150, delay: 0.4  },
    { left: '8%',   top: '55%', angle: 50,  length: 200, delay: 2.1  },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {streaks.map((s, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.55, 0], x: [0, 40], y: [0, 20] }}
          transition={{ duration: 2.8, delay: s.delay, repeat: Infinity, repeatDelay: 3.5 + i * 0.7, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: s.left, top: s.top,
            width: s.length, height: 1.5,
            background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.7), transparent)',
            transform: `rotate(${s.angle}deg)`,
            transformOrigin: 'left center',
            borderRadius: 2,
          }}
        />
      ))}

      {/* Slow ambient red orbs */}
      <motion.div
        animate={{ opacity: [0.04, 0.10, 0.04], scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          left: '-10%', top: '30%',
          background: 'radial-gradient(circle, rgba(180,0,0,0.25) 0%, transparent 70%)',
        }}
      />
      <motion.div
        animate={{ opacity: [0.04, 0.09, 0.04], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          right: '-15%', top: '0%',
          background: 'radial-gradient(circle, rgba(140,0,0,0.2) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}

// ── Clan badges ───────────────────────────────────────────────

const CLAN_COLORS = {
  VIPERON: '#4A7C3F',
  CRODON:  '#A0A0A0',
  AVERON:  '#C9A227',
  WOLFRIN: '#C53030',
}

function ClanBadges() {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      {Object.entries(CLAN_COLORS).map(([name, color]) => (
        <motion.span
          key={name}
          animate={{ opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 2.5 + Math.random() * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            padding: '4px 10px', borderRadius: 20,
            color,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            textShadow: `0 0 8px ${color}80`,
          }}
        >
          {name}
        </motion.span>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function StudentLogin() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState('')
  const [busy,        setBusy]        = useState(false)
  const [userFocused, setUserFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!username.trim()) { setError('Enter your username.'); return }
    setError('')
    setBusy(true)

    const email = `${username.trim().toLowerCase()}@fastlife.internal`

    let data, authError
    try {
      ;({ data, error: authError } = await signIn(email, password))
    } catch {
      setError('Network error — check your connection.')
      setBusy(false)
      return
    }

    if (authError) {
      const msg = authError.message ?? ''
      if (msg === 'Invalid login credentials') {
        setError('Incorrect username or password.')
      } else if (msg === 'Load failed' || msg === 'Failed to fetch') {
        setError('Cannot reach server. Check your connection.')
      } else {
        setError(msg || 'Sign-in failed. Try again.')
      }
      setBusy(false)
      return
    }

    if (data?.user?.user_metadata?.role !== 'student') {
      await supabase.auth.signOut()
      setError('This is the student portal. Staff use /admin/login.')
      setBusy(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  const inputStyle = focused => ({
    width: '100%', padding: '12px 16px', borderRadius: 12,
    fontSize: 14, fontWeight: 500,
    color: '#fff',
    background: 'rgba(255,255,255,0.07)',
    border: focused ? '1px solid rgba(220,38,38,0.80)' : '1px solid rgba(255,255,255,0.12)',
    boxShadow: focused ? '0 0 0 3px rgba(204,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
    outline: 'none',
    caretColor: '#f87171',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: '#000',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Clan background ───────────────────────────── */}
      <ClanSlideshow />
      <LightStreaks />

      {/* ── Centered layout ───────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', gap: 20,
      }}>

        {/* ── Logo ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          {/* Pulsing red glow behind logo */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                width: 160, height: 60,
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(204,0,0,0.55) 0%, transparent 70%)',
                filter: 'blur(16px)',
                pointerEvents: 'none',
              }}
            />
            <img
              src={logo}
              alt="Fast Education"
              style={{
                height: 120, width: 'auto', objectFit: 'contain', position: 'relative',
                filter: 'brightness(0) invert(1) drop-shadow(0 2px 16px rgba(220,38,38,0.5))',
              }}
            />
          </div>

          <p style={{
            fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.35)',
          }}>
            Today is your tomorrow
          </p>
        </motion.div>

        {/* ── Login card ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: '100%', maxWidth: 360,
            borderRadius: 20, padding: '26px 28px 30px',
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(220,38,38,0.50)',
            boxShadow: [
              '0 0 40px rgba(220,38,38,0.30)',
              '0 0 80px rgba(220,38,38,0.12)',
              '0 24px 60px rgba(0,0,0,0.7)',
              'inset 0 1px 0 rgba(255,255,255,0.06)',
            ].join(', '),
          }}
        >
          {/* Card header */}
          <p style={{
            textAlign: 'center', marginBottom: 20,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#e53e3e',
            textShadow: '0 0 12px rgba(229,62,62,0.5)',
          }}>
            Student Sign In
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>

            {/* Username */}
            <div>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.4)',
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                placeholder="e.g. dilnoza.yusupova"
                autoComplete="username"
                autoCapitalize="none"
                required
                onFocus={() => setUserFocused(true)}
                onBlur={() => setUserFocused(false)}
                style={{ ...inputStyle(userFocused), boxSizing: 'border-box' }}
                className="placeholder:text-white/20"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.4)',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  style={{ ...inputStyle(passFocused), paddingRight: 44, boxSizing: 'border-box' }}
                  className="placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px', borderRadius: 10,
                    background: 'rgba(127,0,0,0.4)',
                    border: '1px solid rgba(220,38,38,0.35)',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="rgba(252,165,165,1)">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
                    </svg>
                    <p style={{ fontSize: 12, color: '#fca5a5' }}>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={busy ? {} : { scale: 1.02, y: -2, boxShadow: '0 0 32px rgba(204,0,0,0.65)' }}
              whileTap={busy ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                position: 'relative', width: '100%', marginTop: 4,
                padding: '13px 0', borderRadius: 12,
                fontSize: 14, fontWeight: 800, color: '#fff',
                letterSpacing: '0.04em',
                background: busy
                  ? 'rgba(100,0,0,0.7)'
                  : 'linear-gradient(135deg, #e53e3e 0%, #c53030 50%, #991b1b 100%)',
                border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                boxShadow: busy ? 'none' : '0 4px 20px rgba(204,0,0,0.45), 0 0 0 1px rgba(220,38,38,0.3)',
                overflow: 'hidden',
              }}
            >
              {/* Shine sweep */}
              {!busy && (
                <motion.span
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                    transform: 'skewX(-15deg)',
                  }}
                  animate={{ translateX: ['-100%', '250%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
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
        </motion.div>

        {/* ── Footer ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
          }}>
            Fast Life · Fast Education
          </p>
          <ClanBadges />
        </motion.div>
      </div>
    </div>
  )
}
