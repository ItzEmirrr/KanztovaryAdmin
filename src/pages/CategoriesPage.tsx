import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Tag, FolderOpen, Folder, Plus, Edit, Trash2,
  ChevronRight, ChevronDown, Loader2, Save, X,
} from 'lucide-react'
import {
  useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '../hooks/useCategories'
import { Breadcrumb } from '../components/shared/Breadcrumb'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { EmptyState } from '../components/shared/EmptyState'
import { Skeleton } from '../components/shared/Skeleton'
import type { CategoryDto } from '../types'
import { slugify } from '../lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string(),
  slug: z.string().min(1, 'Slug обязателен'),
  parentCategoryId: z.union([z.number(), z.null()]).optional(),
})
type FormData = z.infer<typeof schema>

interface TreeNode extends CategoryDto {
  children: TreeNode[]
}

function buildTree(categories: CategoryDto[]): TreeNode[] {
  const map: Record<number, TreeNode> = {}
  categories.forEach((c) => { map[c.id] = { ...c, children: [] } })
  const roots: TreeNode[] = []
  categories.forEach((c) => {
    if (c.parentCategoryId != null && map[c.parentCategoryId]) {
      map[c.parentCategoryId].children.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })
  return roots
}

interface TreeNodeProps {
  node: TreeNode
  depth: number
  onSelect: (cat: CategoryDto) => void
  selectedId: number | null
  onDelete: (id: number, name: string, hasChildren: boolean) => void
}

function TreeNodeItem({ node, depth, onSelect, selectedId, onDelete }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-150
          ${isSelected ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}`}
        style={{ paddingLeft: depth * 16 + 12 }}
        onClick={() => onSelect(node)}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          className={`w-4 h-4 flex items-center justify-center text-slate-500 shrink-0 ${!hasChildren ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {hasChildren
          ? <FolderOpen size={15} className={isSelected ? 'text-indigo-400' : 'text-yellow-500/70'} />
          : <Folder size={15} className={isSelected ? 'text-indigo-400' : 'text-slate-500'} />
        }
        <span className={`text-sm flex-1 ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
          {node.name}
        </span>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onSelect(node)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => onDelete(node.id, node.name, hasChildren)}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const [editingId, setEditingId] = useState<number | null>(null)
  const updateMutation = useUpdateCategory(editingId ?? 0)
  const deleteMutation = useDeleteCategory()

  const [selected, setSelected] = useState<CategoryDto | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; warn: boolean } | null>(null)

  const {
    register, handleSubmit, setValue, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', slug: '', parentCategoryId: null },
  })

  watch('name') // keep watch active for slug auto-fill

  const handleSelect = (cat: CategoryDto) => {
    setSelected(cat)
    setIsNew(false)
    setEditingId(cat.id)
    reset({
      name: cat.name,
      description: cat.description,
      slug: cat.slug,
      parentCategoryId: cat.parentCategoryId,
    })
  }

  const handleNew = () => {
    setSelected(null)
    setIsNew(true)
    setEditingId(null)
    reset({ name: '', description: '', slug: '', parentCategoryId: null })
  }

  const handleDelete = (id: number, name: string, hasChildren: boolean) => {
    setDeleteTarget({ id, name, warn: hasChildren })
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => {
          setDeleteTarget(null)
          if (selected?.id === deleteTarget.id) { setSelected(null); setIsNew(false) }
        },
      })
    }
  }

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, parentCategoryId: data.parentCategoryId ?? null } as import('../types').CategoryRequest
    if (isNew) {
      await createMutation.mutateAsync(payload)
    } else if (editingId) {
      await updateMutation.mutateAsync(payload)
    }
    setIsNew(false)
    setSelected(null)
    reset({ name: '', description: '', slug: '', parentCategoryId: null })
  }

  const tree = buildTree(categories ?? [])

  return (
    <div>
      <Breadcrumb items={[{ label: 'Категории' }]} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
            <Tag size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Категории</h1>
            <p className="text-sm text-slate-400">{categories?.length ?? 0} категорий</p>
          </div>
        </div>
        <button onClick={handleNew} className="btn-primary">
          <Plus size={16} />
          Категория
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tree */}
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Дерево категорий</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : tree.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="Нет категорий"
              description="Создайте первую категорию, чтобы организовать каталог товаров."
              action={{ label: '+ Категория', onClick: handleNew }}
            />
          ) : (
            <div className="space-y-0.5">
              {tree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  onSelect={handleSelect}
                  selectedId={selected?.id ?? null}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        {(selected || isNew) && (
          <div className="glass-card p-5 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                {isNew ? 'Новая категория' : `Редактировать: ${selected?.name}`}
              </h3>
              <button
                onClick={() => { setSelected(null); setIsNew(false) }}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label-base">Название *</label>
                <input
                  {...register('name')}
                  className="input-base"
                  placeholder="Ручки и маркеры"
                  onChange={(e) => {
                    setValue('name', e.target.value)
                    if (!selected) setValue('slug', slugify(e.target.value))
                  }}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label-base">Описание</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="input-base resize-none"
                  placeholder="Краткое описание..."
                />
              </div>

              <div>
                <label className="label-base">Slug</label>
                <input {...register('slug')} className="input-base font-mono text-sm" placeholder="ruchki-markery" />
                {errors.slug && <p className="mt-1 text-xs text-red-400">{errors.slug.message}</p>}
              </div>

              <div>
                <label className="label-base">Родительская категория</label>
                <select
                  className="input-base"
                  value={watch('parentCategoryId') ?? ''}
                  onChange={(e) => setValue('parentCategoryId', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— Корневая категория —</option>
                  {categories
                    ?.filter((c) => c.id !== selected?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {isNew ? 'Создать' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSelected(null); setIsNew(false) }}
                  className="btn-ghost"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {!selected && !isNew && categories && categories.length > 0 && (
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
            <FolderOpen size={36} className="text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">Выберите категорию для редактирования<br/>или создайте новую</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить категорию?"
        message={
          deleteTarget?.warn
            ? `Категория «${deleteTarget.name}» содержит подкатегории. Удаление может нарушить структуру каталога. Продолжить?`
            : `Вы уверены, что хотите удалить категорию «${deleteTarget?.name}»?`
        }
        confirmLabel="Удалить"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
