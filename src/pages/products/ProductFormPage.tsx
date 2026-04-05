import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Package, Plus, X,
  Loader2, Info, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useBrands } from '../../hooks/useBrands'
import { Breadcrumb } from '../../components/shared/Breadcrumb'
import { ImageUploader } from '../../components/products/ImageUploader'

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен'),
  barcode: z.string().optional().nullable(),
  price: z.union([z.number().positive(), z.literal(''), z.null()]).optional(),
  stockQuantity: z.number().min(0),
  attributes: z.array(z.object({ key: z.string(), value: z.string() })),
})

const schema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string(),
  price: z.number({ invalid_type_error: 'Введите число' }).positive('Цена должна быть > 0'),
  discountPrice: z.union([z.number().min(0), z.null()]).optional(),
  sku: z.string().min(1, 'SKU обязателен').max(100, 'Максимум 100 символов'),
  barcode: z.string().max(128, 'Максимум 128 символов').optional().nullable(),
  stockQuantity: z.number().min(0, 'Остаток ≥ 0'),
  brandId: z.union([z.number(), z.null()]).optional(),
  categoryIds: z.array(z.number()).min(1, 'Выберите хотя бы одну категорию'),
  variants: z.array(variantSchema),
})

type FormData = z.infer<typeof schema>

