import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { CLANS } from '@/constants/clans'
import { BADGES, LEVEL_THRESHOLDS } from '@/constants/badges'

// ── Level helpers ─────────────────────────────────────────────

const LEVELS = [...LEVEL_THRESHOLDS].sort((a, b) => a.min - b.min)

function getLevel(cp) {
  return [...LEVELS].reverse().find(l => cp >= l.min) ?? LEVELS[0]
}

function getLevelProgress(cp) {
  const current = getLevel(cp)
  const nextIdx = LEVELS.findIndex(l => l.key === current.key) + 1
  const next    = LEVELS[nextIdx] ?? null
  if (!next) return { current, next: null, pct: 100, toNext: 0 }
  const pct = Math.min(((cp - current.min) / (next.min - current.min)) * 100, 100)
  return { current, next, pct, toNext: next.min - cp }
}

// ── Formatting ────────────────────────────────────────────────

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const REASON_META = {
  attendance:             { label: 'Attendance',     emoji: '📋' },
  volunteer:              { label: 'Volunteer',       emoji: '❤️' },
  competition_1st:        { label: '1st Place',       emoji: '🥇' },
  competition_2nd:        { label: '2nd Place',       emoji: '🥈' },
  competition_3rd:        { label: '3rd Place',       emoji: '🥉' },
  referral:               { label: 'Referral',        emoji: '🤝' },
  peer_spotlight:         { label: 'Peer Spotlight',  emoji: '⭐' },
  end_of_month_1st:       { label: '#1 of Month',     emoji: '👑' },
  end_of_month_top5:      { label: 'Top 5 Overall',   emoji: '💎' },
  end_of_month_top5_clan: { label: 'Top 5 in Clan',   emoji: '⚔️' },
  clan_winner_headstart:  { label: 'Clan Head Start', emoji: '🏆' },
  perfect_month:          { label: 'Perfect Month',   emoji: '💯' },
}
const getReason = r => REASON_META[r] ?? { label: r, emoji: '✨' }

// ── Skeleton ──────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

// ── Password field with eye toggle ────────────────────────────

function PwField({ id, label, value, onChange, error, accent }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--fl-text-3)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm outline-none transition-colors"
          style={{
            background:  'var(--fl-input-bg)',
            border:      `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'var(--fl-border)'}`,
            color:       'var(--fl-text)',
          }}
          onFocus={e  => { e.target.style.borderColor = error ? 'rgba(239,68,68,0.7)' : `${accent}66` }}
          onBlur={e   => { e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'var(--fl-border)' }}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--fl-text-3)' }}
          tabIndex={-1}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {show ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </>
            )}
          </svg>
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

// ── Clan image with fallback ───────────────────────────────────

