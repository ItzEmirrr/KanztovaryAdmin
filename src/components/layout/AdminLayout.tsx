import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../store/authStore'
import { ShieldX, LogOut } from 'lucide-react'

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { isAuthenticated, isAdmin, logout } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 sm:p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <ShieldX size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Доступ запрещён</h2>
          <p className="text-sm text-slate-400 mb-6">
            У вашего аккаунта недостаточно прав для доступа к административной панели.
          </p>
          <button
            onClick={() => logout()}
            className="btn-ghost w-full justify-center"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/*
        Desktop: margin-left matches sidebar width (lg:ml-16 collapsed / lg:ml-60 expanded)
        Mobile:  no left margin, but pb-16 to clear the fixed bottom nav
      */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 pb-16 lg:pb-0 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
