import { Store, Truck } from 'lucide-react'
import type { DeliveryType } from '../../types'

interface DeliveryBadgeProps {
  type: DeliveryType
  size?: 'sm' | 'md'
}

export function DeliveryBadge({ type, size = 'sm' }: DeliveryBadgeProps) {
  const isPickup = type === 'PICKUP'

  const iconSize = size === 'sm' ? 12 : 15
  const padding  = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  if (isPickup) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
        style={{ background: '#1e3a5f', color: '#60a5fa' }}
      >
        <Store size={iconSize} />
        Самовывоз
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{ background: '#2e1065', color: '#a78bfa' }}
    >
      <Truck size={iconSize} />
      Доставка
    </span>
  )
}
