import { api } from './axios'
import type { OrderFilters, OrderResponse, OrdersResponse, OrderStatus } from '../types'

export const ordersApi = {
  getAll: (filters: OrderFilters = {}) => {
    const params: Record<string, unknown> = {}
    if (filters.status)       params.status       = filters.status
    if (filters.deliveryType) params.deliveryType = filters.deliveryType
    if (filters.from)         params.from         = filters.from
    if (filters.to)           params.to           = filters.to
    if (filters.userId)       params.userId       = filters.userId
    params.page = filters.page ?? 0
    params.size = filters.size ?? 10
    return api.get<OrdersResponse>('/api/v1/orders', { params }).then((r) => r.data)
  },

  getById: (id: number) =>
    api.get<OrderResponse>(`/api/v1/orders/${id}`).then((r) => r.data),

  updateStatus: (id: number, status: OrderStatus) =>
    api.put<OrderResponse>(`/api/v1/orders/${id}`, { status }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/v1/orders/${id}`).then((r) => r.data),
}
