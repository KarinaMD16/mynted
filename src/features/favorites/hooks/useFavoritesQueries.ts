import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getMyFavorites } from '../services/favoritesService'
import type { FavoritesFilter } from '../models/favorites'

export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: (filter: FavoritesFilter) => [...favoriteKeys.lists(), filter] as const,
  savedProducts: () => [...favoriteKeys.all, 'saved-product-ids'] as const,
}

const PAGE_SIZE = 12
/** GET /favorites/me acepta hasta 50 por página. */
const MAX_PAGE_SIZE = 50
/** Tope de páginas al armar el set de ids (50 × 20 = 1000 favoritos) para no iterar sin fin. */
const MAX_PAGES = 20

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
 * Ids de los productos que el usuario tiene en favoritos. Los endpoints de
 * productos (shop, explorar, detalle) no dicen si ya es favorito, así que el
 * estado del corazón se saca de GET /favorites/me?type=products, recorriendo
 * todas sus páginas una vez y compartiendo el resultado en cache entre todas
 * las tarjetas.
 */
export function useSavedProductIds(enabled: boolean) {
  return useQuery({
    queryKey: favoriteKeys.savedProducts(),
    queryFn: async () => {
      const ids: number[] = []
      let page = 1
      let totalPages = 1
      while (page <= totalPages && page <= MAX_PAGES) {
        const result = await getMyFavorites('products', page, MAX_PAGE_SIZE)
        for (const entry of result.data) {
          if (entry.type === 'product') ids.push(entry.product.id)
        }
        totalPages = result.pagination.totalPages
        page += 1
      }
      return ids
    },
    select: toIdSet,
    enabled,
    staleTime: 1000 * 60,
  })
}
