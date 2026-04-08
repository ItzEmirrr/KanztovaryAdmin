import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Barcode, Camera, Search, Plus, Minus, Trash2,
  ShoppingBasket, Loader2, AlertCircle, Receipt,
} from 'lucide-react'
import { api } from '../../api/axios'
import { productsApi } from '../../api/products'
import { useCreateRetailSale } from '../../hooks/useRetailSales'
import { CameraScanner } from '../../components/retail/CameraScanner'
import { SaleModal } from '../../components/retail/SaleModal'
import { Skeleton } from '../../components/shared/Skeleton'
import { getImageUrl, formatMoney } from '../../lib/utils'
import type { BarcodeSearchResponse, Product, ProductsResponse, RetailSale } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  /** unique per (product × variant): `${productId}_${variantId ?? 'base'}` */
  cartKey: string
  productId: number
  variantId: number | null
  name: string
  /** formatted variant attributes, e.g. "цвет: синий, размер: M" */
  label: string | null
  sku: string
  barcode: string | null
  price: number
  stockQuantity: number
  imageUrl: string | null
  quantity: number
}

type SearchTab = 'barcode' | 'camera' | 'manual'

const SEARCH_TABS: { key: SearchTab; label: string; Icon: typeof Barcode }[] = [
  { key: 'barcode', label: 'Сканер', Icon: Barcode },
  { key: 'camera',  label: 'Камера', Icon: Camera  },
  { key: 'manual',  label: 'Поиск',  Icon: Search  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAttrs(attrs: Record<string, string>): string {
  return Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CashRegisterPage() {
  // Search state
  const [searchTab,        setSearchTab]        = useState<SearchTab>('barcode')
  const [barcodeInput,     setBarcodeInput]     = useState('')
  const [barcodeSearching, setBarcodeSearching] = useState(false)
  const [manualQuery,      setManualQuery]      = useState('')
  const [debouncedQuery,   setDebouncedQuery]   = useState('')

  // Cart & sale
  const [cart,    setCart]    = useState<CartItem[]>([])
  const [note,    setNote]    = useState('')
  const [receipt, setReceipt] = useState<RetailSale | null>(null)

  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const barcodeTimerRef = useRef<number | null>(null)

  const createMutation = useCreateRetailSale()

  // Autofocus barcode input when switching to that tab
  useEffect(() => {
    if (searchTab === 'barcode') {
      const t = window.setTimeout(() => barcodeInputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [searchTab])

  // Debounce manual search query
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(manualQuery), 400)
    return () => clearTimeout(t)
  }, [manualQuery])

  // Manual product search
  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ['pos-search', debouncedQuery],
    queryFn: () =>
      api
        .get<ProductsResponse>('/api/v1/products', {
          params: { search: debouncedQuery, status: 'ACTIVE', size: 8 },
        })
        .then((r) => r.data),
    enabled: debouncedQuery.length >= 2,
  })
  const searchResults = searchData?.products ?? []

  // ─── Cart helpers ─────────────────────────────────────────────────────────

  /** Merge a fully-described CartItem into the cart (increment qty if already present) */
  function mergeIntoCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const qty = item.quantity ?? 1
    setCart((prev) => {
      const existing = prev.find((i) => i.cartKey === item.cartKey)
      if (existing) {
        return prev.map((i) =>
          i.cartKey === item.cartKey ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [...prev, { ...item, quantity: qty }]
    })
  }

  /** Add from manual search — no variant info, uses base product stock */
  function addToCart(product: Product) {
    mergeIntoCart({
      cartKey:       `${product.id}_base`,
      productId:     product.id,
      variantId:     null,
      name:          product.name,
      label:         null,
      sku:           product.sku,
      barcode:       product.barcode ?? null,
      price:         product.discountPrice ?? product.price,
      stockQuantity: product.stockQuantity,
      imageUrl:      product.images?.[0]?.imageUrl ?? null,
    })
  }

  /** Add from barcode scan — may point to a specific variant */
  function addBarcodeResult({ product, matchedVariantId }: BarcodeSearchResponse) {
    const variant = matchedVariantId
      ? (product.variants ?? []).find((v) => v.id === matchedVariantId) ?? null
      : null

    mergeIntoCart({
      cartKey:       variant ? `${product.id}_${variant.id}` : `${product.id}_base`,
      productId:     product.id,
      variantId:     variant?.id ?? null,
      name:          product.name,
      label:         variant && Object.keys(variant.attributes ?? {}).length > 0
                       ? formatAttrs(variant.attributes)
                       : null,
      sku:           variant?.sku ?? product.sku,
      barcode:       variant?.barcode ?? product.barcode ?? null,
      price:         variant?.effectivePrice ?? product.discountPrice ?? product.price,
      stockQuantity: variant?.stockQuantity ?? product.stockQuantity,
      imageUrl:      product.images?.[0]?.imageUrl ?? null,
    })
  }

  function setItemQty(cartKey: string, qty: number) {
    if (qty < 1) return
    setCart((prev) =>
      prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i))
    )
  }

  function removeItem(cartKey: string) {
    setCart((prev) => prev.filter((i) => i.cartKey !== cartKey))
  }

  const totalAmount   = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const stockErrorKeys = new Set(
    cart.filter((i) => i.quantity > i.stockQuantity).map((i) => i.cartKey)
  )
  const hasStockError = stockErrorKeys.size > 0

  // ─── Barcode search ───────────────────────────────────────────────────────

  async function searchByCode(code: string) {
    if (barcodeSearching) return
    setBarcodeSearching(true)
    setBarcodeInput('')
    try {
      const result = await productsApi.getByBarcode(code)
      addBarcodeResult(result)
    } catch (err: any) {
      toast.error(err.response?.status === 404 ? 'Товар не найден' : 'Ошибка поиска')
    } finally {
      setBarcodeSearching(false)
      window.setTimeout(() => barcodeInputRef.current?.focus(), 60)
    }
  }

  function handleBarcodeChange(value: string) {
    setBarcodeInput(value)
    if (barcodeTimerRef.current !== null) clearTimeout(barcodeTimerRef.current)
    barcodeTimerRef.current = window.setTimeout(() => {
      if (value.trim()) searchByCode(value.trim())
    }, 500)
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (barcodeTimerRef.current !== null) clearTimeout(barcodeTimerRef.current)
      const code = barcodeInput.trim()
      if (code) searchByCode(code)
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0 || hasStockError || createMutation.isPending) return
    try {
      const result = await createMutation.mutateAsync({
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity:  i.quantity,
        })),
        note: note.trim() || undefined,
      })
      toast.success(`Продажа #${result.id} проведена на ${formatMoney(result.totalAmount)}`)
      setReceipt(result)
      setCart([])
      setNote('')
      window.setTimeout(() => barcodeInputRef.current?.focus(), 120)
    } catch (err: any) {
      const data = err.response?.data
      if (!err.response) {
        toast.error('Ошибка соединения, попробуйте ещё раз')
      } else if (data?.code === 'NO_STOCK_SPACE') {
        toast.error(data.message ?? 'Недостаточно товара на складе')
      } else {
        toast.error(data?.message ?? 'Ошибка при проведении продажи')
      }
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══ CART — first on mobile, right on desktop ══ */}
        <div className="order-1 lg:order-2">
          <div className="glass-card flex flex-col overflow-hidden">

            {/* Cart header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
              <ShoppingBasket size={15} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-300">Корзина</h2>
              {cart.length > 0 && (
                <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                  {cart.length} поз.
                </span>
              )}
            </div>

            {/* Items */}
            <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  Корзина пуста — отсканируйте или найдите товар
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cart.map((item) => {
                    const hasErr = stockErrorKeys.has(item.cartKey)
                    return (
                      <div
                        key={item.cartKey}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          hasErr ? 'bg-red-950/30 border-l-2 border-red-500/70' : ''
                        }`}
                      >
                        {/* Thumb */}
                        <img
                          src={getImageUrl(item.imageUrl)}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#1e293b]"
                        />
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          {item.label && (
                            <p className="text-xs text-slate-400 truncate">{item.label}</p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-slate-500">{item.sku}</span>
                            <span className="text-xs text-slate-400">
                              {item.price.toLocaleString('ru-RU')} сом
                            </span>
                          </div>
                          {hasErr && (
                            <p className="flex items-center gap-1 text-xs text-red-400 mt-0.5">
                              <AlertCircle size={11} />
                              Доступно: {item.stockQuantity} шт.
                            </p>
                          )}
                        </div>
                        {/* Qty controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setItemQty(item.cartKey, item.quantity - 1)}
                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              setItemQty(item.cartKey, parseInt(e.target.value, 10) || 1)
                            }
                            className={`w-12 h-7 text-center text-sm rounded-md bg-white/5 border text-white focus:outline-none focus:ring-1 ${
                              hasErr
                                ? 'border-red-500/60 focus:ring-red-500'
                                : 'border-white/10 focus:ring-indigo-500'
                            }`}
                          />
                          <button
                            onClick={() => setItemQty(item.cartKey, item.quantity + 1)}
                            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {/* Subtotal */}
                        <p className="text-sm font-semibold text-white text-right w-24 shrink-0 whitespace-nowrap">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} сом
                        </p>
                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.cartKey)}
                          className="w-7 h-7 rounded-md hover:bg-red-500/15 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Note + Total + Submit */}
            <div className="px-5 py-4 border-t border-white/10 space-y-4">
              <div>
                <label className="label-base">
                  Заметка{' '}
                  <span className="text-slate-600 font-normal">(необязательно)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Имя покупателя, номер чека..."
                  className="input-base w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-slate-500">Итого</p>
                  <p className="text-xl font-bold text-white">{formatMoney(totalAmount)}</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || hasStockError || createMutation.isPending}
                  className="btn-primary gap-2 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Receipt size={15} />
                  )}
                  {createMutation.isPending ? 'Проводим...' : 'Провести продажу'}
                </button>
              </div>

              {hasStockError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                  <AlertCircle size={13} className="shrink-0" />
                  Количество некоторых товаров превышает остаток на складе
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ SEARCH — second on mobile, left on desktop ══ */}
        <div className="order-2 lg:order-1">
          <div className="glass-card overflow-hidden">

            {/* Tab switcher */}
            <div className="flex gap-1 p-2 border-b border-white/10">
              {SEARCH_TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setSearchTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    searchTab === key
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── Barcode tab ── */}
              {searchTab === 'barcode' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Отсканируйте штрих-код USB-сканером или введите его вручную
                  </p>
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => handleBarcodeChange(e.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder="Штрих-код или SKU..."
                      autoFocus
                      disabled={barcodeSearching}
                      className="input-base w-full pr-10 text-base font-mono tracking-widest"
                    />
                    {barcodeSearching && (
                      <Loader2
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    Нажмите Enter или подождите 0.5 с
                  </p>
                </div>
              )}

              {/* ── Camera tab ── */}
              {searchTab === 'camera' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Наведите камеру на QR-код или штрих-код. Требуется Chrome / Edge.
                  </p>
                  <CameraScanner
                    onDetected={(code) => {
                      setSearchTab('barcode')
                      searchByCode(code)
                    }}
                  />
                </div>
              )}

              {/* ── Manual search tab ── */}
              {searchTab === 'manual' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      placeholder="Название товара..."
                      className="input-base w-full pl-9"
                      autoFocus
                    />
                  </div>

                  {/* Loading skeletons */}
                  {searchFetching && (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/3"
                        >
                          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!searchFetching &&
                    debouncedQuery.length >= 2 &&
                    searchResults.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-8">
                        Товаров не найдено
                      </p>
                    )}

                  {/* Results */}
                  {!searchFetching && searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((product) => {
                        const price   = product.discountPrice ?? product.price
                        const noStock = product.stockQuantity === 0
                        return (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors"
                          >
                            <img
                              src={getImageUrl(product.images?.[0]?.imageUrl)}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#1e293b]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono text-slate-500">
                                  {product.sku}
                                </span>
                                <span className="text-xs font-semibold text-indigo-300">
                                  {price.toLocaleString('ru-RU')} сом
                                </span>
                                {noStock && (
                                  <span className="text-xs text-red-400">Нет в наличии</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              disabled={noStock}
                              title={noStock ? 'Нет в наличии' : 'Добавить в корзину'}
                              className="w-8 h-8 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Hint */}
                  {debouncedQuery.length < 2 && (
                    <p className="text-xs text-slate-600 text-center py-6">
                      Введите не менее 2 символов для поиска
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      <SaleModal
        open={receipt !== null}
        onClose={() => setReceipt(null)}
        sale={receipt}
        showPrint
      />
    </>
  )
}
