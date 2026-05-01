// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  role: 'ADMIN' | 'USER'
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface CategoryDto {
  id: number
  name: string
  description: string
  slug: string
  parentCategoryId: number | null
  parentCategoryName: string | null
}

export interface CategoryRequest {
  name: string
  description: string
  slug: string
  parentCategoryId: number | null
}

// ─── Brand ───────────────────────────────────────────────────────────────────
export interface BrandDto {
  id: number
  name: string
  description: string
  logoUrl: string
  websiteUrl: string
}

export interface BrandRequest {
  name: string
  description: string
  logoUrl: string
  websiteUrl: string
}

// ─── Product ─────────────────────────────────────────────────────────────────
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED'

export interface ProductImage {
  imageUrl: string
  sortOrder: number
}

export interface ProductVariant {
  id?: number
  sku: string
  barcode?: string | null
  price?: number | null
  effectivePrice?: number       // resolved price (falls back to product.price)
  stockQuantity: number
  attributes: Record<string, string>
}

export interface BarcodeSearchResponse {
  product: Product
  matchedVariantId: number | null
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  discountPrice: number | null
  sku: string
  barcode?: string | null
  stockQuantity: number
  status: ProductStatus
  brand: BrandDto | null
  categories: CategoryDto[]
  variants: ProductVariant[]
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface ProductRequest {
  name: string
  description: string
  price: number
  discountPrice?: number | null
  sku: string
  barcode?: string | null
  stockQuantity: number
  brandId?: number | null
  categoryIds: number[]
  variants: ProductVariant[]
}

export interface ProductsResponse {
  products: Product[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface ProductFilters {
  search?: string
  categoryId?: number
  brandId?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  status?: ProductStatus | ''
  sortBy?: string
  page?: number
  size?: number
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface OrderItem {
  product: Product
  productName: string
  quantity: number
  price: number
}

export interface StatusHistoryEntry {
  previousStatus: string | null
  newStatus: string
  changedBy: string
  changedAt: string
}

export type DeliveryType = 'PICKUP' | 'DELIVERY'

export interface OrderResponse {
  id: number
  username: string
  status: OrderStatus
  totalPrice: number
  deliveryFee: number
  grandTotal: number
  deliveryType: DeliveryType
  deliveryAddress: string | null
  phoneNumber: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  statusHistory: StatusHistoryEntry[]
}

export interface OrdersResponse {
  orders: OrderResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface OrderFilters {
  status?: OrderStatus | ''
  deliveryType?: DeliveryType | ''
  from?: string
  to?: string
  userId?: number
  page?: number
  size?: number
}

// ─── File Upload ─────────────────────────────────────────────────────────────
export interface FileUploadResponse {
  url: string
}

// ─── Retail Sales ────────────────────────────────────────────────────────────
export interface RetailSaleItemRequest {
  productId: number
  variantId?: number | null
  quantity: number
}

export interface RetailSaleItemResponse {
  productId: number
  productName: string
  sku: string
  barcode: string | null
  variantId: number | null
  variantSku: string | null
  variantBarcode: string | null
  variantAttributes: Record<string, string> | null
  quantity: number
  priceAtSale: number
  subtotal: number
}

export interface RetailSale {
  id: number
  adminUsername: string
  note: string | null
  totalAmount: number
  items: RetailSaleItemResponse[]
  createdAt: string
}

export interface RetailSaleRequest {
  items: RetailSaleItemRequest[]
  note?: string
}

export interface RetailSalesResponse {
  sales: RetailSale[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface RetailSalesSummary {
  totalSales: number
  totalRevenue: number
  averageReceipt: number
  from: string
  to: string
}

// ─── KPI ─────────────────────────────────────────────────────────────────────
export type KpiPeriod = 'WEEK' | 'MONTH' | 'YEAR'

export interface KpiResponse {
  period: KpiPeriod
  periodStart: string
  periodEnd: string

  totalRevenue: number
  periodRevenue: number
  previousPeriodRevenue: number
  revenueGrowthPercent: number | null
  averageOrderValue: number
  totalDeliveryFees: number

  totalOrders: number
  periodOrders: number
  ordersByStatus: Record<'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', number>
  cancellationRate: number

  pickupCount: number
  deliveryCount: number

  topProducts: {
    productId: number
    productName: string
    productSku: string
    totalQuantity: number
    totalRevenue: number
  }[]

  lowStockProducts: {
    id: number
    name: string
    sku: string
    stockQuantity: number
  }[]
  lowStockThreshold: number

  totalCustomers: number

  revenueChart: {
    day: string
    revenue: number
    orderCount: number
  }[]
}
