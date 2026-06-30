import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Star, BarChart3,
  RefreshCw, Shield, Sun, Moon, LogOut, Menu, X, ScrollText,
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext'
import { useToast } from '@/contexts/ToastContext'
import FullPageLoader from '@/components/ui/FullPageLoader'
import logo from '@/assets/logo.png'

const IDLE_WARN_MS  = 25 * 60 * 1000  // 25 minutes
const IDLE_LIMIT_MS = 30 * 60 * 1000  // 30 minutes

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/admin/students',  label: 'Students',     Icon: Users           },
  { to: '/admin/events',    label: 'Events',       Icon: Calendar        },
  { to: '/admin/cp',        label: 'CP Awards',    Icon: Star            },
  { to: '/admin/rankings',  label: 'Rankings',     Icon: BarChart3       },
  { to: '/admin/reset',     label: 'Monthly Reset',Icon: RefreshCw       },
  { to: '/admin/admins',    label: 'Admins',       Icon: Shield          },
  { to: '/admin/audit-log',label: 'Audit Log',    Icon: ScrollText      },
]

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

function MeshBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        top: '-10%', left: '20%', background: 'var(--ad-mesh-a)', filter: 'blur(80px)',
        animation: 'adMeshA 18s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        bottom: '10%', right: '5%', background: 'var(--ad-mesh-b)', filter: 'blur(70px)',
        animation: 'adMeshB 22s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        top: '40%', left: '-5%', background: 'var(--ad-mesh-c)', filter: 'blur(60px)',
        animation: 'adMeshC 26s ease-in-out infinite',
      }}/>
    </div>
  )
}

function Sidebar({ user, onSignOut, onClose }) {
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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'var(--ad-hover)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-2)' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV.map(({ to, label, Icon }) => (
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
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--ad-border)', transition: 'border-color 0.3s' }}>
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
            width: '100%', padding: '7px 10px', borderRadius: 8, minHeight: 44,
            fontSize: 11, fontWeight: 600, color: 'var(--ad-text-3)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.12)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ad-text-3)' }}
        >
          <LogOut size={13} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

function AdminLayoutInner() {
  const { loading, session, isAdmin, user, signOut } = useAdminAuth()
  const { theme } = useAdminTheme()
  const { toast } = useToast()
  const navigate      = useNavigate()
  const location      = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const lastActivityRef = useRef(Date.now())
  const warnedRef       = useRef(false)

  useEffect(() => {
    if (!session) return

    function resetTimer() { lastActivityRef.current = Date.now(); warnedRef.current = false }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }))

    const interval = setInterval(async () => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= IDLE_LIMIT_MS) {
        clearInterval(interval)
        await signOut()
        navigate('/admin/login', { replace: true })
      } else if (idle >= IDLE_WARN_MS && !warnedRef.current) {
        warnedRef.current = true
        toast({ message: 'You will be signed out in 5 minutes due to inactivity.', type: 'warning', duration: 8000 })
      }
    }, 30_000)

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
      clearInterval(interval)
    }
  }, [session])

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
      style={{ background: 'var(--ad-bg)', fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.3s ease' }}
    >
      {/* ── Mobile overlay ────────────────────────────── */}
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

      {/* ── Sidebar — desktop: in flow; mobile: slide-over ─ */}
      {/* Desktop */}
      <div className="hidden md:flex h-full">
        <Sidebar user={user} onSignOut={handleSignOut} />
      </div>

      {/* Mobile */}
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
            <Sidebar user={user} onSignOut={handleSignOut} onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollbar-hide relative flex flex-col">

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 shrink-0 sticky top-0 z-20"
          style={{ background: 'var(--ad-bg)', borderBottom: '1px solid var(--ad-border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'var(--ad-surface)', border: '1px solid var(--ad-border)', color: 'var(--ad-text-2)' }}
          >
            <Menu size={20} />
          </button>

          <img
            src={logo}
            alt="Fast Education"
            style={{
              height: 36, width: 'auto', objectFit: 'contain',
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none',
            }}
          />

          <ThemeToggle />
        </div>

        {/* Page */}
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
