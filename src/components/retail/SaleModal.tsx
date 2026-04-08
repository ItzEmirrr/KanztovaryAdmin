import { X, Printer, Loader2 } from 'lucide-react'
import { useRetailSale } from '../../hooks/useRetailSales'
import { Skeleton } from '../shared/Skeleton'
import { formatDate, formatMoney } from '../../lib/utils'
import type { RetailSale } from '../../types'

interface SaleModalProps {
  open: boolean
  onClose: () => void
  /** Pass directly after creation (receipt) */
  sale?: RetailSale | null
  /** Fetch from API (history detail) */
  fetchId?: number | null
  showPrint?: boolean
}

function SaleContent({ sale }: { sale: RetailSale }) {
  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Номер продажи</p>
          <p className="text-white font-semibold">#{sale.id}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Дата и время</p>
          <p className="text-white">{formatDate(sale.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Администратор</p>
          <p className="text-white">{sale.adminUsername}</p>
        </div>
        {sale.note && (
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Заметка</p>
            <p className="text-slate-300 text-sm">{sale.note}</p>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Товар</th>
              <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Кол-во</th>
              <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Цена</th>
              <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items ?? []).map((item, i) => (
              <tr
                key={i}
                className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#131e35]'}`}
              >
                <td className="px-3 py-2.5">
                  <p className="text-slate-200 font-medium">{item.productName}</p>
                  {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                    <p className="text-xs text-slate-400">
                      {Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </p>
                  )}
                  <p className="text-xs font-mono text-slate-500">
                    {item.variantSku ?? item.sku}
                    {(item.variantBarcode ?? item.barcode) ? ` · ${item.variantBarcode ?? item.barcode}` : ''}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-300">{item.quantity}</td>
                <td className="px-3 py-2.5 text-right text-slate-300 whitespace-nowrap">
                  {item.priceAtSale.toLocaleString('ru-RU')} сом
                </td>
                <td className="px-3 py-2.5 text-right text-white font-semibold whitespace-nowrap">
                  {item.subtotal.toLocaleString('ru-RU')} сом
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white/5 border-t border-white/10">
              <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-semibold text-slate-300">
                Итого:
              </td>
              <td className="px-3 py-2.5 text-right text-base font-bold text-white whitespace-nowrap">
                {formatMoney(sale.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function FetchedSaleContent({ id }: { id: number }) {
  const { data, isLoading, isError } = useRetailSale(id)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  if (isError || !data) {
    return (
      <p className="text-sm text-red-400 text-center py-6">
        Не удалось загрузить детали продажи
      </p>
    )
  }
  return <SaleContent sale={data} />
}

export function SaleModal({ open, onClose, sale, fetchId, showPrint = false }: SaleModalProps) {
  if (!open) return null

  const title = sale
    ? `Чек продажи #${sale.id}`
    : fetchId
    ? `Продажа #${fetchId}`
    : 'Детали продажи'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl glass-card rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {sale ? (
            <SaleContent sale={sale} />
          ) : fetchId ? (
            <FetchedSaleContent id={fetchId} />
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 shrink-0">
          {showPrint && (
            <button
              onClick={() => window.print()}
              className="btn-ghost gap-2"
            >
              <Printer size={15} />
              Распечатать
            </button>
          )}
          <button onClick={onClose} className="btn-primary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
