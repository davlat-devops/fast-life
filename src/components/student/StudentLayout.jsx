import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Calendar, Trophy, User, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import { CLANS } from '@/constants/clans'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'
import logo from '@/assets/logo.webp'

// ── Sidebar nav items ─────────────────────────────────────────

const SIDEBAR_NAV = [
  { to: '/dashboard',   label: 'Home',    Icon: Home     },
  { to: '/clan',        label: 'Clan',    Icon: Users    },
  { to: '/events',      label: 'Events',  Icon: Calendar },
  { to: '/leaderboard', label: 'Ranks',   Icon: Trophy   },
  { to: '/profile',     label: 'Profile', Icon: User     },
]

// ── Mobile bottom nav icons ───────────────────────────────────

const Ic = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    {...props}
  />
)

const TABS = [
  {
    to: '/dashboard', label: 'Home',
    icon: <Ic><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ic>,
  },
  {
    to: '/clan', label: 'Clan',
    icon: <Ic><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Ic>,
  },
  {
    to: '/events', label: 'Events',
    icon: <Ic><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ic>,
  },
  {
    to: '/leaderboard', label: 'Ranks',
    icon: <Ic><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>,
  },
  {
    to: '/profile', label: 'Profile',
    icon: <Ic><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ic>,
  },
]

// ── Clan letter badge ─────────────────────────────────────────

function ClanLetterBadge({ clanId, accent, size = 32 }) {
  const letter = CLANS[clanId]?.name[0]?.toUpperCase() ?? '?'
  const radius = Math.round(size * 0.28)
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.46), fontWeight: 900, color: accent,
      background: accent + '20',
      border: `1.5px solid ${accent}45`,
    }}>
      {letter}
    </div>
  )
}

// ── Theme toggle ──────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--fl-card-alt)',
        border: '1px solid var(--fl-border)',
        color: 'var(--fl-text-2)',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {theme === 'dark'
        ? <Sun size={14} strokeWidth={2} />
        : <Moon size={14} strokeWidth={2} />}
    </button>
  )
}

// ── Desktop sidebar ───────────────────────────────────────────

function Sidebar({ studentRecord, accentColor, onClose }) {
  const { theme } = useTheme()
  const firstName  = studentRecord?.full_name?.split(' ')[0] ?? 'Student'
  const clanName   = CLANS[studentRecord?.clan]?.name ?? ''

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full relative"
      style={{
        background:   'var(--fl-nav-bg)',
        borderRight:  '1px solid var(--fl-border)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Accent line on right edge */}
      <div style={{
        position: 'absolute', top: 0, right: -1, width: 1, bottom: 0,
        background: `linear-gradient(180deg, transparent 0%, ${accentColor} 45%, transparent 100%)`,
        opacity: 0.35,
      }} />

      {/* Brand */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--fl-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <img
          src={logo}
          alt="Fast Education"
          width={45}
          height={40}
          decoding="async"
          style={{
            height: 40, width: 'auto', objectFit: 'contain',
            filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Close button — mobile slide-over only */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: 'var(--fl-card-alt)',
                border: '1px solid var(--fl-border)',
                color: 'var(--fl-text-2)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {SIDEBAR_NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none', minHeight: 44,
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              color: isActive ? '#fff' : 'var(--fl-text-3)',
              background: isActive
                ? `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`
                : 'transparent',
              boxShadow: isActive ? `0 4px 16px ${accentColor}40` : 'none',
            })}
            className={({ isActive }) => isActive ? '' : 'hover:!bg-[var(--fl-card-alt)] hover:!text-[var(--fl-text)]'}
          >
            <Icon size={18} strokeWidth={1.9} style={{ opacity: 0.85, flexShrink: 0 }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Student footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--fl-border)' }}>
        <div className="flex items-center gap-2.5">
          {studentRecord?.clan && (
            <ClanLetterBadge clanId={studentRecord.clan} accent={accentColor} size={34} />
          )}
          <div className="flex-1 min-w-0">
            <p style={{
              fontSize: 12, fontWeight: 700,
              color: 'var(--fl-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {firstName}
            </p>
            <p style={{ fontSize: 10, color: 'var(--fl-text-3)' }}>
              <span style={{ color: accentColor, fontWeight: 700 }}>
                {(studentRecord?.cp ?? 0).toLocaleString()} CP
              </span>
              {clanName && <span> · {clanName}</span>}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Inner layout ──────────────────────────────────────────────

function StudentLayoutInner() {
  const { loading, studentLoading, session, isStudent, studentRecord } = useAuth()
  const { theme } = useTheme()
  const location   = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading || studentLoading) return <FullPageLoader />
  if (!session || !isStudent)    return <Navigate to="/" replace />

  const accentColor = CLANS[studentRecord?.clan]?.colorAccent ?? '#CC0000'
  const firstName   = studentRecord?.full_name?.split(' ')[0] ?? 'Student'

  return (
    <div
      className="flex h-screen overflow-hidden"
      data-theme={theme}
      style={{ background: 'var(--fl-bg)' }}
    >
      {/* ── Mobile overlay ────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ───────────────────────────────── */}
      <div className="hidden md:flex h-full">
        <Sidebar
          studentRecord={studentRecord}
          accentColor={accentColor}
        />
      </div>

      {/* ── Mobile slide-over sidebar ─────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 bottom-0 z-40 md:hidden h-full"
          >
            <Sidebar
              studentRecord={studentRecord}
              accentColor={accentColor}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-3.5 shrink-0"
          style={{
            background:           'var(--fl-nav-bg)',
            borderBottom:         '1px solid var(--fl-border)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            paddingTop:  'max(env(safe-area-inset-top, 0px), 8px)',
            paddingBottom: 7,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 34, height: 34, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--fl-card-alt)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-2)',
              cursor: 'pointer',
            }}
          >
            <Menu size={17} />
          </button>

          <div className="flex items-center gap-2">
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: accentColor + '20',
              border: `1.5px solid ${accentColor}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, color: accentColor,
            }}>
              {CLANS[studentRecord?.clan]?.name[0]?.toUpperCase() ?? '?'}
            </div>
            <span style={{ color: 'var(--fl-text)', fontSize: 12, fontWeight: 700 }}>
              {firstName}
            </span>
            <span style={{
              background:    accentColor + '18',
              color:         accentColor,
              border:        `1px solid ${accentColor}38`,
              borderRadius:  999,
              fontSize:      9,
              fontWeight:    700,
              padding:       '2px 7px',
            }}>
              {(studentRecord?.cp ?? 0).toLocaleString()} CP
            </span>
          </div>

          <ThemeToggle />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide pb-[56px] md:pb-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch justify-around"
        style={{
          background:           'var(--fl-nav-bg)',
          borderTop:            '1px solid var(--fl-border)',
          backdropFilter:       'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom:        'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            style={{ minHeight: 56 }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 rounded-b-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${accentColor} 25%, ${accentColor} 75%, transparent)`,
                      boxShadow:  `0 0 10px ${accentColor}80`,
                      height:     2.5,
                      left:       '10%',
                      right:      '10%',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span style={{ color: isActive ? accentColor : 'var(--fl-icon-dim)', transition: 'color 0.2s' }}>
                  {icon}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.03em',
                  color: isActive ? accentColor : 'var(--fl-text-3)',
                  transition: 'color 0.2s',
                }}>
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
