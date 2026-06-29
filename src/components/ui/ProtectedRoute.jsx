import { Navigate } from 'react-router-dom'
import { useAuth }      from '@/contexts/AuthContext'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import FullPageLoader from './FullPageLoader'

/**
 * Admin login guard — redirects already-authenticated admins to their dashboard.
 * A logged-in student is ignored: the admin portal is a separate auth domain.
 */
export function GuestAdminRoute({ children }) {
  const { loading, isAdmin } = useAdminAuth()
  if (loading) return <FullPageLoader />
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />
  return children
}

/**
 * Student login guard — redirects already-authenticated students to their dashboard.
 * A logged-in admin is ignored: the student portal is a separate auth domain.
 */
export function GuestStudentRoute({ children }) {
  const { loading, isStudent } = useAuth()
  if (loading) return <FullPageLoader />
  if (isStudent) return <Navigate to="/dashboard" replace />
  return children
}
