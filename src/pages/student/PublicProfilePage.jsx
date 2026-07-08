import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Lock, Award, UserX } from 'lucide-react'
import { supabase, supabaseAdminAuth } from '@/lib/supabase'
import { useAdminTheme } from '@/contexts/AdminThemeContext'
import { CLANS } from '@/constants/clans'
import { BADGES, BADGE_ICONS } from '@/constants/badges'
import { ClanIcon } from '@/components/ui/ClanIcons'

const LEVEL_COLOUR = {
  A1: '#6b7280', A2: '#6b7280',
  B1: '#3b82f6', B2: '#3b82f6',
  C1: '#C9A227', C2: '#C9A227',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

// ── Page ─────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { studentId } = useParams()
  const navigate       = useNavigate()
  const location       = useLocation()
  const isAdminPortal  = location.pathname.startsWith('/admin')
  const client         = isAdminPortal ? supabaseAdminAuth : supabase

  // This page renders inside two different shells: StudentLayout (which
  // already sets the real data-theme from ThemeContext on an ancestor —
  // --fl-* vars inherit down to us for free) or AdminLayout (which only
  // sets data-admin-theme, so --fl-* would be undefined here unless we
  // supply data-theme ourselves). Only set it for the admin case, and pull
  // it from the admin's own theme preference — never hardcode a value, and
  // never touch the fetched student's data.
  const { theme: adminTheme } = useAdminTheme()
  const themeAttr = isAdminPortal ? adminTheme : undefined

  const [student,  setStudent]  = useState(null)
  const [badges,   setBadges]   = useState([])
  const [wins,     setWins]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)

    Promise.all([
      client.from('students')
        .select('id, full_name, level, clan, cp, is_active, created_at')
        .eq('id', studentId)
        .single(),
      client.from('badges').select('badge_key, earned_at').eq('student_id', studentId),
      client.from('hall_of_fame').select('month, year')
        .eq('top_student_id', studentId)
        .order('year', { ascending: false })
        .order('month', { ascending: false }),
    ]).then(([studentRes, badgesRes, winsRes]) => {
      if (!active) return
      if (studentRes.error || !studentRes.data) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setStudent(studentRes.data)
      setBadges(badgesRes.data ?? [])
      setWins(winsRes.data ?? [])
      setLoading(false)
    })

    return () => { active = false }
  }, [studentId, client])

  const clanInfo = CLANS[student?.clan]
  const accent   = clanInfo?.colorAccent ?? '#CC0000'
  const initials = student?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const joinDate = student?.created_at
    ? new Date(student.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  const earnedKeys = new Set(badges.map(b => b.badge_key))
  const allBadges  = Object.values(BADGES)

  function BackButton() {
    return (
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: 'var(--fl-text-2)' }}
      >
        <ArrowLeft size={16} />
        Back
      </button>
    )
  }

  if (notFound) {
    return (
      <div data-theme={themeAttr} className="min-h-screen flex items-center justify-center px-5" style={{ background: 'var(--fl-bg)' }}>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <UserX size={40} style={{ color: 'var(--fl-text-3)', opacity: 0.5 }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--fl-text-3)' }}>Student not found</p>
          <BackButton />
        </div>
      </div>
    )
  }

  return (
    <div data-theme={themeAttr} className="min-h-screen" style={{ background: 'var(--fl-bg)' }}>
      <div className="px-5 md:px-8 pt-5">
        <BackButton />
      </div>

      <div className="px-5 md:px-8 pt-4 pb-6 space-y-4 max-w-2xl">

        {/* ── Identity card ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--fl-card)', border: '1px solid var(--fl-border)', boxShadow: 'var(--fl-shadow)' }}
        >
          {loading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-[90px] h-[90px] rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-40 h-5" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="shrink-0 flex items-center justify-center text-2xl font-black text-white"
                style={{
                  width: 90, height: 90, borderRadius: '50%', background: accent,
                  boxShadow: `0 0 0 3px ${accent}50, 0 0 0 6px ${accent}22, 0 0 32px ${accent}45`,
                }}
              >
                {initials}
              </motion.div>

              <div>
                <h1 className="text-xl font-black" style={{ color: 'var(--fl-text)' }}>{student.full_name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {clanInfo && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}40` }}
                    >
                      <ClanIcon clanId={student.clan} size={13} />
                      {clanInfo.name}
                    </span>
                  )}
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      background: `${LEVEL_COLOUR[student.level] ?? '#666'}22`,
                      color:       LEVEL_COLOUR[student.level] ?? '#888',
                    }}
                  >
                    {student.level}
                  </span>
                  {!student.is_active && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--fl-text-3)' }}>
                  {student.cp.toLocaleString()} CP · member since {joinDate}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Hall of Fame ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--fl-card)', border: '1px solid var(--fl-border)', boxShadow: 'var(--fl-shadow)' }}
        >
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--fl-text)' }}>
            <Trophy size={15} style={{ color: '#C9A227' }} />
            Hall of Fame
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-8 w-40" />)}
            </div>
          ) : wins.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--fl-text-3)' }}>No Hall of Fame wins yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wins.map((w, i) => (
                <motion.span
                  key={`${w.month}-${w.year}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(201,162,39,0.15)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }}
                >
                  <Trophy size={11} />
                  {MONTH_NAMES[w.month - 1]} {w.year}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Badges ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--fl-card)', border: '1px solid var(--fl-border)', boxShadow: 'var(--fl-shadow)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--fl-text)' }}>Badges</h2>
            <span className="text-[11px]" style={{ color: 'var(--fl-text-3)' }}>
              {loading ? '…' : `${earnedKeys.size} / ${allBadges.length}`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
              {[...Array(21)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
              {allBadges.map((badge, i) => {
                const earned    = earnedKeys.has(badge.key)
                const BadgeIcon = BADGE_ICONS[badge.key] ?? Award

                return (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    title={`${badge.label}: ${badge.description}`}
                    className="relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-default overflow-hidden"
                    style={earned
                      ? {
                          background: 'var(--fl-glass)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: `1px solid ${accent}45`,
                          boxShadow: `0 0 12px ${accent}30, inset 0 1px 0 var(--fl-glass-hl)`,
                        }
                      : { background: 'var(--fl-card-alt)', border: '1px solid var(--fl-border)' }}
                  >
                    <BadgeIcon
                      size={18}
                      style={{
                        color:   earned ? '#C9A227' : 'var(--fl-text-3)',
                        opacity: earned ? 1 : 0.25,
                        filter:  earned ? 'drop-shadow(0 0 4px #C9A22760)' : 'none',
                      }}
                    />
                    <span
                      className="text-[8px] font-bold text-center leading-none px-0.5"
                      style={{ color: earned ? accent : 'var(--fl-text-3)', opacity: earned ? 1 : 0.35 }}
                    >
                      {badge.label.split(' ')[0]}
                    </span>

                    {!earned && (
                      <div className="absolute inset-0 flex items-end justify-end p-1" style={{ pointerEvents: 'none' }}>
                        <Lock size={9} style={{ color: 'var(--fl-text-3)', opacity: 0.35 }} />
                      </div>
                    )}

                    {earned && (
                      <div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: accent, boxShadow: `0 0 4px ${accent}` }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
