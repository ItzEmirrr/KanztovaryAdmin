import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productsApi } from '../api/products'
import type { ProductFilters, ProductRequest } from '../types'

export const PRODUCTS_KEY = 'products'

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, filters],
    queryFn: () => productsApi.getAll(filters),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      data,
      images,
      onProgress,
    }: {
      data: ProductRequest
      images: File[]
      onProgress?: (pct: number) => void
    }) => productsApi.create(data, images, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Товар создан')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка при создании'),
  })
}

export function useUpdateProduct(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      data,
      images,
      onProgress,
    }: {
      data: ProductRequest
      images?: File[]
      onProgress?: (pct: number) => void
    }) => productsApi.update(id, data, images, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Товар обновлён')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка при обновлении'),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      toast.success('Товар удалён')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка при удалении'),
  })
}
