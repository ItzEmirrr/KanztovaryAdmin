import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md px-4">
        <Outlet />
      </div>
    </div>
  )
}
