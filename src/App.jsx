import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }      from '@/contexts/AuthContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { ToastProvider }     from '@/contexts/ToastContext'
import { GuestAdminRoute, GuestStudentRoute } from '@/components/ui/ProtectedRoute'

import AdminLayout          from '@/components/admin/AdminLayout'
import AdminLogin           from '@/pages/admin/AdminLogin'
import AdminDashboard       from '@/pages/admin/AdminDashboard'
import StudentManagement    from '@/pages/admin/StudentManagement'
import EventManagement      from '@/pages/admin/EventManagement'
import AttendanceRegister   from '@/pages/admin/AttendanceRegister'
import CpAwards             from '@/pages/admin/CpAwards'
import Rankings             from '@/pages/admin/Rankings'
import MonthlyReset         from '@/pages/admin/MonthlyReset'
import AdminManagement      from '@/pages/admin/AdminManagement'
import AuditLog            from '@/pages/admin/AuditLog'

import StudentLogin       from '@/pages/student/StudentLogin'
import StudentLayout      from '@/components/student/StudentLayout'
import StudentDashboard   from '@/pages/student/StudentDashboard'
import ClanPage           from '@/pages/student/ClanPage'
import EventsPage         from '@/pages/student/EventsPage'
import LeaderboardPage    from '@/pages/student/LeaderboardPage'
import ProfilePage        from '@/pages/student/ProfilePage'


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
                <Route path="*"                   element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
