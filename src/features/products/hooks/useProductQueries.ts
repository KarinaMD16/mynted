import { useInfiniteQuery } from '@tanstack/react-query'
import { getCommunityProducts, getMyProducts } from '../services/productService'
import type { ProductPage } from '../models/product'
import { productKeys } from './useProductMutations'

const PAGE_SIZE = 12

function nextPage(last: ProductPage) {
  return last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined
}

/** Productos del vendedor autenticado (pestaña "Productos en venta" del perfil). */
export function useMyProducts(enabled = true) {
  return useInfiniteQuery({
    queryKey: productKeys.mine(),
    queryFn: ({ pageParam }) => getMyProducts(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  })
}

/** Productos activos de una comunidad (pestaña "Tienda"). */
export function useCommunityProducts(communityId: number | undefined, enabled = true) {
  return useInfiniteQuery({
    queryKey: productKeys.community(communityId ?? 0),
    queryFn: ({ pageParam }) => getCommunityProducts(communityId ?? 0, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: enabled && communityId !== undefined,
  })
}
