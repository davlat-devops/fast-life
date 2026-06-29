import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import { CLANS } from '@/constants/clans'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

// ── Clan letter badge for top bar ────────────────────────────

function ClanLetterBadge({ clanId, accent, size = 28 }) {
  const letter = CLANS[clanId]?.name[0]?.toUpperCase() ?? '?'
  const radius = Math.round(size * 0.32)
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.48), fontWeight: 900, color: accent,
      background: accent + '18',
      border: `1.5px solid ${accent}40`,
    }}>
      {letter}
    </div>
  )
}

// ── Theme toggle ──────────────────────────────────────────────

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        background:     'var(--fl-card-alt)',
        border:         '1px solid var(--fl-border)',
        borderRadius:   999,
        width:          34,
        height:         34,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         'pointer',
        color:          'var(--fl-text-2)',
        transition:     'background 0.2s',
      }}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

// ── Tab icons ─────────────────────────────────────────────────

const Ic = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    {...props}
  />
)

const TABS = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <Ic>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </Ic>
    ),
  },
  {
    to: '/clan',
    label: 'Clan',
    icon: (
      <Ic>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </Ic>
    ),
  },
  {
    to: '/events',
    label: 'Events',
    icon: (
      <Ic>
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8"  y1="2" x2="8"  y2="6"/>
        <line x1="3"  y1="10" x2="21" y2="10"/>
      </Ic>
    ),
  },
  {
    to: '/leaderboard',
    label: 'Ranks',
    icon: (
      <Ic>
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </Ic>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <Ic>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </Ic>
    ),
  },
]

// ── Inner layout (needs theme context) ────────────────────────

function StudentLayoutInner() {
  const { loading, studentLoading, session, isStudent, studentRecord } = useAuth()
  const { theme }  = useTheme()
  const location   = useLocation()

  if (loading || studentLoading) return <FullPageLoader />
  if (!session || !isStudent)    return <Navigate to="/" replace />

  const accentColor = studentRecord
    ? (CLANS[studentRecord.clan]?.colorAccent ?? '#CC0000')
    : '#CC0000'

  const firstName = studentRecord?.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      data-theme={theme}
      style={{ background: 'var(--fl-bg)' }}
    >
      {/* ── Top bar ──────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          background:    'var(--fl-nav-bg)',
          borderBottom:  '1px solid var(--fl-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingTop:    'max(env(safe-area-inset-top, 0px), 10px)',
          paddingBottom: 10,
        }}
      >
        <div className="flex items-center gap-2.5">
          {studentRecord?.clan && <ClanLetterBadge clanId={studentRecord.clan} accent={accentColor} size={28} />}
          <span style={{ color: 'var(--fl-text)', fontSize: 13, fontWeight: 700 }}>
            {firstName}
          </span>
          <span
            style={{
              background:   accentColor + '18',
              color:        accentColor,
              border:       `1px solid ${accentColor}38`,
              borderRadius: 999,
              fontSize:     10,
              fontWeight:   700,
              padding:      '2px 8px',
              letterSpacing: '0.02em',
            }}
          >
            {(studentRecord?.cp ?? 0).toLocaleString()} CP
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* ── Page content ─────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ── Bottom tab bar ──────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 flex items-stretch justify-around"
        style={{
          background:    'var(--fl-nav-bg)',
          borderTop:     '1px solid var(--fl-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative"
            style={{ minHeight: 76 }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 rounded-b-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #CC0000 25%, #e53e3e 50%, #CC0000 75%, transparent)',
                      boxShadow:  '0 0 12px rgba(204,0,0,0.55)',
                      height:     3.5,
                      left:       '8%',
                      right:      '8%',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}

                <span style={{ color: isActive ? accentColor : 'var(--fl-icon-dim)', transition: 'color 0.2s' }}>
                  {icon}
                </span>
                <span
                  style={{
                    fontSize:      10,
                    fontWeight:    isActive ? 700 : 600,
                    letterSpacing: '0.04em',
                    color:         isActive ? accentColor : 'var(--fl-text-3)',
                    transition:    'color 0.2s',
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

// ── Exported layout wraps with ThemeProvider ──────────────────

export default function StudentLayout() {
  return (
    <ThemeProvider>
      <StudentLayoutInner />
    </ThemeProvider>
  )
}
