import { useState } from 'react'
import { Eye, Trash2, ChevronLeft, ChevronRight, Filter, X, Receipt, Banknote, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRetailSales, useDeleteRetailSale, useRetailSalesSummary } from '../../hooks/useRetailSales'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { SaleModal } from '../../components/retail/SaleModal'
import { TableSkeleton, Skeleton } from '../../components/shared/Skeleton'
import { formatDate, formatMoney } from '../../lib/utils'

export function SalesHistoryPage() {
  // Filter inputs (not yet applied)
  const [fromInput, setFromInput] = useState('')
  const [toInput,   setToInput]   = useState('')
  // Applied filters
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo,   setAppliedTo]   = useState('')
  // Pagination
  const [page, setPage] = useState(0)
  // Modals
  const [detailId,  setDetailId]  = useState<number | null>(null)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')

  const summaryParams = {
    from: appliedFrom || undefined,
    to:   appliedTo   || undefined,
  }

  const { data: summary, isLoading: summaryLoading } = useRetailSalesSummary(summaryParams)

  const { data, isLoading, isError } = useRetailSales({
    ...summaryParams,
    page,
    size: 20,
  })

  const deleteMutation = useDeleteRetailSale()

  function applyFilters() {
    setPage(0)
    setAppliedFrom(fromInput)
    setAppliedTo(toInput)
  }

  function resetFilters() {
    setFromInput('')
    setToInput('')
    setAppliedFrom('')
    setAppliedTo('')
    setPage(0)
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Продажа удалена, склад восстановлен')
    } catch {
      toast.error('Не удалось удалить продажу')
    } finally {
      setDeleteId(null)
    }
  }

  const sales        = data?.sales ?? []
  const totalPages   = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0
  const pageTotal    = sales.reduce((s, r) => s + r.totalAmount, 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label-base">Дата с</label>
          <input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="input-base w-40"
          />
        </div>
        <div>
          <label className="label-base">Дата по</label>
          <input
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="input-base w-40"
          />
        </div>
        <button onClick={applyFilters} className="btn-primary gap-2">
          <Filter size={14} />
          Применить
        </button>
        {(appliedFrom || appliedTo) && (
          <button onClick={resetFilters} className="btn-ghost gap-2">
            <X size={14} />
            Сбросить
          </button>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Продаж */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
            <Receipt size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Продаж</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-2xl font-bold text-white leading-none">
                {summary?.totalSales ?? 0}
              </p>
            )}
          </div>
        </div>

        {/* Выручка */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Banknote size={18} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Выручка</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <p className="text-xl font-bold text-white leading-none truncate">
                {formatMoney(summary?.totalRevenue ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Средний чек */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Средний чек</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <p className="text-xl font-bold text-white leading-none truncate">
                {formatMoney(summary?.averageReceipt ?? 0)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : isError ? (
          <div className="py-10 text-center text-red-400 text-sm">
            Не удалось загрузить историю продаж
          </div>
        ) : sales.length === 0 ? (
          <div className="py-14 text-center text-slate-500 text-sm">Продаж не найдено</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-white/5">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-mono text-slate-400">#{sale.id}</span>
                      <span className="text-xs text-slate-500">{formatDate(sale.createdAt)}</span>
                    </div>
                    <p className="text-base font-semibold text-white">{formatMoney(sale.totalAmount)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {sale.adminUsername} · {(sale.items ?? []).length} поз.
                    </p>
                    {sale.note && (
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{sale.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setDetailId(sale.id)}
                      className="w-9 h-9 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-colors"
                      title="Детали"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => { setDeleteId(sale.id); setDeleteName(`#${sale.id}`) }}
                      className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                      title="Удалить"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['#', 'Дата и время', 'Администратор', 'Позиций', 'Сумма', 'Заметка', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, i) => (
                    <tr key={sale.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#131e35]'}`}>
                      <td className="px-4 py-3 text-sm font-mono text-slate-400">#{sale.id}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-slate-200">{sale.adminUsername}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{(sale.items ?? []).length} поз.</td>
                      <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">{formatMoney(sale.totalAmount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{sale.note ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setDetailId(sale.id)}
                            className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-colors"
                            title="Детали"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => { setDeleteId(sale.id); setDeleteName(`#${sale.id}`) }}
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                            title="Удалить"
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
          </>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-xs text-slate-500">
              Страница {page + 1} из {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <SaleModal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        fetchId={detailId}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        title={`Удалить продажу ${deleteName}?`}
        message="Товары будут возвращены на склад. Это действие нельзя отменить."
        confirmLabel="Удалить"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
