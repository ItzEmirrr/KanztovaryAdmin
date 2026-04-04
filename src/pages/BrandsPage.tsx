import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, Plus, Edit, Trash2, X, Loader2, ExternalLink,
} from 'lucide-react'
import { getImageUrl } from '../lib/utils'
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '../hooks/useBrands'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { EmptyState } from '../components/shared/EmptyState'
import { Skeleton } from '../components/shared/Skeleton'
import type { BrandDto } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string(),
  logoUrl: z.string(),
  websiteUrl: z.string(),
})
type FormData = z.infer<typeof schema>

function BrandAvatar({ brand }: { brand: BrandDto }) {
  const [imgError, setImgError] = useState(false)
  if (brand.logoUrl && !imgError) {
    return (
      <img
        src={getImageUrl(brand.logoUrl)}
        alt={brand.name}
        className="w-16 h-16 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xl">
      {brand.name[0]?.toUpperCase()}
    </div>
  )
}

interface BrandModalProps {
  brand: BrandDto | null
  onClose: () => void
}

function BrandModal({ brand, onClose }: BrandModalProps) {
  const isEdit = !!brand
  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand(brand?.id ?? 0)

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: brand?.name ?? '',
      description: brand?.description ?? '',
      logoUrl: brand?.logoUrl ?? '',
      websiteUrl: brand?.websiteUrl ?? '',
    },
  })

  const logoUrl = watch('logoUrl')
  const [logoError, setLogoError] = useState(false)

  const onSubmit = async (data: FormData) => {
    if (isEdit && brand) {
      await updateMutation.mutateAsync(data as import('../types').BrandRequest)
    } else {
      await createMutation.mutateAsync(data as import('../types').BrandRequest)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 w-full max-w-lg shadow-2xl fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? `Редактировать: ${brand.name}` : 'Новый бренд'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-base">Название *</label>
            <input {...register('name')} className="input-base" placeholder="BIC, Pilot, Staedtler..." />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label-base">Описание</label>
            <textarea {...register('description')} rows={2} className="input-base resize-none" placeholder="Краткое описание бренда..." />
          </div>

          {/* Logo URL + preview */}
          <div>
            <label className="label-base">URL логотипа</label>
            <div className="flex gap-3 items-start">
              <input
                {...register('logoUrl')}
                className="input-base flex-1"
                placeholder="https://example.com/logo.png"
                onChange={() => setLogoError(false)}
              />
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1e293b] border border-white/10 shrink-0 flex items-center justify-center">
                {logoUrl && !logoError ? (
                  <img
                    src={getImageUrl(logoUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Building2 size={18} className="text-slate-600" />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="label-base">Сайт</label>
            <input {...register('websiteUrl')} className="input-base" placeholder="https://brand.com" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
              {isEdit ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function BrandsPage() {
  const { data: brands, isLoading } = useBrands()
  const deleteMutation = useDeleteBrand()

  const [modal, setModal] = useState<BrandDto | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<BrandDto | null>(null)

  return (
    <div>
      <Breadcrumb items={[{ label: 'Бренды' }]} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Building2 size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Бренды</h1>
            <p className="text-sm text-slate-400">{brands?.length ?? 0} брендов</p>
          </div>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary">
          <Plus size={16} />
          Бренд
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : !brands?.length ? (
        <EmptyState
          icon={Building2}
          title="Брендов нет"
          description="Добавьте бренды, чтобы привязывать товары к производителям."
          action={{ label: '+ Добавить бренд', onClick: () => setModal('new') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="glass-card p-5 flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-150"
            >
              <BrandAvatar brand={brand} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm mb-0.5">{brand.name}</p>
                {brand.description && (
                  <p className="text-xs text-slate-500 truncate mb-1.5">{brand.description}</p>
                )}
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink size={10} />
                    Сайт
                  </a>
                )}
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setModal(brand)}
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(brand)}
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <BrandModal
          brand={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить бренд?"
        message={`Вы уверены, что хотите удалить бренд «${deleteTarget?.name}»? Товары этого бренда останутся, но ссылка на бренд будет удалена.`}
        confirmLabel="Удалить"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
