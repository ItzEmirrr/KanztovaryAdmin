import { NavLink, Outlet } from 'react-router-dom'
import { ShoppingBasket, History } from 'lucide-react'
import { Breadcrumb } from '../../components/shared/Breadcrumb'

export function RetailLayout() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Касса' }]} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
          <ShoppingBasket size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Касса</h1>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10 w-full sm:w-fit mb-6">
        <NavLink
          to="/retail"
          end
          className={({ isActive }) =>
            `flex flex-1 sm:flex-initial items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive ? 'bg-[#0f172a] text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <ShoppingBasket size={14} />
          Новая продажа
        </NavLink>
        <NavLink
          to="/retail/history"
          className={({ isActive }) =>
            `flex flex-1 sm:flex-initial items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive ? 'bg-[#0f172a] text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <History size={14} />
          История
        </NavLink>
      </div>

      <Outlet />
    </div>
  )
}
