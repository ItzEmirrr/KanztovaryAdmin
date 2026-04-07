import { useState } from 'react'
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Users,
  Truck, Store, AlertTriangle, Banknote, AlertCircle,
  CreditCard,
} from 'lucide-react'
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { useKpi } from '../hooks/useKpi'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { Skeleton, StatCardSkeleton } from '../components/shared/Skeleton'
import { CountUp } from '../components/shared/CountUp'
import { formatMoney, formatGrowth, formatChartDate } from '../lib/utils'
import type { KpiPeriod } from '../types'

const PERIODS: { key: KpiPeriod; label: string }[] = [
  { key: 'WEEK',  label: '7 дней'  },
  { key: 'MONTH', label: '30 дней' },
  { key: 'YEAR',  label: 'Год'     },
]

const STATUS_COLORS: Record<string, string> = {
  NEW:         '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  COMPLETED:   '#10b981',
  CANCELLED:   '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  NEW:         'Новые',
  IN_PROGRESS: 'В работе',
  COMPLETED:   'Выполнены',
  CANCELLED:   'Отменены',
}

const MEDAL: { bg: string; color: string }[] = [
  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' }, // gold
  { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }, // silver
  { bg: 'rgba(180,83,9,0.15)',    color: '#b45309' }, // bronze
  { bg: 'rgba(71,85,105,0.12)',   color: '#475569' },
  { bg: 'rgba(71,85,105,0.12)',   color: '#475569' },
]

// Custom tooltip for revenue chart
function RevenueTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { payload: { revenue: number; orderCount: number } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <span className="text-slate-400">{formatChartDate(label ?? '')}: </span>
      <span className="text-white font-semibold">{d.revenue.toLocaleString('ru-RU')} сом</span>
      <span className="text-slate-400"> · </span>
      <span className="text-slate-300">{d.orderCount} заказов</span>
    </div>
  )
}

