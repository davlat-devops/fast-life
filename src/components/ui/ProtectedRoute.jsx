import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import FullPageLoader from './FullPageLoader'

/** Admin login page guard — bounces already-authenticated users to their home. */
export function GuestAdminRoute({ children }) {
  const { loading, isAdmin, isStudent } = useAuth()
  if (loading)   return <FullPageLoader />
  if (isAdmin)   return <Navigate to="/admin/dashboard" replace />
  if (isStudent) return <Navigate to="/dashboard" replace />
  return children
}

/** Student login page guard — only redirects authenticated students. Admins may visit freely. */
export function GuestStudentRoute({ children }) {
  const { loading, isStudent } = useAuth()
  if (loading)   return <FullPageLoader />
  if (isStudent) return <Navigate to="/dashboard" replace />
  return children
}
