import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import logo from '@/assets/logo.png'

// ── SVG nav icons ─────────────────────────────────────────────
const Ic = ({ children, ...p }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
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
    icon: <Ic><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Ic>,
  },
  {
    to: '/admin/rankings', label: 'Rankings',
    icon: <Ic><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Ic>,
  },
  {
    to: '/admin/reset', label: 'Monthly Reset',
    icon: <Ic><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 12l2.25-2.25M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M21 12l-2.25 2.25"/></Ic>,
  },
]

// ── Theme Toggle ──────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme()
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--ad-surface)', border: '1px solid var(--ad-border)',
        color: 'var(--ad-text-2)', cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
      }}
    >
      {theme === 'dark' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

// ── Animated gradient mesh background ────────────────────────
function MeshBackground() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 0,
    }}>
      <div style={{
        position: 'absolute', width: 600, height: 600,
        borderRadius: '50%', top: '-10%', left: '20%',
        background: 'var(--ad-mesh-a)',
        filter: 'blur(80px)',
        animation: 'adMeshA 18s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 500, height: 500,
        borderRadius: '50%', bottom: '10%', right: '5%',
        background: 'var(--ad-mesh-b)',
        filter: 'blur(70px)',
        animation: 'adMeshB 22s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', top: '40%', left: '-5%',
        background: 'var(--ad-mesh-c)',
        filter: 'blur(60px)',
        animation: 'adMeshC 26s ease-in-out infinite',
      }}/>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({ user, onSignOut }) {
  const { theme } = useAdminTheme()
  const isDark = theme === 'dark'

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full relative"
      style={{
        background: `linear-gradient(180deg, var(--ad-sidebar-from) 0%, var(--ad-sidebar-to) 100%)`,
        borderRight: '1px solid var(--ad-border)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Animated right-side gradient border */}
      <div style={{
        position: 'absolute', top: 0, right: -1, width: 1, bottom: 0,
        background: 'linear-gradient(180deg, transparent 0%, var(--ad-red) 40%, var(--ad-mesh-b) 70%, transparent 100%)',
        opacity: 0.5,
      }}/>

      {/* Brand */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--ad-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'border-color 0.3s',
      }}>
        <img
          src={logo}
          alt="Fast Education"
          style={{
            height: 44, width: 'auto', objectFit: 'contain',
            filter: isDark ? 'brightness(0) invert(1)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              color: isActive ? '#fff' : 'var(--ad-text-3)',
              background: isActive
                ? `linear-gradient(135deg, var(--ad-red) 0%, #a81010 100%)`
                : 'transparent',
              boxShadow: isActive ? `0 4px 16px var(--ad-red-glow)` : 'none',
            })}
            className={({ isActive }) => isActive ? '' : 'hover:!bg-[var(--ad-hover)] hover:!text-[var(--ad-text)]'}
          >
            <span style={{ opacity: 0.85 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--ad-border)',
        transition: 'border-color 0.3s',
      }}>
        <p style={{ fontSize: 10, color: 'var(--ad-text-4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
          Signed in as
        </p>
        <p style={{ fontSize: 11, color: 'var(--ad-text-3)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </p>
        <button
          onClick={onSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 8,
            fontSize: 11, fontWeight: 600, color: 'var(--ad-text-3)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(229,62,62,0.12)'
            e.currentTarget.style.color = '#f87171'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--ad-text-3)'
          }}
        >
          <Ic width="13" height="13">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </Ic>
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── Inner layout (needs AdminThemeContext) ─────────────────────
function AdminLayoutInner() {
  const { loading, session, isAdmin, user, signOut } = useAuth()
  const { theme } = useAdminTheme()
  const navigate  = useNavigate()
  const location  = useLocation()

  if (loading) return <FullPageLoader />
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div
      data-admin-theme={theme}
      className="flex h-screen overflow-hidden"
      style={{
        background: 'var(--ad-bg)',
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: 'background 0.3s ease',
      }}
    >
      <Sidebar user={user} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto scrollbar-hide relative">
        <MeshBackground />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ minHeight: '100%', position: 'relative', zIndex: 1 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}

export default function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner />
    </AdminThemeProvider>
  )
}
