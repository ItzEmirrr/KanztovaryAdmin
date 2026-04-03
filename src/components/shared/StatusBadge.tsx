import type { OrderStatus, ProductStatus } from '../../types'

const ORDER_CONFIG: Record<OrderStatus, { label: string; bg: string; dot: string; text: string }> = {
  NEW:         { label: 'Новый',      bg: 'bg-blue-500/15',   dot: 'bg-blue-400',   text: 'text-blue-300' },
  IN_PROGRESS: { label: 'В работе',   bg: 'bg-yellow-500/15', dot: 'bg-yellow-400', text: 'text-yellow-300' },
  COMPLETED:   { label: 'Выполнен',   bg: 'bg-emerald-500/15',dot: 'bg-emerald-400',text: 'text-emerald-300' },
  CANCELLED:   { label: 'Отменён',    bg: 'bg-red-500/15',    dot: 'bg-red-400',    text: 'text-red-300' },
}

const PRODUCT_CONFIG: Record<ProductStatus, { label: string; bg: string; dot: string; text: string; strike?: boolean }> = {
  ACTIVE:   { label: 'Активен',  bg: 'bg-emerald-500/15', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  INACTIVE: { label: 'Скрыт',    bg: 'bg-slate-500/20',   dot: 'bg-slate-400',   text: 'text-slate-400' },
  DELETED:  { label: 'Удалён',   bg: 'bg-red-500/15',     dot: 'bg-red-400',     text: 'text-red-300', strike: true },
}

interface OrderStatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md'
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const cfg = ORDER_CONFIG[status] ?? ORDER_CONFIG.NEW
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${cfg.bg} ${cfg.text}`}>
      <span className={`status-dot ${cfg.dot} pulse-dot`} />
      {cfg.label}
    </span>
  )
}

interface ProductStatusBadgeProps {
  status: ProductStatus
  size?: 'sm' | 'md'
}

export function ProductStatusBadge({ status, size = 'md' }: ProductStatusBadgeProps) {
  const cfg = PRODUCT_CONFIG[status] ?? PRODUCT_CONFIG.ACTIVE
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${cfg.bg} ${cfg.text} ${cfg.strike ? 'line-through' : ''}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
