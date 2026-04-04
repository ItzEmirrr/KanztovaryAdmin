import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoriesApi } from '../api/categories'
import type { CategoryRequest } from '../types'

export const CATEGORIES_KEY = 'categories'

export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: () => categoriesApi.getAll(),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryRequest) => categoriesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] }); toast.success('Категория создана') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}

export function useUpdateCategory(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryRequest) => categoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] }); toast.success('Категория обновлена') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] }); toast.success('Категория удалена') },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Ошибка'),
  })
}