export function DashboardPage() {
  const [period, setPeriod] = useState<KpiPeriod>('MONTH')
  const { data: kpi, isLoading, isError, refetch } = useKpi(period)

  const statusPieData = kpi
    ? (Object.entries(kpi.ordersByStatus ?? {}) as [string, number][])
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : []

  const deliveryTotal = kpi ? (kpi.deliveryCount ?? 0) + (kpi.pickupCount ?? 0) : 0
  const deliveryPieData = kpi && deliveryTotal > 0
    ? [
        { name: 'DELIVERY', value: kpi.deliveryCount ?? 0, color: '#8b5cf6' },
        { name: 'PICKUP',   value: kpi.pickupCount   ?? 0, color: '#60a5fa' },
      ].filter(d => d.value > 0)
    : []

  const hasRevenueData = (kpi?.revenueChart ?? []).some(d => d.revenue > 0)

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {kpi && (
              <p className="text-xs text-slate-500 mt-0.5">
                {kpi.periodStart} — {kpi.periodEnd}
              </p>
            )}
          </div>
        </div>

        {/* Period switcher */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                period === p.key
                  ? 'bg-[#0f172a] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3 border border-red-500/30">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span className="text-sm text-slate-300 flex-1">Не удалось загрузить KPI</span>
          <button
            onClick={() => refetch()}
            className="btn-primary text-xs px-3 py-1.5"
          >
            Повторить
          </button>
        </div>
      )}

      {/* ── Row 1: Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : kpi && (
            <>
              {/* 1. Выручка за период */}
              <div className="glass-card p-4 sm:p-5" style={{ borderTop: '3px solid #10b981' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium leading-tight">Выручка за период</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 ml-1">
                    <TrendingUp size={15} className="text-emerald-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mb-2 leading-none">
                  <CountUp end={Math.floor(kpi.periodRevenue)} suffix=" сом" />
                </p>
                {kpi.revenueGrowthPercent !== null ? (
                  <span className={`text-xs font-medium ${kpi.revenueGrowthPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatGrowth(kpi.revenueGrowthPercent)} vs прошлый
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Нет данных за прошлый период</span>
                )}
              </div>

              {/* 2. Общая выручка */}
              <div className="glass-card p-4 sm:p-5" style={{ borderTop: '3px solid #3b82f6' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium leading-tight">Общая выручка</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 ml-1">
                    <Banknote size={15} className="text-blue-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mb-2 leading-none">
                  <CountUp end={Math.floor(kpi.totalRevenue)} suffix=" сом" />
                </p>
              </div>

              {/* 3. Заказов за период */}
              <div className="glass-card p-4 sm:p-5" style={{ borderTop: '3px solid #8b5cf6' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium leading-tight">Заказов за период</p>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 ml-1">
                    <ShoppingCart size={15} className="text-violet-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mb-2 leading-none">
                  <CountUp end={kpi.periodOrders} />
                </p>
                <span className="text-xs text-slate-500">Всего: {kpi.totalOrders}</span>
              </div>

              {/* 4. Средний чек */}
              <div className="glass-card p-4 sm:p-5" style={{ borderTop: '3px solid #f59e0b' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium leading-tight">Средний чек</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 ml-1">
                    <CreditCard size={15} className="text-amber-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mb-2 leading-none">
                  <CountUp end={Math.floor(kpi.averageOrderValue)} suffix=" сом" />
                </p>
              </div>

              {/* 5. Доставок */}
              <div className="glass-card p-4 sm:p-5" style={{ borderTop: '3px solid #6366f1' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium leading-tight">Доставок сегодня</p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 ml-1">
                    <Truck size={15} className="text-indigo-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mb-2 leading-none">
                  <CountUp end={kpi.deliveryCount} />
                </p>
                <span className="text-xs text-slate-500">Самовывоз: {kpi.pickupCount}</span>
              </div>

              {/* 6. Клиентов */}
              <div className="glass-card p-4 sm:p-5" style={{ borderTop: '3px solid #f43f5e' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-400 font-medium leading-tight">Клиентов</p>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 ml-1">
                    <Users size={15} className="text-rose-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mb-2 leading-none">
                  <CountUp end={kpi.totalCustomers} />
                </p>
              </div>
            </>
          )
        }
      </div>

      {/* ── Row 2: Charts ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      ) : kpi && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Revenue area chart */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Выручка по дням</h3>
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={kpi.revenueChart ?? []}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatChartDate}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v)
                    }
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    content={<RevenueTooltip />}
                    cursor={{ stroke: 'rgba(139,92,246,0.25)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#8b5cf6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[230px] flex items-center justify-center text-slate-500 text-sm">
                Нет данных за период
              </div>
            )}
          </div>

          {/* Status donut */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Статусы заказов</h3>
            {statusPieData.length > 0 ? (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statusPieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] ?? '#64748b'}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white leading-tight">{kpi.totalOrders}</p>
                      <p className="text-xs text-slate-400 leading-tight">заказов</p>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="space-y-2 mt-1">
                  {statusPieData.map(entry => {
                    const pct = kpi.totalOrders > 0
                      ? Math.round((entry.value / kpi.totalOrders) * 100)
                      : 0
                    return (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: STATUS_COLORS[entry.name] }}
                        />
                        <span className="text-slate-400 flex-1">{STATUS_LABELS[entry.name] ?? entry.name}</span>
                        <span className="text-slate-200 font-medium">{entry.value}</span>
                        <span className="text-slate-500 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                Нет данных
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 3: Top products · Delivery · Low stock ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-6">
          <Skeleton className="h-64 lg:col-span-4" />
          <Skeleton className="h-64 lg:col-span-3" />
          <Skeleton className="h-64 lg:col-span-3" />
        </div>
      ) : kpi && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 mb-6">
          {/* Top products */}
          <div className="glass-card p-5 lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-300">Лидеры продаж</h3>
            </div>
            {(kpi.topProducts ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">
                Ещё нет завершённых заказов
              </p>
            ) : (
              <div className="space-y-3">
                {(kpi.topProducts ?? []).slice(0, 5).map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: MEDAL[i].bg, color: MEDAL[i].color }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.productName}</p>
                      <p className="text-xs font-mono text-slate-500">{p.productSku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">{p.totalQuantity} шт.</p>
                      <p className="text-xs font-semibold text-indigo-300">
                        {p.totalRevenue.toLocaleString('ru-RU')} сом
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery vs Pickup */}
          <div className="glass-card p-5 lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={15} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-300">Доставка vs Самовывоз</h3>
            </div>
            {deliveryPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie
                      data={deliveryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={62}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {deliveryPieData.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Truck size={12} className="text-violet-400 shrink-0" />
                    <span className="text-slate-400 flex-1">Доставка</span>
                    <span className="text-slate-200 font-medium">{kpi.deliveryCount} заказов</span>
                    <span className="text-slate-500 w-9 text-right">
                      {deliveryTotal > 0 ? Math.round((kpi.deliveryCount / deliveryTotal) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Store size={12} className="text-blue-400 shrink-0" />
                    <span className="text-slate-400 flex-1">Самовывоз</span>
                    <span className="text-slate-200 font-medium">{kpi.pickupCount} заказов</span>
                    <span className="text-slate-500 w-9 text-right">
                      {deliveryTotal > 0 ? Math.round((kpi.pickupCount / deliveryTotal) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                Нет данных
              </div>
            )}
          </div>

          {/* Low stock */}
          <div className="glass-card p-5 lg:col-span-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-300">Низкий остаток</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Остаток ≤ {kpi.lowStockThreshold} шт.
            </p>
            {(kpi.lowStockProducts ?? []).length === 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                <span className="text-sm text-emerald-400">✓ Всё в порядке</span>
              </div>
            ) : (
              <div
                className="space-y-2.5 overflow-y-auto pr-1"
                style={{ maxHeight: 200 }}
              >
                {(kpi.lowStockProducts ?? []).map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                      <p className="text-xs font-mono text-slate-500">{p.sku}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      p.stockQuantity === 0
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {p.stockQuantity === 0 ? 'Нет' : `${p.stockQuantity} шт.`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 4: Bottom stats ── */}
      {!isLoading && kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Banknote size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Сборы за доставку</p>
              <p className="text-base font-semibold text-white">
                За всё время: {formatMoney(kpi.totalDeliveryFees)}
              </p>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              kpi.cancellationRate > 10 ? 'bg-red-500/10' : 'bg-emerald-500/10'
            }`}>
              <AlertCircle
                size={18}
                className={kpi.cancellationRate > 10 ? 'text-red-400' : 'text-emerald-400'}
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Процент отмен</p>
              <p className={`text-base font-semibold ${
                kpi.cancellationRate > 10 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {kpi.cancellationRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
