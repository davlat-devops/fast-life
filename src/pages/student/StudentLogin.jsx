import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/logo.png'
import { CLANS, CLAN_NAMES } from '@/constants/clans'

const PANELS = CLAN_NAMES.map(id => CLANS[id])

const CLAN_OVERLAY = {
  VIPERON: 'rgba(74,124,63,0.65)',
  CRODON:  'rgba(13,13,13,0.78)',
  AVERON:  'rgba(10,22,40,0.75)',
  WOLFRIN: 'rgba(139,0,0,0.65)',
}

// ── Animations ────────────────────────────────────────────────

const panelVariants = {
  hidden:  { y: '105%' },
  visible: (i) => ({
    y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 55, damping: 18 },
  }),
}

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const errorVariants = {
  hidden:  { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.2 } },
  exit:    { opacity: 0, height: 0,      transition: { duration: 0.15 } },
}

// ── Clan panel ────────────────────────────────────────────────

function ClanPanel({ clan, index }) {
  const [hovered,   setHovered]   = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const overlayColor = CLAN_OVERLAY[clan.id] ?? 'rgba(0,0,0,0.65)'

  return (
    <motion.div
      custom={index}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex-1 overflow-hidden"
      style={{ background: clan.colorBg }}
    >
      {!imgFailed ? (
        <motion.img
          src={`/clans/${clan.id.toLowerCase()}.png`}
          alt=""
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            display: 'block',
          }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(64px, 10vw, 120px)', opacity: 0.55, pointerEvents: 'none',
        }}>
          {clan.emoji}
        </div>
      )}

      {/* Clan colour overlay — darker than before for readability */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: overlayColor }} />

      {/* Top-and-bottom vignette — stronger */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 60%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Accent inset border on hover */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 2px ${clan.colorAccent}90` }}
      />

      {/* Clan name strip */}
      <div className="absolute bottom-0 inset-x-0 z-10 pb-5 text-center space-y-1.5">
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0.35, opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.25 }}
          className="h-[2px] w-7 mx-auto rounded-full"
          style={{ background: clan.colorAccent }}
        />
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{ color: hovered ? clan.colorAccent : 'rgba(255,255,255,0.32)' }}>
          {clan.name}
        </p>
      </div>
    </motion.div>
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

  const inputStyle = (focused) => ({
    border: `1px solid ${focused ? 'rgba(204,0,0,0.65)' : 'rgba(255,255,255,0.1)'}`,
    boxShadow: focused ? '0 0 0 3px rgba(204,0,0,0.18)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  return (
    <div className="fixed inset-0 overflow-hidden bg-black" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Four clan panels ─────────────────────────── */}
      <div className="absolute inset-0 flex flex-col md:flex-row">
        {PANELS.map((clan, i) => (
          <ClanPanel key={clan.id} clan={clan} index={i} />
        ))}
      </div>

      {/* ── Center card ──────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[340px] flex flex-col items-center gap-5"
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 select-none">
            <img
              src={logo}
              alt="Fast Education"
              style={{
                height: 80, width: 'auto', objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                dropShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            />
            <p className="text-[11px] text-white/35 tracking-[0.25em] uppercase">
              Today is your tomorrow
            </p>
          </div>

          {/* Glass card */}
          <div
            className="w-full rounded-2xl px-7 py-6 space-y-4"
            style={{
              background: 'rgba(0,0,0,0.60)',
              border: '1px solid rgba(204,0,0,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(204,0,0,0.12), 0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <p className="text-[10px] font-semibold text-center uppercase tracking-[0.2em] text-white/30">
              Student sign in
            </p>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/[0.05] outline-none"
                  style={inputStyle(userFocused)}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/[0.05] outline-none"
                    style={inputStyle(passFocused)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
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
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-950/60 border border-red-800/30">
                      <svg className="shrink-0 text-red-400" width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Zm.75 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z"/>
                      </svg>
                      <p className="text-red-300 text-xs">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={busy}
                whileHover={busy ? {} : { scale: 1.02, boxShadow: '0 0 20px rgba(204,0,0,0.4)' }}
                whileTap={busy  ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative w-full py-3.5 rounded-xl text-sm font-bold text-white overflow-hidden"
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
                    transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                      transform: 'skewX(-15deg)',
                    }}
                  />
                )}
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </motion.button>
            </form>
          </div>

          <p className="text-white/20 text-[10px] tracking-widest uppercase">
            Fast Life · Fast Education
          </p>
        </motion.div>
      </div>
    </div>
  )
}
