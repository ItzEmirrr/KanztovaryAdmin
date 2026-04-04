import { api } from './axios'
import type { CategoryDto, CategoryRequest } from '../types'

export const categoriesApi = {
  getAll: () =>
    api.get<CategoryDto[]>('/api/v1/categories').then((r) => r.data),

  getById: (id: number) =>
    api.get<CategoryDto>(`/api/v1/categories/${id}`).then((r) => r.data),

  create: (data: CategoryRequest) =>
    api.post<CategoryDto>('/api/v1/categories', data).then((r) => r.data),

  update: (id: number, data: CategoryRequest) =>
    api.put<CategoryDto>(`/api/v1/categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/v1/categories/${id}`).then((r) => r.data),
}
