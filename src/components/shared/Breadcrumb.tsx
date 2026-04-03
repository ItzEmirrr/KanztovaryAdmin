import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-6" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-slate-600" />}
          {item.href && i < items.length - 1 ? (
            <Link
              to={item.href}
              className="text-slate-500 hover:text-indigo-400 transition-colors duration-150"
            >
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-slate-200 font-medium' : 'text-slate-500'}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
