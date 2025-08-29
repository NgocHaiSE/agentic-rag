import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/auth'
import type { ReactElement } from 'react'

export default function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: Role[] }) {
  const location = useLocation()
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
