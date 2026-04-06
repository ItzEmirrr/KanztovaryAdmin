import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Trash2, ChevronRight,
  User, Phone, Calendar, Box, X, Check, Loader2,
  Store, Truck, MapPin, BadgeInfo, Copy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useOrder, useUpdateOrderStatus, useDeleteOrder } from '../../hooks/useOrders'
import { Breadcrumb } from '../../components/shared/Breadcrumb'
import { OrderStatusBadge } from '../../components/shared/StatusBadge'
import { DeliveryBadge } from '../../components/shared/DeliveryBadge'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { Skeleton } from '../../components/shared/Skeleton'
import { formatPrice, formatDate, getImageUrl } from '../../lib/utils'
import type { OrderStatus } from '../../types'

const ALL_STATUSES: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'NEW',         label: 'Новый',     color: '#3b82f6' },
  { value: 'IN_PROGRESS', label: 'В работе',  color: '#f59e0b' },
  { value: 'COMPLETED',   label: 'Выполнен',  color: '#10b981' },
  { value: 'CANCELLED',   label: 'Отменён',   color: '#ef4444' },
]

function StatusDrawer({
  current,
  onClose,
  onConfirm,
  loading,
}: {
  current: OrderStatus
  onClose: () => void
  onConfirm: (s: OrderStatus) => void
  loading: boolean
}) {
  const [selected, setSelected] = useState<OrderStatus>(current)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-80 h-full glass border-l border-white/10 flex flex-col slide-in-right"
           style={{ background: 'rgba(15,23,42,0.95)' }}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white">Изменить статус</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSelected(s.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-left
                ${selected === s.value
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5 border border-transparent'
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: s.color, boxShadow: selected === s.value ? `0 0 8px ${s.color}` : 'none' }}
              />
              <span className="text-sm text-slate-200 flex-1">{s.label}</span>
              {selected === s.value && <Check size={15} className="text-indigo-400" />}
              {current === s.value && selected !== s.value && (
                <span className="text-xs text-slate-500">текущий</span>
              )}
            </button>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={() => onConfirm(selected)}
            disabled={selected === current || loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  )
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} скопирован`))
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = Number(id)
  const navigate = useNavigate()

  const { data: order, isLoading } = useOrder(orderId)
  const updateStatus = useUpdateOrderStatus(orderId)
  const deleteOrder = useDeleteOrder()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleStatusChange = (status: OrderStatus) => {
    updateStatus.mutate(status, { onSuccess: () => setDrawerOpen(false) })
  }

  const handleDelete = () => {
    deleteOrder.mutate(orderId, { onSuccess: () => navigate('/orders') })
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-20 text-slate-500">Заказ не найден</div>
  }

  const statusColors: Record<OrderStatus, string> = {
    NEW: '#3b82f6',
    IN_PROGRESS: '#f59e0b',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
  }

  const isDelivery = order.deliveryType === 'DELIVERY'
  const deliveryFee = order.deliveryFee ?? 0
  const grandTotal = order.grandTotal ?? order.totalPrice

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Заказы', href: '/orders' },
        { label: `Заказ #${order.id}` },
      ]} />

      {/* Header */}
      <div className="mb-6 space-y-3">
        {/* Row 1: back + title + badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/orders')}
            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Заказ #{order.id}</h1>
          <OrderStatusBadge status={order.status} />
          <DeliveryBadge type={order.deliveryType ?? 'PICKUP'} size="sm" />
        </div>
        {/* Row 2: date + actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-slate-400">{formatDate(order.createdAt)}</p>
          <div className="flex gap-2">
            <button onClick={() => setDrawerOpen(true)} className="btn-primary text-sm">
              <span className="hidden sm:inline">Изменить статус</span>
              <span className="sm:hidden">Статус</span>
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="w-9 h-9 rounded-lg border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Client + Delivery blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Клиент */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Клиент</h3>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Покупатель</p>
              <p className="text-sm font-semibold text-white">{order.username}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Phone size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Телефон</p>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${order.phoneNumber}`}
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {order.phoneNumber}
                </a>
                <button
                  onClick={() => copyToClipboard(order.phoneNumber, 'Телефон')}
                  className="text-slate-500 hover:text-white transition-colors"
                  title="Копировать"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Обновлён</p>
              <p className="text-sm text-slate-300">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Доставка */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Доставка</h3>
          {/* Способ */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: isDelivery ? 'rgba(139,92,246,0.1)' : 'rgba(96,165,250,0.1)' }}>
              {isDelivery
                ? <Truck size={16} style={{ color: '#a78bfa' }} />
                : <Store size={16} style={{ color: '#60a5fa' }} />
              }
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Способ</p>
              <DeliveryBadge type={order.deliveryType ?? 'PICKUP'} size="md" />
            </div>
          </div>
          {/* Адрес */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Адрес</p>
              {isDelivery && order.deliveryAddress ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-200">{order.deliveryAddress}</p>
                  <button
                    onClick={() => copyToClipboard(order.deliveryAddress!, 'Адрес')}
                    className="text-slate-500 hover:text-white transition-colors shrink-0"
                    title="Копировать"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Клиент заберёт сам</p>
              )}
            </div>
          </div>
          {/* Стоимость доставки — только для DELIVERY */}
          {isDelivery && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0">
                <BadgeInfo size={16} className="text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Стоимость доставки</p>
                {deliveryFee === 0 ? (
                  <p className="text-sm font-medium text-emerald-400">Бесплатно (заказ от 10 000 ₸)</p>
                ) : (
                  <p className="text-sm text-slate-200">{deliveryFee} сом</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items table */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-slate-300">Состав заказа ({order.items.length})</h3>
          </div>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['Товар', 'SKU', 'Кол-во', 'Цена', 'Итого'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#131e35]'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1e293b] overflow-hidden shrink-0">
                          {item.product?.images?.[0] ? (
                            <img src={getImageUrl(item.product.images[0].imageUrl)} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Box size={14} className="text-slate-600" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-slate-200">{item.productName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{item.product?.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatPrice(item.price)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Итог */}
          <div className="px-5 py-4 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Товары:</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Доставка:</span>
              {isDelivery
                ? deliveryFee === 0
                  ? <span className="text-emerald-400">Бесплатно</span>
                  : <span>{formatPrice(deliveryFee)}</span>
                : <span className="text-slate-500">—</span>
              }
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-sm font-semibold text-slate-300">К оплате:</span>
              <span className="text-base font-bold text-white">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">История статусов</h3>
          {order.statusHistory.length === 0 ? (
            <p className="text-sm text-slate-500">История пуста</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[7px] top-3 bottom-3 w-px bg-white/10" />
              <div className="space-y-4">
                {order.statusHistory.map((entry, i) => {
                  const color = statusColors[entry.newStatus as OrderStatus] ?? '#64748b'
                  return (
                    <div key={i} className="flex gap-4 relative">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 relative z-10 ring-2 ring-[#0f172a]"
                        style={{ background: color }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.previousStatus ? (
                            <span className="text-xs text-slate-500">{entry.previousStatus}</span>
                          ) : (
                            <span className="text-xs text-slate-500">Заказ создан</span>
                          )}
                          {entry.previousStatus && (
                            <>
                              <ChevronRight size={10} className="text-slate-600" />
                              <span className="text-xs font-medium" style={{ color }}>{entry.newStatus}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{entry.changedBy}</p>
                        <p className="text-xs text-slate-600">{formatDate(entry.changedAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <StatusDrawer
          current={order.status}
          onClose={() => setDrawerOpen(false)}
          onConfirm={handleStatusChange}
          loading={updateStatus.isPending}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить заказ?"
        message={`Заказ покупателя «${order.username}» на сумму ${formatPrice(grandTotal)} будет безвозвратно удалён.`}
        confirmLabel="Удалить"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
