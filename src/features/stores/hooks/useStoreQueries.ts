import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { productKeys } from '@/features/products/hooks/useProductMutations'
import type { StoreProductFilters } from '../models/store'
import { getStore, getStoreProducts, getStoreTags } from '../services/storeService'

/**
 * Los productos de la tienda cuelgan de `productKeys.all`: así, cuando el
 * vendedor crea, edita o vende algo (que invalida todos los listados de
 * productos), su tienda también se refresca.
 */
export const storeKeys = {
  all: ['stores'] as const,
  detail: (sellerId: number) => [...storeKeys.all, sellerId] as const,
  tags: (sellerId: number) => [...storeKeys.all, sellerId, 'tags'] as const,
  products: (sellerId: number, filters: StoreProductFilters) => [...productKeys.all, 'store', sellerId, filters] as const,
}

const PAGE_SIZE = 12

export function useStore(sellerId: number | undefined) {
  return useQuery({
    queryKey: storeKeys.detail(sellerId ?? 0),
    queryFn: () => getStore(sellerId as number),
    enabled: sellerId !== undefined,
    // Un 404 (tienda no pública) no se va a arreglar reintentando.
    retry: false,
  })
}

export function useStoreTags(sellerId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: storeKeys.tags(sellerId ?? 0),
    queryFn: () => getStoreTags(sellerId as number),
    enabled: enabled && sellerId !== undefined,
    staleTime: 60_000,
  })
}

/** Catálogo de la tienda con scroll infinito. */
export function useStoreProducts(sellerId: number | undefined, filters: StoreProductFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: storeKeys.products(sellerId ?? 0, filters),
    queryFn: ({ pageParam }) => getStoreProducts(sellerId as number, filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: enabled && sellerId !== undefined,
  })
}
