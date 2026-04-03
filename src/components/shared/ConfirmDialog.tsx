import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card p-6 w-full max-w-md shadow-2xl fade-in">
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-yellow-400'} />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm">Отмена</button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-150 ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'gradient-primary hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
