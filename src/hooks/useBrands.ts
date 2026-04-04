import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { brandsApi } from '../api/brands'
import type { BrandRequest } from '../types'

export const BRANDS_KEY = 'brands'

export function useBrands() {
  return useQuery({
    queryKey: [BRANDS_KEY],
    queryFn: () => brandsApi.getAll(),
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BrandRequest) => brandsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BRANDS_KEY] }); toast.success('Бренд создан') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}

export function useUpdateBrand(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BrandRequest) => brandsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BRANDS_KEY] }); toast.success('Бренд обновлён') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => brandsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [BRANDS_KEY] }); toast.success('Бренд удалён') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}
