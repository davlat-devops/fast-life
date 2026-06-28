import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { GuestAdminRoute, GuestStudentRoute } from '@/components/ui/ProtectedRoute'

import AdminLayout        from '@/components/admin/AdminLayout'
import AdminLogin         from '@/pages/admin/AdminLogin'
import AdminDashboard     from '@/pages/admin/AdminDashboard'
import StudentManagement  from '@/pages/admin/StudentManagement'

import StudentLogin       from '@/pages/student/StudentLogin'
import StudentLayout      from '@/components/student/StudentLayout'
import StudentDashboard   from '@/pages/student/StudentDashboard'
import ClanPage           from '@/pages/student/ClanPage'
import EventsPage         from '@/pages/student/EventsPage'
import LeaderboardPage    from '@/pages/student/LeaderboardPage'
import ProfilePage        from '@/pages/student/ProfilePage'

const Placeholder = ({ label }) => (
  <div className="p-8 opacity-50 font-mono">
    <h2 className="text-white text-xl mb-1">{label}</h2>
    <p className="text-white/40 text-sm">Coming in a future step.</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ── Student login (standalone — no nav) ─────── */}
            <Route path="/" element={
              <GuestStudentRoute><StudentLogin /></GuestStudentRoute>
            } />

            {/* ── Student app (bottom-tab layout, auth-guarded in StudentLayout) */}
            <Route element={<StudentLayout />}>
              <Route path="/dashboard"   element={<StudentDashboard />} />
              <Route path="/clan"        element={<ClanPage />} />
              <Route path="/events"      element={<EventsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile"     element={<ProfilePage />} />
            </Route>

            {/* ── Admin login (standalone — no sidebar) ───── */}
            <Route path="/admin/login" element={
              <GuestAdminRoute><AdminLogin /></GuestAdminRoute>
            } />

            {/* ── Admin app (sidebar layout, auth-guarded in AdminLayout) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"           element={<AdminDashboard />} />
              <Route path="students"            element={<StudentManagement />} />
              <Route path="events"              element={<Placeholder label="Event Management" />} />
              <Route path="attendance/:eventId" element={<Placeholder label="Attendance Register" />} />
              <Route path="cp"                  element={<Placeholder label="Manual CP Awards" />} />
              <Route path="rankings"            element={<Placeholder label="Rankings" />} />
              <Route path="reset"               element={<Placeholder label="Monthly Reset" />} />
              <Route path="*"                   element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
