import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import { CLANS } from '@/constants/clans'

// ── Tab bar icons ─────────────────────────────────────────────
const Ic = (props) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
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

// ── Layout ────────────────────────────────────────────────────

export default function StudentLayout() {
  const { loading, studentLoading, session, isStudent, studentRecord } = useAuth()

  if (loading || studentLoading) return <FullPageLoader />
  if (!session || !isStudent)    return <Navigate to="/" replace />

  // Clan accent for active tab indicator
  const accentColor = studentRecord
    ? (CLANS[studentRecord.clan]?.colorAccent ?? '#CC0000')
    : '#CC0000'

  return (
    <div className="flex flex-col h-screen bg-brand-dark overflow-hidden">

      {/* Page content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ── Bottom tab bar ──────────────────────────────── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 flex items-end justify-around"
        style={{
          background:    'rgba(10,10,10,0.92)',
          borderTop:     '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-1 py-3 group"
          >
            {({ isActive }) => (
              <>
                {/* Active indicator dot */}
                <motion.div
                  animate={{ scaleX: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="absolute top-0 h-[2px] w-8 rounded-full"
                  style={{ background: accentColor }}
                />

                {/* Icon */}
                <span
                  className="transition-all duration-200"
                  style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.3)' }}
                >
                  {icon}
                </span>

                {/* Label */}
                <span
                  className="text-[10px] font-semibold tracking-wide transition-all duration-200"
                  style={{ color: isActive ? accentColor : 'rgba(255,255,255,0.25)' }}
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
