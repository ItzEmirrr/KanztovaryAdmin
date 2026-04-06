import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Search } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { Breadcrumb } from '../../components/shared/Breadcrumb'
import { OrderStatusBadge } from '../../components/shared/StatusBadge'
import { DeliveryBadge } from '../../components/shared/DeliveryBadge'
import { Pagination } from '../../components/shared/Pagination'
import { TableSkeleton } from '../../components/shared/Skeleton'
import { EmptyState } from '../../components/shared/EmptyState'
import { formatPrice, formatDate } from '../../lib/utils'
import type { DeliveryType, OrderFilters, OrderStatus } from '../../types'

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'NEW', label: 'Новые' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'COMPLETED', label: 'Выполнены' },
  { value: 'CANCELLED', label: 'Отменены' },
]

const DELIVERY_OPTIONS: { value: DeliveryType | ''; label: string }[] = [
  { value: '', label: 'Все способы' },
  { value: 'PICKUP', label: 'Самовывоз' },
  { value: 'DELIVERY', label: 'Доставка' },
]

export function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: OrderFilters = {
    status:       (searchParams.get('status') as OrderStatus)       || undefined,
    deliveryType: (searchParams.get('deliveryType') as DeliveryType) || undefined,
    from:         searchParams.get('from') || undefined,
    to:           searchParams.get('to')   || undefined,
    userId:       searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined,
    page:         Number(searchParams.get('page') ?? 0),
    size:         10,
  }

  const { data, isLoading } = useOrders(filters)

  const updateFilter = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  }, [setSearchParams])

  const orders = data?.orders ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  return (
    <div>
      <Breadcrumb items={[{ label: 'Заказы' }]} />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <ShoppingCart size={20} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Заказы</h1>
          {data && <p className="text-sm text-slate-400">{data.totalElements} заказов</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          <select
            className="input-base col-span-1"
            value={searchParams.get('status') ?? ''}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="input-base col-span-1"
            value={searchParams.get('deliveryType') ?? ''}
            onChange={(e) => updateFilter('deliveryType', e.target.value)}
          >
            {DELIVERY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <input
              type="date"
              className="input-base flex-1"
              value={searchParams.get('from') ?? ''}
              onChange={(e) => updateFilter('from', e.target.value)}
            />
            <span className="text-slate-500 text-sm shrink-0">—</span>
            <input
              type="date"
              className="input-base flex-1"
              value={searchParams.get('to') ?? ''}
              onChange={(e) => updateFilter('to', e.target.value)}
            />
          </div>

          <div className="relative col-span-2 sm:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="number"
              className="input-base pl-8 w-full sm:w-36"
              placeholder="ID покупателя"
              value={searchParams.get('userId') ?? ''}
              onChange={(e) => updateFilter('userId', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Заказов нет"
            description="Заказы появятся здесь, когда покупатели начнут оформлять покупки."
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-white/5">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="p-4 cursor-pointer active:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">#{order.id}</span>
                      <OrderStatusBadge status={order.status} size="sm" />
                      <DeliveryBadge type={order.deliveryType ?? 'PICKUP'} size="sm" />
                    </div>
                    <span className="text-sm font-bold text-white ml-2 shrink-0">
                      {formatPrice(order.grandTotal ?? order.totalPrice)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">{order.username}</p>
                  <p className="text-xs text-slate-500">
                    {order.items.length} поз. · {formatDate(order.createdAt)}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['ID', 'Покупатель', 'Получение', 'Товаров', 'К оплате', 'Статус', 'Дата'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className={`table-row-hover border-b border-white/5 cursor-pointer
                        ${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#131e35]'}`}
                      style={{ borderLeft: '2px solid transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderLeft = '2px solid #6366f1')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderLeft = '2px solid transparent')}
                    >
                      <td className="px-5 py-3 text-sm font-mono text-slate-400">#{order.id}</td>
                      <td className="px-5 py-3 text-sm text-slate-200">{order.username}</td>
                      <td className="px-5 py-3">
                        <DeliveryBadge type={order.deliveryType ?? 'PICKUP'} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">{order.items.length}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-white">
                        {formatPrice(order.grandTotal ?? order.totalPrice)}
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => updateFilter('page', String(p))}
      />
    </div>
  )
}
