import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { GuestAdminRoute, GuestStudentRoute, StudentRoute } from '@/components/ui/ProtectedRoute'

import AdminLayout        from '@/components/admin/AdminLayout'
import AdminLogin         from '@/pages/admin/AdminLogin'
import AdminDashboard     from '@/pages/admin/AdminDashboard'
import StudentManagement  from '@/pages/admin/StudentManagement'

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
            {/* ── Student portal ──────────────────────────── */}
            <Route path="/" element={
              <GuestStudentRoute><Placeholder label="Student Login" /></GuestStudentRoute>
            } />
            <Route path="/dashboard" element={
              <StudentRoute><Placeholder label="Student Dashboard" /></StudentRoute>
            } />
            <Route path="/clan" element={
              <StudentRoute><Placeholder label="Clan Page" /></StudentRoute>
            } />
            <Route path="/events" element={
              <StudentRoute><Placeholder label="Events" /></StudentRoute>
            } />
            <Route path="/leaderboard" element={
              <StudentRoute><Placeholder label="Leaderboard" /></StudentRoute>
            } />
            <Route path="/profile" element={
              <StudentRoute><Placeholder label="Profile" /></StudentRoute>
            } />

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
