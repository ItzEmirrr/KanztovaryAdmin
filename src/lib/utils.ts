import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_BASE_URL } from '../api/axios'


export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.png'
  if (path.startsWith('http')) return path
  return API_BASE_URL + path
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim()
}

// «127500» → «127 500 сом»
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-KG').format(Math.floor(value)) + ' сом'
}

// «30.1» → «▲ +30.1%» | «▼ −5.2%» | «—»
export function formatGrowth(pct: number | null): string {
  if (pct === null) return '—'
  const sign = pct >= 0 ? '▲ +' : '▼ '
  return sign + Math.abs(pct).toFixed(1) + '%'
}

// «2026-03-17» → «17 мар»
export function formatChartDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
