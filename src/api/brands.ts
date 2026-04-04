import { api } from './axios'
import type { BrandDto, BrandRequest } from '../types'

export const brandsApi = {
  getAll: () =>
    api.get<BrandDto[]>('/api/v1/brands').then((r) => r.data),

  getById: (id: number) =>
    api.get<BrandDto>(`/api/v1/brands/${id}`).then((r) => r.data),

  create: (data: BrandRequest) =>
    api.post<BrandDto>('/api/v1/brands', data).then((r) => r.data),

  update: (id: number, data: BrandRequest) =>
    api.put<BrandDto>(`/api/v1/brands/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/v1/brands/${id}`).then((r) => r.data),
}
