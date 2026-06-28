import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/ui/Logo'
import { CLANS, CLAN_NAMES } from '@/constants/clans'

// ── Clan panel data in display order ──────────────────────────
const PANELS = CLAN_NAMES.map(id => CLANS[id])

// ── Animations ────────────────────────────────────────────────

const panelVariants = {
  hidden:  { y: '105%' },
  visible: (i) => ({
    y: 0,
    transition: {
      delay: i * 0.07,
      type: 'spring',
      stiffness: 55,
      damping: 18,
    },
  }),
}

const overlayVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const errorVariants = {
  hidden:  { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.2 } },
  exit:    { opacity: 0, height: 0,      transition: { duration: 0.15 } },
}

// ── Sub-components ────────────────────────────────────────────

function ClanPanel({ clan, index }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      custom={index}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex-1 flex flex-col items-center justify-end overflow-hidden"
      style={{ background: clan.colorBg }}
    >
      {/* Top gradient fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)`,
        }}
      />

      {/* Accent edge highlight on hover */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1.5px ${clan.colorAccent}60`,
        }}
      />

      {/* Mascot — large watermark */}
      <motion.div
        animate={{ scale: hovered ? 1.08 : 1, opacity: hovered ? 0.18 : 0.1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ fontSize: 'clamp(80px, 14vw, 160px)', lineHeight: 1 }}
        aria-hidden
      >
        {clan.emoji}
      </motion.div>

      {/* Clan name + accent strip at bottom */}
      <div className="relative z-10 w-full pb-6 text-center space-y-1.5">
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0.4, opacity: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
          className="h-[2px] w-8 mx-auto rounded-full"
          style={{ background: clan.colorAccent }}
        />
        <p
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{ color: hovered ? clan.colorAccent : 'rgba(255,255,255,0.3)' }}
        >
          {clan.name}
        </p>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────

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

  const inputBorder = (focused) =>
    focused ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">

      {/* ── Four clan panels ──────────────────────────── */}
      <div className="absolute inset-0 flex">
        {PANELS.map((clan, i) => (
          <ClanPanel key={clan.id} clan={clan} index={i} />
        ))}
      </div>

      {/* ── Center overlay ────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[340px] flex flex-col items-center gap-6"
        >
          {/* Branding */}
          <div className="flex flex-col items-center gap-3 select-none">
            <Logo size={64} color="white" />
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-2">
                <span
                  className="text-2xl font-black tracking-[0.2em]"
                  style={{ color: '#CC0000' }}
                >
                  FAST
                </span>
                <span className="text-2xl font-light tracking-[0.2em] text-white">
                  EDUCATION
                </span>
              </div>
              <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mt-1.5">
                Today is your tomorrow
              </p>
            </div>
          </div>

          {/* Form card */}
          <div
            className="w-full rounded-2xl px-7 py-6 space-y-4"
            style={{
              background:    'rgba(6, 6, 6, 0.82)',
              border:        '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <p className="text-[10px] font-semibold text-center uppercase tracking-[0.2em] text-white/25">
              Student sign in
            </p>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
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
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/[0.05] outline-none transition-all"
                  style={{ border: `1px solid ${inputBorder(userFocused)}` }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
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
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder:text-white/20 bg-white/[0.05] outline-none transition-all"
                    style={{ border: `1px solid ${inputBorder(passFocused)}` }}
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
                whileHover={busy ? {} : { scale: 1.02 }}
                whileTap={busy  ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative w-full py-3.5 rounded-xl text-sm font-bold text-white overflow-hidden"
                style={{ background: busy ? '#7a0000' : '#CC0000' }}
              >
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

          <p className="text-white/15 text-[10px] tracking-widest uppercase">
            Fast Life · Fast Education
          </p>
        </motion.div>
      </div>
    </div>
  )
}
