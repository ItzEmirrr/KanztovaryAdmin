import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { retailSalesApi } from '../api/retailSales'
import type { RetailSaleRequest } from '../types'
import type { RetailSalesParams } from '../api/retailSales'

export function useRetailSalesSummary(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: ['retail-sales-summary', params],
    queryFn:  () => retailSalesApi.getSummary(params),
    staleTime: 30_000,
  })
}

export function useRetailSales(filters: RetailSalesParams = {}) {
  return useQuery({
    queryKey: ['retail-sales', filters],
    queryFn: () => retailSalesApi.getAll(filters),
  })
}

export function useRetailSale(id: number | null) {
  return useQuery({
    queryKey: ['retail-sale', id],
    queryFn: () => retailSalesApi.getById(id!),
    enabled: id !== null,
  })
}

export function useCreateRetailSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RetailSaleRequest) => retailSalesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail-sales'] })
    },
  })
}

export function useDeleteRetailSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => retailSalesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail-sales'] })
    },
  })
}
