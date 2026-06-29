import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, Calendar, Star, BarChart3, RefreshCw, Sun, Moon, LogOut } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import logo from '@/assets/logo.png'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/admin/students',  label: 'Students',     Icon: Users           },
  { to: '/admin/events',    label: 'Events',       Icon: Calendar        },
  { to: '/admin/cp',        label: 'CP Awards',    Icon: Star            },
  { to: '/admin/rankings',  label: 'Rankings',     Icon: BarChart3       },
  { to: '/admin/reset',     label: 'Monthly Reset',Icon: RefreshCw       },
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
      {theme === 'dark' ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
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
            filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV.map(({ to, label, Icon }) => (
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
            <Icon size={18} strokeWidth={1.9} style={{ opacity: 0.85, flexShrink: 0 }} />
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
          <LogOut size={13} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

// ── Inner layout (needs AdminThemeContext) ─────────────────────
function AdminLayoutInner() {
  const { loading, session, isAdmin, user, signOut } = useAdminAuth()
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
