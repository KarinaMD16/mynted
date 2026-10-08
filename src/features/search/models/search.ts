import type { PublicUser } from '@/features/auth/models/auth'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import type { ProductListItem } from '@/features/products/models/product'

/** Tipos de resultado de GET /search (`forums` es un alias de `posts` que no hace falta usar). */
export const SEARCH_TYPES = ['products', 'communities', 'users', 'posts'] as const
export type SearchType = (typeof SEARCH_TYPES)[number]

/** Comunidad tal como la devuelve la búsqueda (solo públicas y activas). */
export interface SearchCommunity {
  id: number
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  bannerUrl: string | null
}

export interface SearchItemByType {
  products: ProductListItem
  communities: SearchCommunity
  users: PublicUser
  posts: FeedPost
}

/** Resumen de GET /search?q= (sin type): los primeros 5 de cada tipo y su total. */
export type SearchSummary = { q: string } & {
  [K in SearchType]: { data: SearchItemByType[K][]; total: number }
}

/** GET /search?q=&type=: resultados paginados de un tipo. */
export interface SearchTypePage<T> {
  type: string
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** El backend no acepta consultas de menos de 1 carácter ni de más de 100. */
export const SEARCH_MAX_LENGTH = 100
/** Mínimo de caracteres para buscar mientras se escribe (con Enter se busca igual). */
export const SEARCH_MIN_LIVE_LENGTH = 2
