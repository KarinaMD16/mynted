import type { ProductCondition, ProductType } from '@/features/products/models/product'

/**
 * Tienda de un vendedor (docs/GUIA_TIENDA_FRONTEND.md del backend). Solo un
 * vendedor APROBADO con cuenta activa tiene tienda: para un pendiente, un
 * rechazado o una cuenta desactivada todos los endpoints responden 404.
 * Todo es público: funciona sin sesión.
 */

/**
 * Mediana del tiempo que tarda el vendedor en responder el primer mensaje de
 * un comprador (últimos 90 días). Viene `null` si tiene menos de 3
 * conversaciones respondidas. El backend lo cachea 10 minutos.
 */
export interface ResponseTime {
  medianMinutes: number
  sampleSize: number
}

/** GET /sellers/:sellerId. `sellerId` es el id numérico de la tienda, no el User.id. */
export interface SellerStore {
  sellerId: number
  /** User.id del vendedor: para su perfil (/users/:id). */
  userId: string
  displayName: string
  description: string | null
  /** La de la tienda; si está vacía, la del perfil; si tampoco, null. */
  location: string | null
  /** Foto de perfil del usuario. */
  photoUrl: string | null
  /** Siempre null por ahora (pendiente en el backend). */
  bannerUrl: string | null
  isVerified: boolean
  /** Promedio (1 decimal) de las reseñas de todos sus productos; null si no tiene. */
  ratingAverage: number | null
  reviewsCount: number
  completedSalesCount: number
  /** Activos y visibles, sin contar los de comunidades privadas. */
  activeProductsCount: number
  /** Fecha de aprobación como vendedor. Puede ser null. */
  sellerSince: string | null
  responseTime: ResponseTime | null
}

/** GET /sellers/:sellerId/tags: tags de sus productos activos, de más a menos usados. */
export interface StoreTag {
  tagId: number
  name: string
  count: number
}

/** Estados públicos: `draft` e `inactive` nunca salen (el backend responde 400). */
export const STORE_PRODUCT_STATUSES = ['active', 'sold'] as const
export type StoreProductStatus = (typeof STORE_PRODUCT_STATUSES)[number]

export const STORE_SORTS = ['recent', 'price_asc', 'price_desc'] as const
export type StoreSort = (typeof STORE_SORTS)[number]

/** Filtros de GET /sellers/:sellerId/products. Lo que no se manda usa el valor por defecto del backend. */
export interface StoreProductFilters {
  status?: StoreProductStatus
  tag?: number
  type?: ProductType
  condition?: ProductCondition
  sort?: StoreSort
}

/** Resultado de GET /search?type=stores (y bloque `stores` del resumen). */
export interface StoreSearchItem {
  sellerId: number
  userId: string
  displayName: string
  photoUrl: string | null
  location: string | null
  isVerified: boolean
  ratingAverage: number | null
  reviewsCount: number
  activeProductsCount: number
}