function ClanImg({ clanId, style }) {
  const [err, setErr] = useState(false)
  if (err || !clanId) {
    return (
      <span
        aria-hidden
        style={{ fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
      >
        {CLANS[clanId]?.emoji ?? '⚔️'}
      </span>
    )
  }
  return (
    <img
      src={`/clans/${clanId.toLowerCase()}.png`}
      alt=""
      style={{ objectFit: 'cover', ...style }}
      onError={() => setErr(true)}
    />
  )
}

// ── Page ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { studentRecord, signOut } = useAuth()
  const { toast } = useToast()
  const clanInfo = CLANS[studentRecord?.clan]
  const accent   = clanInfo?.colorAccent ?? '#CC0000'
  const cp       = studentRecord?.cp ?? 0

  const [earnedBadges, setEarnedBadges] = useState([])
  const [history,      setHistory]      = useState([])
  const [loading,      setLoading]      = useState(true)

  // ── Change password form ─────────────────────────────────────
  const [pwForm,   setPwForm]   = useState({ current: '', newPw: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwBusy,   setPwBusy]   = useState(false)

  function setPwField(key, val) {
    setPwForm(f => ({ ...f, [key]: val }))
    setPwErrors(e => ({ ...e, [key]: '' }))
  }

  function validatePw() {
    const e = {}
    if (!pwForm.current)                  e.current = 'Enter your current password'
    if (pwForm.newPw.length < 6)          e.newPw   = 'Minimum 6 characters'
    if (pwForm.newPw !== pwForm.confirm)  e.confirm = 'Passwords do not match'
    return e
  }

  async function handleChangePassword(evt) {
    evt.preventDefault()
    const errs = validatePw()
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    setPwBusy(true)
    try {
      const email = `${studentRecord.username}@fastlife.internal`
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: pwForm.current,
      })
      if (signInErr) {
        setPwErrors({ current: 'Current password is incorrect' })
        return
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (updateErr) throw updateErr

      await supabase
        .from('students')
        .update({ password_plain: pwForm.newPw })
        .eq('id', studentRecord.id)

      toast({ message: 'Password updated successfully', type: 'success' })
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err) {
      toast({ message: err.message ?? 'Failed to update password', type: 'error' })
    } finally {
      setPwBusy(false)
    }
  }

  useEffect(() => {
    if (!studentRecord) return
    Promise.all([
      supabase.from('badges').select('badge_key, earned_at').eq('student_id', studentRecord.id),
      supabase.from('cp_awards').select('*').eq('student_id', studentRecord.id)
        .order('created_at', { ascending: false }),
    ]).then(([badgesRes, historyRes]) => {
      setEarnedBadges(badgesRes.data ?? [])
      setHistory(historyRes.data ?? [])
      setLoading(false)
    })
  }, [studentRecord?.id])

  const earnedKeys = useMemo(
    () => new Set(earnedBadges.map(b => b.badge_key)),
    [earnedBadges]
  )

  const { current: level, next: nextLevel, pct, toNext } = getLevelProgress(cp)

  const allBadges = Object.values(BADGES)
  const initials  = studentRecord?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const joinDate  = studentRecord?.created_at
    ? new Date(studentRecord.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen" style={{ background: 'var(--fl-bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: clanInfo
            ? `linear-gradient(145deg, ${clanInfo.colorBg} 0%, ${clanInfo.colorBg}88 55%, transparent 100%)`
            : '#161616',
          minHeight: 180,
        }}
      >
        {/* Background clan image */}
        {clanInfo && (
          <div
            className="absolute right-0 top-0 bottom-0 pointer-events-none select-none overflow-hidden"
            style={{ width: '50%' }}
          >
            <ClanImg
              clanId={studentRecord?.clan}
              style={{
                position:   'absolute',
                right:      -10,
                top:        0,
                width:      '120%',
                height:     '100%',
                opacity:    0.22,
                objectFit:  'cover',
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${clanInfo.colorBg} 0%, transparent 60%)` }}
            />
          </div>
        )}

        <div className="relative z-10 px-5 pt-5 pb-6">
          <div className="flex items-center gap-4">
            {/* 80px circular avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="shrink-0 flex items-center justify-center text-2xl font-black text-white"
              style={{
                width:        80,
                height:       80,
                borderRadius: '50%',
                background:   accent,
                boxShadow:    `0 0 0 3px ${accent}40, 0 0 0 6px ${accent}18`,
              }}
            >
              {initials}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl font-black text-white leading-tight">
                {studentRecord?.full_name}
              </h1>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                @{studentRecord?.username}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {clanInfo && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${accent}25`,
                      color:      accent,
                      border:     `1px solid ${accent}40`,
                    }}
                  >
                    {clanInfo.emoji} {clanInfo.name}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {studentRecord?.level}
                </span>
                {studentRecord?.class_group && (
                  <>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {studentRecord.class_group}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Milestone level bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{ background: accent + '30', color: accent }}
              >
                {level.label}
              </span>
              {nextLevel ? (
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {toNext} CP → {nextLevel.label}
                </span>
              ) : (
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>Max level</span>
              )}
            </div>

            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.5, duration: 1, type: 'spring', stiffness: 70, damping: 20 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
              />
            </div>

            <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
              {cp.toLocaleString()} CP · joined {joinDate}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-4">

        {/* ── Badge gallery ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl p-5"
          style={{
            background: 'var(--fl-card)',
            border:     '1px solid var(--fl-border)',
            boxShadow:  'var(--fl-shadow)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--fl-text)' }}>Badges</h2>
            <span className="text-[11px]" style={{ color: 'var(--fl-text-3)' }}>
              {loading ? '…' : `${earnedKeys.size} / ${allBadges.length}`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {allBadges.map((badge, i) => {
                const earned = earnedKeys.has(badge.key)
                return (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.025 }}
                    title={`${badge.label}: ${badge.description}`}
                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-default overflow-hidden"
                    style={earned
                      ? {
                          background: `${accent}18`,
                          border:     `1px solid ${accent}45`,
                        }
                      : {
                          background: 'var(--fl-card-alt)',
                          border:     '1px solid var(--fl-border)',
                        }}
                  >
                    <span
                      className="text-xl leading-none"
                      style={{
                        filter:  earned ? 'none' : 'grayscale(1)',
                        opacity: earned ? 1 : 0.22,
                      }}
                    >
                      {badge.icon}
                    </span>
                    <span
                      className="text-[8px] font-bold text-center leading-none px-0.5"
                      style={{ color: earned ? accent : 'var(--fl-text-3)' }}
                    >
                      {badge.label.split(' ')[0]}
                    </span>

                    {/* Lock overlay for unearned */}
                    {!earned && (
                      <div
                        className="absolute inset-0 flex items-end justify-end p-1"
                        style={{ pointerEvents: 'none' }}
                      >
                        <span style={{ fontSize: 9, opacity: 0.35 }}>🔒</span>
                      </div>
                    )}

                    {/* Earned dot */}
                    {earned && (
                      <div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: accent }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── CP History ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{
            background: 'var(--fl-card)',
            border:     '1px solid var(--fl-border)',
            boxShadow:  'var(--fl-shadow)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--fl-text)' }}>CP History</h2>
            {history.length > 0 && (
              <span className="text-[11px]" style={{ color: 'var(--fl-text-3)' }}>{history.length} awards</span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="w-3/4 h-3" />
                    <Skeleton className="w-1/2 h-2.5" />
                  </div>
                  <Skeleton className="w-10 h-4 shrink-0" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl">🎯</span>
              <p className="text-sm mt-2" style={{ color: 'var(--fl-text-3)' }}>
                No CP earned yet — attend events to start!
              </p>
            </div>
          ) : (
            history.map((award, i) => {
              const { label, emoji } = getReason(award.reason)
              return (
                <motion.div
                  key={award.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--fl-border-2)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ background: 'var(--fl-card-alt)' }}
                  >
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fl-text)' }}>{label}</p>
                    <p className="text-[11px] truncate leading-snug" style={{ color: 'var(--fl-text-3)' }}>{award.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-500">+{award.amount}</p>
                    <p className="text-[10px]" style={{ color: 'var(--fl-text-3)' }}>{timeAgo(award.created_at)}</p>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>

        {/* ── Change Password ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="rounded-2xl p-5"
          style={{
            background: 'var(--fl-card)',
            border:     '1px solid var(--fl-border)',
            boxShadow:  'var(--fl-shadow)',
          }}
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--fl-text)' }}>Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-3" noValidate>
            <PwField
              id="pw-current"
              label="Current Password"
              value={pwForm.current}
              onChange={e => setPwField('current', e.target.value)}
              error={pwErrors.current}
              accent={accent}
            />
            <PwField
              id="pw-new"
              label="New Password"
              value={pwForm.newPw}
              onChange={e => setPwField('newPw', e.target.value)}
              error={pwErrors.newPw}
              accent={accent}
            />
            <PwField
              id="pw-confirm"
              label="Confirm New Password"
              value={pwForm.confirm}
              onChange={e => setPwField('confirm', e.target.value)}
              error={pwErrors.confirm}
              accent={accent}
            />

            <motion.button
              type="submit"
              disabled={pwBusy}
              whileHover={pwBusy ? {} : { scale: 1.01 }}
              whileTap={pwBusy ? {} : { scale: 0.98 }}
              className="w-full mt-1 py-2.5 rounded-xl text-sm font-bold text-white
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: accent }}
            >
              {pwBusy ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Updating…
                </>
              ) : 'Update Password'}
            </motion.button>
          </form>
        </motion.div>

        {/* ── Sign out ─────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={signOut}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            color:      'var(--fl-text-3)',
            border:     '1px solid var(--fl-border)',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--fl-card-alt)'
            e.currentTarget.style.color = 'var(--fl-text-2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--fl-text-3)'
          }}
        >
          Sign out
        </motion.button>

      </div>
    </div>
  )
}
