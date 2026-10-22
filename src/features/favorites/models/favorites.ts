import type { MyContentEntry } from '@/features/community/models/communityDTOs'

/** Filtro de GET /favorites/me (ContentType en el backend): todo, solo posts o solo productos. */
export type FavoritesFilter = 'all' | 'posts' | 'products'

export const FAVORITES_FILTERS: readonly FavoritesFilter[] = ['all', 'posts', 'products']

/** Mismo formato que GET /posts/me: posts y productos, cada uno con su tarjeta. */
export type FavoriteEntry = MyContentEntry

/**
 * Avisos de un producto guardado (tarea 1044): notificación si cambia el
 * precio final, o si deja de estar disponible / vuelve. Por defecto, apagados.
 */
export interface FavoriteAlerts {
  notifyPrice: boolean
  notifyAvailability: boolean
}

/** Respuesta de PUT/PATCH/DELETE products/:id/favorite (en productos trae también los avisos). */
export interface FavoriteToggleResult extends Partial<FavoriteAlerts> {
  itemId: number
  itemType: 'POST' | 'PRODUCT' | 'REPLY'
  isSaved: boolean
}

/** Un producto guardado con sus avisos (`items` de GET /favorites/me/ids?type=products). */
export interface SavedProductItem extends FavoriteAlerts {
  id: number
}

/** Respuesta de GET /favorites/me/ids: solo los ids guardados, para pintar los corazones. */
export interface FavoriteIdsResult {
  type: 'products' | 'posts'
  ids: number[]
  /** Solo con type=products. */
  items?: SavedProductItem[]
}
