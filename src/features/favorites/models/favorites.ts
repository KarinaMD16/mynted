import type { MyContentEntry } from '@/features/community/models/communityDTOs'

/** Filtro de GET /favorites/me (ContentType en el backend): todo, solo posts o solo productos. */
export type FavoritesFilter = 'all' | 'posts' | 'products'

export const FAVORITES_FILTERS: readonly FavoritesFilter[] = ['all', 'posts', 'products']

/** Mismo formato que GET /posts/me: posts y productos, cada uno con su tarjeta. */
export type FavoriteEntry = MyContentEntry

/** Respuesta de PUT/DELETE products/:id/favorite. */
export interface FavoriteToggleResult {
  itemId: number
  itemType: 'POST' | 'PRODUCT' | 'REPLY'
  isSaved: boolean
}

/** Respuesta de GET /favorites/me/ids: solo los ids guardados, para pintar los corazones. */
export interface FavoriteIdsResult {
  type: 'products' | 'posts'
  ids: number[]
}
