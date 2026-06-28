import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import FullPageLoader from './FullPageLoader'

/** Requires an active admin session. */
export function AdminRoute({ children }) {
  const { loading, session, isAdmin } = useAuth()
  if (loading)   return <FullPageLoader />
  if (!session)  return <Navigate to="/admin/login" replace />
  if (!isAdmin)  return <Navigate to="/" replace />
  return children
}

/** Requires an active student session. */
export function StudentRoute({ children }) {
  const { loading, session, isStudent } = useAuth()
  if (loading)    return <FullPageLoader />
  if (!session)   return <Navigate to="/" replace />
  if (!isStudent) return <Navigate to="/admin/dashboard" replace />
  return children
}

/** Admin login page guard — bounces already-authenticated users to their home. */
export function GuestAdminRoute({ children }) {
  const { loading, isAdmin, isStudent } = useAuth()
  if (loading)   return <FullPageLoader />
  if (isAdmin)   return <Navigate to="/admin/dashboard" replace />
  if (isStudent) return <Navigate to="/dashboard" replace />
  return children
}

/** Student login page guard — bounces already-authenticated users to their home. */
export function GuestStudentRoute({ children }) {
  const { loading, isAdmin, isStudent } = useAuth()
  if (loading)   return <FullPageLoader />
  if (isAdmin)   return <Navigate to="/admin/dashboard" replace />
  if (isStudent) return <Navigate to="/dashboard" replace />
  return children
}
