import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ordersApi } from '../api/orders'
import type { OrderFilters, OrderStatus } from '../types'

export const ORDERS_KEY = 'orders'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: [ORDERS_KEY, filters],
    queryFn: () => ordersApi.getAll(filters),
  })
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] })
      toast.success('Статус обновлён')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ordersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] })
      toast.success('Заказ удалён')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}
