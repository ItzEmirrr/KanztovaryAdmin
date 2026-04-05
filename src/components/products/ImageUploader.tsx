import { useRef, useState } from 'react'
import { ImagePlus, AlertTriangle, Trash2, Cloud, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ProductImage } from '../../types'
import { getImageUrl } from '../../lib/utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const MAX_COUNT = 10

interface ImageUploaderProps {
  existingImages?: ProductImage[]
  onChange: (files: File[]) => void
}

function validateFiles(files: File[]): boolean {
  if (files.some((f) => !ALLOWED_TYPES.includes(f.type))) {
    toast.error('Допустимые форматы: JPEG, PNG, WebP')
    return false
  }
  if (files.some((f) => f.size > MAX_SIZE)) {
    toast.error('Один или несколько файлов превышают 5 МБ')
    return false
  }
  if (files.length > MAX_COUNT) {
    toast.error('Максимум 10 изображений')
    return false
  }
  return true
}

export function ImageUploader({ existingImages = [], onChange }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    const merged = [...files, ...arr]
    if (!validateFiles(merged)) return
    setFiles(merged)
    onChange(merged)
  }

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx)
    setFiles(next)
    onChange(next)
  }

  const hasExisting = existingImages.length > 0
  const hasNew = files.length > 0

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-150 select-none
          ${dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/5'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <ImagePlus size={28} className="mx-auto mb-2 text-indigo-400/70" />
        <p className="text-sm text-slate-300">
          Перетащи файлы или <span className="text-indigo-400">нажми для выбора</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP · до 5 МБ · до 10 файлов</p>
      </div>

      {/* Previews row */}
      {(hasNew || hasExisting) && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Existing images (edit mode) */}
          {!hasNew && existingImages.map((img, idx) => (
            <div
              key={idx}
              className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-[#1e293b] border border-white/10"
            >
              <img src={getImageUrl(img.imageUrl)} alt="" className="w-full h-full object-cover" />
              {/* Main badge */}
              {img.sortOrder === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: '#78350f', color: '#fcd34d' }}>
                  Главное
                </span>
              )}
              {/* Saved badge */}
              <span className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-slate-400">
                <Cloud size={9} />
                Сохранено
              </span>
            </div>
          ))}

          {/* New files */}
          {files.map((file, idx) => (
            <div
              key={idx}
              className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-[#1e293b] border border-white/10 group"
            >
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Main badge for first new file */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: '#78350f', color: '#fcd34d' }}>
                  Главное
                </span>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/90 flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={11} className="text-white" />
              </button>
              {/* Filename overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <p className="text-[10px] text-slate-300 truncate">
                  {file.name.length > 12 ? file.name.slice(0, 12) + '…' : file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning / replace notices */}
      {hasExisting && !hasNew && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300">
            Если не выбрать новые файлы — текущие фото останутся без изменений
          </p>
        </div>
      )}

      {hasExisting && hasNew && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Trash2 size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            Текущие {existingImages.length} фото будут заменены новыми при сохранении
          </p>
        </div>
      )}
    </div>
  )
}