export function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== 'new' && !!id
  const productId = isEdit ? Number(id) : 0

  const { data: product, isLoading: productLoading } = useProduct(productId)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct(productId)

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [progress, setProgress] = useState(0)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', price: 0, discountPrice: null,
      sku: '', barcode: null, stockQuantity: 0, brandId: null, categoryIds: [], variants: [],
    },
  })

  const { fields: variants, append: appendVariant, remove: removeVariant } = useFieldArray({
    control, name: 'variants',
  })

  useEffect(() => {
    if (product && isEdit) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        sku: product.sku,
        barcode: product.barcode ?? null,
        stockQuantity: product.stockQuantity,
        brandId: product.brand?.id ?? null,
        categoryIds: product.categories.map((c) => c.id),
        variants: product.variants.map((v) => ({
          sku: v.sku,
          barcode: v.barcode ?? null,
          price: v.price ?? null,
          stockQuantity: v.stockQuantity,
          attributes: Object.entries(v.attributes).map(([key, value]) => ({ key, value })),
        })),
      })
    }
  }, [product, isEdit, reset])

  const selectedCategoryIds = watch('categoryIds') ?? []

  const toggleCategory = (catId: number) => {
    const current = selectedCategoryIds
    if (current.includes(catId)) {
      setValue('categoryIds', current.filter((c: number) => c !== catId), { shouldValidate: true })
    } else {
      setValue('categoryIds', [...current, catId], { shouldValidate: true })
    }
  }

  const onSubmit = async (data: FormData) => {
    const productData = {
      name: data.name,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice ?? null,
      sku: data.sku,
      barcode: data.barcode || null,
      stockQuantity: data.stockQuantity,
      brandId: data.brandId ?? null,
      categoryIds: data.categoryIds,
      variants: data.variants.map((v: { sku: string; barcode?: string | null; price: number | null | undefined | ''; stockQuantity: number; attributes: { key: string; value: string }[] }) => ({
        sku: v.sku,
        barcode: v.barcode || null,
        price: v.price || null,
        stockQuantity: v.stockQuantity,
        attributes: Object.fromEntries(v.attributes.map((a: { key: string; value: string }) => [a.key, a.value])),
      })),
    }

    const onProgress = (pct: number) => setProgress(pct)

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          data: productData as any,
          images: selectedImages.length > 0 ? selectedImages : undefined,
          onProgress,
        })
      } else {
        await createMutation.mutateAsync({
          data: productData as any,
          images: selectedImages,
          onProgress,
        })
      }
      navigate('/products')
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Ошибка при сохранении')
    } finally {
      setProgress(0)
    }
  }

  const uploading = progress > 0 && progress < 100

  if (isEdit && productLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Товары', href: '/products' },
        { label: isEdit ? 'Редактировать' : 'Новый товар' },
      ]} />

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <Package size={20} className="text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? 'Редактировать товар' : 'Новый товар'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — 60% */}
          <div className="lg:col-span-3 space-y-5">
            {/* Name */}
            <div className="glass-card p-5">
              <label className="label-base">Название *</label>
              <input {...register('name')} className="input-base text-base" placeholder="Ручка гелевая Pilot..." />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div className="glass-card p-5">
              <label className="label-base">Описание</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-base resize-none"
                placeholder="Описание товара..."
              />
            </div>

            {/* SKU + Barcode + Stock */}
            <div className="glass-card p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="label-base mb-0">SKU *</label>
                    <span title="Уникальный артикул товара">
                      <Info size={12} className="text-slate-500" />
                    </span>
                  </div>
                  <input
                    {...register('sku')}
                    className="input-base font-mono text-sm"
                    placeholder="ART-001"
                  />
                  {errors.sku && <p className="mt-1 text-xs text-red-400">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="label-base">Штрих-код</label>
                  <input
                    {...register('barcode')}
                    className="input-base font-mono text-sm"
                    placeholder="4600000000000"
                  />
                  {errors.barcode && <p className="mt-1 text-xs text-red-400">{errors.barcode.message}</p>}
                </div>
                {/* Остаток: full-width on mobile (spans 2 cols), normal on sm+ */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-base">Остаток (шт.)</label>
                  <input
                    {...register('stockQuantity', { valueAsNumber: true })}
                    type="number"
                    min={0}
                    className="input-base"
                    placeholder="0"
                  />
                  {errors.stockQuantity && <p className="mt-1 text-xs text-red-400">{errors.stockQuantity.message}</p>}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="glass-card p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Цена * (₽)</label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min={0.01}
                    className="input-base"
                    placeholder="0.00"
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="label-base">Цена со скидкой (₽)</label>
                  <Controller
                    name="discountPrice"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        className="input-base"
                        placeholder="0.00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="glass-card p-5">
              <label className="label-base">Категории *</label>
              {errors.categoryIds && (
                <p className="mb-2 text-xs text-red-400">{errors.categoryIds.message as string}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => {
                  const selected = selectedCategoryIds.includes(cat.id)
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150
                        ${selected
                          ? 'gradient-primary text-white'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:border-indigo-500/50 hover:text-white'
                        }`}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Brand */}
            <div className="glass-card p-5">
              <label className="label-base">Бренд</label>
              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <select
                    className="input-base"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Без бренда</option>
                    {brands?.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          {/* RIGHT — 40% */}
          <div className="lg:col-span-2 space-y-5">
            {/* Images */}
            <div className="glass-card p-5">
              <label className="label-base">Изображения</label>
              <ImageUploader
                existingImages={isEdit ? product?.images : undefined}
                onChange={setSelectedImages}
              />
            </div>

            {/* Variants */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="label-base mb-0">Вариации</label>
                <button
                  type="button"
                  onClick={() => appendVariant({ sku: '', barcode: null, price: null, stockQuantity: 0, attributes: [] })}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus size={12} />
                  Добавить
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, vi) => (
                  <div key={variant.id} className="p-3 bg-[#1e293b] rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">Вариация #{vi + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeVariant(vi)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="label-base">SKU</label>
                        <input {...register(`variants.${vi}.sku`)} className="input-base font-mono text-xs" />
                      </div>
                      <div>
                        <label className="label-base">Штрих-код</label>
                        <input
                          {...register(`variants.${vi}.barcode`)}
                          className="input-base font-mono text-xs"
                          placeholder="4600000000000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="label-base">Цена</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`variants.${vi}.price`, { valueAsNumber: true })}
                          className="input-base text-xs"
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <label className="label-base">Остаток</label>
                        <input
                          type="number"
                          {...register(`variants.${vi}.stockQuantity`, { valueAsNumber: true })}
                          className="input-base text-xs"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-2">
                      {(watch(`variants.${vi}.attributes`) as { key: string; value: string }[] | undefined)?.map((_attr: { key: string; value: string }, ai: number) => (
                        <div key={ai} className="flex gap-2 items-center">
                          <input
                            {...register(`variants.${vi}.attributes.${ai}.key`)}
                            className="input-base text-xs flex-1"
                            placeholder="Ключ (напр. Цвет)"
                          />
                          <input
                            {...register(`variants.${vi}.attributes.${ai}.value`)}
                            className="input-base text-xs flex-1"
                            placeholder="Значение (напр. Синий)"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const attrs = watch(`variants.${vi}.attributes`)
                              setValue(`variants.${vi}.attributes`, (attrs as { key: string; value: string }[]).filter((_a: { key: string; value: string }, i: number) => i !== ai))
                            }}
                            className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const attrs = watch(`variants.${vi}.attributes`) ?? []
                          setValue(`variants.${vi}.attributes`, [...attrs, { key: '', value: '' }])
                        }}
                        className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                      >
                        <Plus size={11} />
                        Атрибут
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate('/products')} className="btn-ghost">
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="btn-primary"
            >
              {uploading ? (
                <><Loader2 size={15} className="animate-spin" /> Загрузка {progress}%</>
              ) : isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Сохранение...</>
              ) : (
                isEdit ? 'Сохранить изменения' : 'Создать товар'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
