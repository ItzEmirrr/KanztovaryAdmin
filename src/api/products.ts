import { api } from './axios'
import type { BarcodeSearchResponse, Product, ProductFilters, ProductRequest, ProductsResponse } from '../types'

function buildProductFormData(data: ProductRequest, images?: File[]): FormData {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  images?.forEach((file) => formData.append('images', file))
  return formData
}

export const productsApi = {
  getAll: (filters: ProductFilters = {}) => {
    const params: Record<string, unknown> = {}
    if (filters.search)     params.search     = filters.search
    if (filters.categoryId) params.categoryId = filters.categoryId
    if (filters.brandId)    params.brandId    = filters.brandId
    if (filters.minPrice != null) params.minPrice = filters.minPrice
    if (filters.maxPrice != null) params.maxPrice = filters.maxPrice
    if (filters.inStock != null)  params.inStock  = filters.inStock
    if (filters.status)     params.status     = filters.status
    if (filters.sortBy)     params.sortBy     = filters.sortBy
    params.page = filters.page ?? 0
    params.size = filters.size ?? 12
    return api.get<ProductsResponse>('/api/v1/products', { params }).then((r) => r.data)
  },

  getById: (id: number) =>
    api.get<Product>(`/api/v1/products/${id}`).then((r) => r.data),

  create: (data: ProductRequest, images: File[], onUploadProgress?: (pct: number) => void) =>
    api.post<Product>('/api/v1/products', buildProductFormData(data, images), {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (e) => {
        if (onUploadProgress && e.total) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    }).then((r) => r.data),

  update: (id: number, data: ProductRequest, images: File[] | undefined, onUploadProgress?: (pct: number) => void) =>
    api.put<Product>(`/api/v1/products/${id}`, buildProductFormData(data, images), {
      headers: { 'Content-Type': undefined },
      onUploadProgress: (e) => {
        if (onUploadProgress && e.total) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      },
    }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/v1/products/${id}`).then((r) => r.data),

  getByBarcode: (code: string) =>
    api.get<BarcodeSearchResponse>(`/api/v1/products/barcode/${encodeURIComponent(code)}`).then((r) => r.data),
}
