import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Filter, Grid3X3, List,
  Edit, Trash2, Package, Box, ChevronDown,
} from 'lucide-react'
import { useProducts, useDeleteProduct } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useBrands } from '../../hooks/useBrands'
import { Breadcrumb } from '../../components/shared/Breadcrumb'
import { getImageUrl } from '../../lib/utils'
import { ProductStatusBadge } from '../../components/shared/StatusBadge'
import { Pagination } from '../../components/shared/Pagination'
import { CardSkeleton, TableSkeleton } from '../../components/shared/Skeleton'
import { EmptyState } from '../../components/shared/EmptyState'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { formatPrice, formatDate } from '../../lib/utils'
import type { ProductFilters, ProductStatus } from '../../types'

const SORT_OPTIONS = [
  { value: '', label: 'По умолчанию' },
  { value: 'PRICE_ASC', label: 'Цена ↑' },
  { value: 'PRICE_DESC', label: 'Цена ↓' },
  { value: 'NAME_ASC', label: 'Название A-Z' },
  { value: 'NAME_DESC', label: 'Название Z-A' },
  { value: 'NEWEST', label: 'Сначала новые' },
  { value: 'OLDEST', label: 'Сначала старые' },
]

const STATUS_OPTIONS: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'INACTIVE', label: 'Скрытые' },
  { value: 'DELETED', label: 'Удалённые' },
]

export function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteProductName, setDeleteProductName] = useState('')

  const filters: ProductFilters = {
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
    brandId: searchParams.get('brandId') ? Number(searchParams.get('brandId')) : undefined,
    status: (searchParams.get('status') as ProductStatus) || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    page: Number(searchParams.get('page') ?? 0),
    size: 12,
  }

  const { data, isLoading } = useProducts(filters)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const deleteMutation = useDeleteProduct()

  const updateFilter = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  }, [setSearchParams])

  const handleDelete = (id: number, name: string) => {
    setDeleteId(id)
    setDeleteProductName(name)
  }

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
    }
  }

  const products = data?.products ?? []
  const totalPages = data?.totalPages ?? 0
  const currentPage = filters.page ?? 0

  return (
    <div>
      <Breadcrumb items={[{ label: 'Товары' }]} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Package size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Товары</h1>
            {data && (
              <p className="text-sm text-slate-400">{data.totalElements} товаров</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="btn-ghost p-2"
            title="Переключить вид"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          </button>
          <button onClick={() => navigate('/products/new')} className="btn-primary">
            <Plus size={16} />
            Добавить товар
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="glass-card p-4 mb-5 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-base pl-9"
              placeholder="Поиск по названию..."
              value={searchParams.get('search') ?? ''}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`btn-ghost gap-2 ${filtersOpen ? 'bg-white/5 text-white' : ''}`}
          >
            <Filter size={16} />
            Фильтры
            <ChevronDown size={14} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5 fade-in">
            <div>
              <label className="label-base">Категория</label>
              <select
                className="input-base"
                value={searchParams.get('categoryId') ?? ''}
                onChange={(e) => updateFilter('categoryId', e.target.value)}
              >
                <option value="">Все категории</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Бренд</label>
              <select
                className="input-base"
                value={searchParams.get('brandId') ?? ''}
                onChange={(e) => updateFilter('brandId', e.target.value)}
              >
                <option value="">Все бренды</option>
                {brands?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Статус</label>
              <select
                className="input-base"
                value={searchParams.get('status') ?? ''}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Сортировка</label>
              <select
                className="input-base"
                value={searchParams.get('sortBy') ?? ''}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <TableSkeleton rows={8} cols={6} />
          </div>
        )
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Товаров нет"
          description="Начните наполнять каталог — добавьте первый товар в магазин."
          action={{ label: '+ Добавить товар', onClick: () => navigate('/products/new') }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass-card overflow-hidden group cursor-pointer hover:border-indigo-500/40 transition-all duration-150"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              {/* Image */}
              <div className="relative aspect-square bg-[#1e293b] overflow-hidden">
                {product.images[0] ? (
                  <img
                    src={getImageUrl(product.images.sort((a, b) => a.sortOrder - b.sortOrder)[0]?.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Box size={32} className="text-slate-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <ProductStatusBadge status={product.status} size="sm" />
                </div>
                {/* Hover buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`) }}
                    className="w-9 h-9 rounded-lg bg-indigo-500/80 flex items-center justify-center text-white hover:bg-indigo-500 transition-colors"
                    title="Редактировать"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(product.id, product.name) }}
                    className="w-9 h-9 rounded-lg bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-white truncate mb-0.5">{product.name}</p>
                <div className="mb-2">
                  <p className="text-xs font-mono text-slate-500">{product.sku}</p>
                  {product.barcode && (
                    <p className="text-xs font-mono text-slate-600">{product.barcode}</p>
                  )}
                </div>
                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  {product.discountPrice != null ? (
                    <>
                      <span className="text-sm font-bold text-emerald-400">{formatPrice(product.discountPrice)}</span>
                      <span className="text-xs text-slate-500 line-through">{formatPrice(product.price)}</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-white">{formatPrice(product.price)}</span>
                  )}
                </div>
                {/* Stock */}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Box size={12} />
                  <span>{product.stockQuantity} шт.</span>
                </div>
                {/* Categories */}
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.categories.slice(0, 2).map((c) => (
                      <span key={c.id} className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 text-xs rounded">
                        {c.name}
                      </span>
                    ))}
                    {product.categories.length > 2 && (
                      <span className="text-xs text-slate-500">+{product.categories.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table view
        <div className="glass-card overflow-hidden">

          {/* ── Mobile card list (hidden on sm+) ── */}
          <div className="sm:hidden divide-y divide-white/5">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="flex items-center gap-3 p-4 active:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-[#1e293b] overflow-hidden shrink-0">
                  {product.images[0] ? (
                    <img src={getImageUrl(product.images[0].imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Box size={16} className="text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{product.name}</p>
                  <p className="text-xs font-mono text-slate-500">{product.sku}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.discountPrice != null ? (
                      <span className="text-xs font-semibold text-emerald-400">{formatPrice(product.discountPrice)}</span>
                    ) : (
                      <span className="text-xs font-semibold text-white">{formatPrice(product.price)}</span>
                    )}
                    <ProductStatusBadge status={product.status} size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table (hidden on mobile) ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Товар', 'SKU', 'Цена', 'Остаток', 'Статус', 'Обновлён', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <tr
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className={`table-row-hover border-b border-white/5 ${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#131e35]'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#1e293b] overflow-hidden shrink-0">
                          {product.images[0] ? (
                            <img src={getImageUrl(product.images[0].imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Box size={16} className="text-slate-600" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-slate-200 font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-400 block">{product.sku}</span>
                      {product.barcode && (
                        <span className="text-xs font-mono text-slate-600 block">{product.barcode}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.discountPrice != null ? (
                        <div>
                          <span className="text-sm font-semibold text-emerald-400">{formatPrice(product.discountPrice)}</span>
                          <span className="text-xs text-slate-500 line-through ml-1">{formatPrice(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-white">{formatPrice(product.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <ProductStatusBadge status={product.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(product.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => updateFilter('page', String(p))}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Удалить товар?"
        message={`Это мягкое удаление. Товар «${deleteProductName}» получит статус DELETED и будет скрыт из каталога.`}
        confirmLabel="Удалить"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
