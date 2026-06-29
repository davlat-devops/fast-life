import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import logo from '@/assets/logo.png'

// ── SVG nav icons ─────────────────────────────────────────────
const Ic = ({ d, children, ...p }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
)

const NAV = [
  {
    to: '/admin/dashboard', label: 'Dashboard',
    icon: <Ic><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>,
  },
  {
    to: '/admin/students', label: 'Students',
    icon: <Ic><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ic>,
  },
  {
    to: '/admin/events', label: 'Events',
    icon: <Ic><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ic>,
  },
  {
    to: '/admin/cp', label: 'CP Awards',
    icon: <Ic d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  },
  {
    to: '/admin/rankings', label: 'Rankings',
    icon: <Ic><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Ic>,
  },
  {
    to: '/admin/reset', label: 'Monthly Reset',
    icon: <Ic d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 12l2.25-2.25M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M21 12l-2.25 2.25"/>,
  },
]

function Sidebar({ user, onSignOut }) {
  return (
    <aside className="w-60 shrink-0 flex flex-col h-full border-r border-white/[0.06]"
      style={{ background: '#0f0f0f' }}>

      {/* Brand */}
      <div className="flex items-center px-5 py-4 border-b border-white/[0.06]">
        <img
          src={logo}
          alt="Fast Education"
          className="h-12 w-auto object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-red/15 text-white border-l-2 border-brand-red pl-[10px]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04] border-l-2 border-transparent'
              }`
            }
          >
            <span className="shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/[0.06] space-y-3">
        <div className="px-1">
          <p className="text-[10px] text-white/25 uppercase tracking-widest">Signed in as</p>
          <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <Ic width="14" height="14" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── Layout wrapper (also the auth guard for all /admin/* routes) ──
export default function AdminLayout() {
  const { loading, session, isAdmin, user, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  if (loading) return <FullPageLoader />
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      <Sidebar user={user} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
