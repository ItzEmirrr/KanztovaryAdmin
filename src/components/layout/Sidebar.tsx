import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Building2,
  ShoppingCart, LogOut, ChevronLeft, ChevronRight,
  PenLine, Store, MoreHorizontal,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { ConfirmDialog } from '../shared/ConfirmDialog'

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',  exact: true },
  { to: '/products',   icon: Package,         label: 'Товары' },
  { to: '/categories', icon: Tag,             label: 'Категории' },
  { to: '/brands',     icon: Building2,       label: 'Бренды' },
  { to: '/orders',     icon: ShoppingCart,    label: 'Заказы' },
  { to: '/retail',     icon: Store,           label: 'Касса' },
]

// Primary items shown in the mobile bottom bar
const MOBILE_PRIMARY = NAV_ITEMS.filter((i) =>
  ['/', '/products', '/orders', '/retail'].includes(i.to)
)

// Secondary items shown in the "More" sheet
const MOBILE_SECONDARY = NAV_ITEMS.filter((i) =>
  ['/categories', '/brands'].includes(i.to)
)

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR (hidden on mobile) ═══ */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full z-30 flex-col transition-all duration-300 ease-in-out
          glass border-r border-white/10
          ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: 'rgba(15,23,42,0.85)' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <PenLine size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-white whitespace-nowrap">Stationery</div>
              <div className="text-xs text-slate-500 whitespace-nowrap">Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-all duration-150 group relative
                 ${isActive
                   ? 'gradient-primary text-white shadow-lg shadow-indigo-500/20'
                   : 'text-slate-400 hover:text-white hover:bg-white/5'
                 }
                 ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`shrink-0 transition-all duration-150
                      ${isActive
                        ? 'text-white'
                        : 'text-slate-500 group-hover:text-indigo-400'
                      }`}
                  />
                  {!collapsed && <span>{label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs
                                    rounded-md opacity-0 group-hover:opacity-100 pointer-events-none
                                    whitespace-nowrap transition-opacity duration-150 border border-white/10">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-4 border-t border-white/10 space-y-1">
          <button
            onClick={() => setConfirmLogout(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150
                        ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Выйти</span>}
          </button>
          <button
            onClick={onToggle}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                        text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-150
                        ${collapsed ? 'justify-center' : 'justify-end'}`}
          >
            {collapsed ? <ChevronRight size={16} /> : <><span className="text-xs">Свернуть</span><ChevronLeft size={16} /></>}
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE BOTTOM NAV (hidden on desktop) ═══ */}

      {/* "More" slide-up sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="relative rounded-t-2xl p-4 pb-8 space-y-1 border-t border-white/10"
            style={{ background: 'rgba(15,23,42,0.98)' }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            {MOBILE_SECONDARY.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'gradient-primary text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}

            <button
              onClick={() => { setMoreOpen(false); setConfirmLogout(true) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/10"
        style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-stretch">
          {MOBILE_PRIMARY.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors min-h-[52px] ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 active:text-slate-300'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </NavLink>
          ))}

          {/* "More" button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[52px] text-slate-500 active:text-slate-300 transition-colors"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium leading-tight">Ещё</span>
          </button>
        </div>
      </nav>

      {/* Logout confirm dialog (shared for both desktop + mobile) */}
      <ConfirmDialog
        open={confirmLogout}
        title="Выйти из системы?"
        message="Вы уверены, что хотите выйти из административной панели?"
        confirmLabel="Выйти"
        danger
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  )
}
