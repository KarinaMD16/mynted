import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getMyFavoriteIds, getMyFavorites } from '../services/favoritesService'
import type { FavoritesFilter } from '../models/favorites'

export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: (filter: FavoritesFilter) => [...favoriteKeys.lists(), filter] as const,
  savedProducts: () => [...favoriteKeys.all, 'saved-product-ids'] as const,
}

const PAGE_SIZE = 12
/** Pestaña "Favoritos" del perfil: lo guardado, filtrado por tipo, con "Cargar más". */
export function useMyFavorites(filter: FavoritesFilter, enabled = true) {
  return useInfiniteQuery({
    queryKey: favoriteKeys.list(filter),
    queryFn: ({ pageParam }) => getMyFavorites(filter, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled,
  })
}

const toIdSet = (ids: number[]) => new Set(ids)

/**
 * Ids de los productos que el usuario tiene en favoritos, para pintar el
 * corazón de las tarjetas. Los listados también traen `isSaved`, pero esa
 * respuesta no cambia sola al guardar: este set se actualiza al instante (ver
 * useToggleProductFavorite) y se comparte en cache entre todas las tarjetas.
 * Se pide una sola vez con GET /favorites/me/ids.
 */
export function useSavedProductIds(enabled: boolean) {
  return useQuery({
    queryKey: favoriteKeys.savedProducts(),
    queryFn: async () => (await getMyFavoriteIds('products')).ids,
    select: toIdSet,
    enabled,
    staleTime: 1000 * 60,
  })
}
