import myntedAPI from '@/api/apiConfig'
import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import type { FavoriteEntry, FavoritesFilter, FavoriteToggleResult } from '../models/favorites'

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

/** PUT /products/:productId/favorite — idempotente: guardar dos veces no duplica. */
export async function saveProductFavorite(productId: number): Promise<FavoriteToggleResult> {
  const { data } = await myntedAPI.put<FavoriteToggleResult>(`/products/${productId}/favorite`)
  return data
}

/** DELETE /products/:productId/favorite */
export async function removeProductFavorite(productId: number): Promise<FavoriteToggleResult> {
  const { data } = await myntedAPI.delete<FavoriteToggleResult>(`/products/${productId}/favorite`)
  return data
}
