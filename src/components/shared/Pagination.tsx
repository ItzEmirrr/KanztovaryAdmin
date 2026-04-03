import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10
                   text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30
                   disabled:cursor-not-allowed transition-all duration-150"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-500 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${p === page
                          ? 'gradient-primary text-white'
                          : 'text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white'
                        }`}
          >
            {(p as number) + 1}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10
                   text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-30
                   disabled:cursor-not-allowed transition-all duration-150"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
