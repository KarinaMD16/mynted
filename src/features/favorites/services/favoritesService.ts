import myntedAPI from '@/api/apiConfig'
import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import type { FavoriteAlerts, FavoriteEntry, FavoriteIdsResult, FavoritesFilter, FavoriteToggleResult } from '../models/favorites'

/** GET /favorites/me — posts y productos guardados, del guardado más reciente al más antiguo. */
export async function getMyFavorites(
  type: FavoritesFilter,
  page: number,
  limit: number,
): Promise<PaginatedResponse<FavoriteEntry>> {
  const { data } = await myntedAPI.get<PaginatedResponse<FavoriteEntry>>('/favorites/me', {
    params: { type, page, limit },
  })
  return data
}

/**
 * GET /favorites/me/ids?type=products — solo los ids guardados, en una sola
 * petición. Se carga una vez al iniciar sesión para pintar los corazones de las
 * listas sin depender de `isSaved` de cada respuesta.
 */
export async function getMyFavoriteIds(type: 'products' | 'posts'): Promise<FavoriteIdsResult> {
  const { data } = await myntedAPI.get<FavoriteIdsResult>('/favorites/me/ids', { params: { type } })
  return data
}

/**
 * PUT /products/:productId/favorite — idempotente: guardar dos veces no duplica.
 * Sin `alerts` guarda sin avisos (o deja los que ya tenía); con `alerts`,
 * guarda y los activa en un paso.
 */
export async function saveProductFavorite(productId: number, alerts?: Partial<FavoriteAlerts>): Promise<FavoriteToggleResult> {
  const { data } = await myntedAPI.put<FavoriteToggleResult>(`/products/${productId}/favorite`, alerts)
  return data
}

/**
 * PATCH /products/:productId/favorite — cambia los avisos de un producto ya
 * guardado (no exige que siga activo). 404 si no está guardado; 400 sin campos.
 */
export async function updateProductFavoriteAlerts(productId: number, alerts: Partial<FavoriteAlerts>): Promise<FavoriteToggleResult> {
  const { data } = await myntedAPI.patch<FavoriteToggleResult>(`/products/${productId}/favorite`, alerts)
  return data
}

/** DELETE /products/:productId/favorite */
export async function removeProductFavorite(productId: number): Promise<FavoriteToggleResult> {
  const { data } = await myntedAPI.delete<FavoriteToggleResult>(`/products/${productId}/favorite`)
  return data
}
