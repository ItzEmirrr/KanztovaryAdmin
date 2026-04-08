import { api } from './axios'
import type { RetailSale, RetailSaleRequest, RetailSalesResponse, RetailSalesSummary } from '../types'

export interface RetailSalesParams {
  from?: string
  to?: string
  page?: number
  size?: number
}

export const retailSalesApi = {
  create: (data: RetailSaleRequest) =>
    api.post<RetailSale>('/api/v1/retail-sales', data).then((r) => r.data),

  getAll: (params: RetailSalesParams = {}) => {
    const p: Record<string, unknown> = {}
    if (params.from) p.from = params.from
    if (params.to)   p.to   = params.to
    p.page = params.page ?? 0
    p.size = params.size ?? 20
    return api.get<RetailSalesResponse>('/api/v1/retail-sales', { params: p }).then((r) => r.data)
  },

  getById: (id: number) =>
    api.get<RetailSale>(`/api/v1/retail-sales/${id}`).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/v1/retail-sales/${id}`),

  getSummary: (params: { from?: string; to?: string } = {}) =>
    api.get<RetailSalesSummary>('/api/v1/retail-sales/summary', { params }).then((r) => r.data),
}
