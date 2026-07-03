import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }      from '@/contexts/AuthContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { ToastProvider }     from '@/contexts/ToastContext'
import { GuestAdminRoute, GuestStudentRoute } from '@/components/ui/ProtectedRoute'
import FullPageLoader from '@/components/ui/FullPageLoader'

// Layouts and login screens are needed on first paint, so they stay in the
// main bundle. Everything behind them is route-split below — a student
// never downloads the admin panel's code, and vice versa.
import AdminLayout from '@/components/admin/AdminLayout'
import AdminLogin  from '@/pages/admin/AdminLogin'

import StudentLogin  from '@/pages/student/StudentLogin'
import StudentLayout from '@/components/student/StudentLayout'

const AdminDashboard     = lazy(() => import('@/pages/admin/AdminDashboard'))
const StudentManagement  = lazy(() => import('@/pages/admin/StudentManagement'))
const EventManagement    = lazy(() => import('@/pages/admin/EventManagement'))
const AttendanceRegister = lazy(() => import('@/pages/admin/AttendanceRegister'))
const CpAwards           = lazy(() => import('@/pages/admin/CpAwards'))
const Rankings           = lazy(() => import('@/pages/admin/Rankings'))
const MonthlyReset       = lazy(() => import('@/pages/admin/MonthlyReset'))
const AdminManagement    = lazy(() => import('@/pages/admin/AdminManagement'))
const AuditLog           = lazy(() => import('@/pages/admin/AuditLog'))
const BadgeManagement    = lazy(() => import('@/pages/admin/BadgeManagement'))

const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))
const ClanPage         = lazy(() => import('@/pages/student/ClanPage'))
const EventsPage       = lazy(() => import('@/pages/student/EventsPage'))
const LeaderboardPage  = lazy(() => import('@/pages/student/LeaderboardPage'))
const ProfilePage      = lazy(() => import('@/pages/student/ProfilePage'))


export default function App() {
  return (
    <BrowserRouter>
      {/*
        Both providers are mounted at the top so every route can access its
        own auth context. They are entirely independent — different Supabase
        clients, different localStorage keys ('fl-student' / 'fl-admin').
        Student code uses useAuth(); admin code uses useAdminAuth().
      */}
      <AuthProvider>
        <AdminAuthProvider>
          <ToastProvider>
            <Suspense fallback={<FullPageLoader />}>
              <Routes>
                {/* ── Student login ────────────────────────────── */}
                <Route path="/" element={
                  <GuestStudentRoute><StudentLogin /></GuestStudentRoute>
                } />

                {/* ── Student app (auth-guarded inside StudentLayout) */}
                <Route element={<StudentLayout />}>
                  <Route path="/dashboard"   element={<StudentDashboard />} />
                  <Route path="/clan"        element={<ClanPage />} />
                  <Route path="/events"      element={<EventsPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/profile"     element={<ProfilePage />} />
                </Route>

                {/* ── Admin login ───────────────────────────────── */}
                <Route path="/admin/login" element={
                  <GuestAdminRoute><AdminLogin /></GuestAdminRoute>
                } />

                {/* ── Admin app (auth-guarded inside AdminLayout) */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard"           element={<AdminDashboard />} />
                  <Route path="students"            element={<StudentManagement />} />
                  <Route path="events"              element={<EventManagement />} />
                  <Route path="attendance/:eventId" element={<AttendanceRegister />} />
                  <Route path="cp"                  element={<CpAwards />} />
                  <Route path="rankings"            element={<Rankings />} />
                  <Route path="reset"               element={<MonthlyReset />} />
                  <Route path="admins"              element={<AdminManagement />} />
                  <Route path="audit-log"           element={<AuditLog />} />
                  <Route path="badges"              element={<BadgeManagement />} />
                  <Route path="*"                   element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
