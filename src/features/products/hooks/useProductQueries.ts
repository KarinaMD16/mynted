import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getCommunityProducts, getMyProducts, getProducts, getMyProductsDashboard, getProduct, getProductsByTag, getRecommendedProducts, getShop, getTag } from '../services/productService'
import type { ExploreFilters, MyProductsFilters, MyProductsPage, ProductPage, ShopPage } from '../models/product'
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

const SHOP_SECTIONS_PER_PAGE = 3
const SHOP_PRODUCTS_PER_SECTION = 4

/** Pantalla Shop: secciones por tag, con scroll infinito (cada página trae unas pocas secciones). */
export function useShopFeed() {
  return useInfiniteQuery({
    queryKey: productKeys.shop(),
    queryFn: ({ pageParam }) => getShop(pageParam, SHOP_SECTIONS_PER_PAGE, SHOP_PRODUCTS_PER_SECTION),
    initialPageParam: 1,
    getNextPageParam: (last: ShopPage) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  })
}

const TAG_PRODUCTS_PER_PAGE = 12

/** Título de la página "Ver todo" de un tag. */
export function useTag(tagId: number | undefined) {
  return useQuery({
    queryKey: productKeys.tag(tagId ?? 0),
    queryFn: () => getTag(tagId ?? 0),
    enabled: tagId !== undefined,
  })
}

/** Todos los productos activos de un tag, con scroll infinito. */
export function useTagProducts(tagId: number | undefined, enabled = true) {
  return useInfiniteQuery({
    queryKey: productKeys.byTag(tagId ?? 0),
    queryFn: ({ pageParam }) => getProductsByTag(tagId ?? 0, pageParam, TAG_PRODUCTS_PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: enabled && tagId !== undefined,
  })
}

/** Detalle de un producto. */
export function useProduct(productId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(productId ?? 0),
    queryFn: () => getProduct(productId ?? 0),
    enabled: enabled && productId !== undefined,
  })
}

/** Productos sugeridos a partir del que se está viendo. */
export function useRecommendedProducts(productId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: productKeys.recommended(productId ?? 0),
    queryFn: () => getRecommendedProducts(productId ?? 0, 4),
    enabled: enabled && productId !== undefined,
  })
}

const DASHBOARD_SECTIONS_PER_PAGE = 5
const DASHBOARD_PRODUCTS_PER_SECTION = 50

/** Panel del vendedor: sus productos agrupados por tag, con scroll infinito por secciones. */
export function useMyProductsDashboard(filters: MyProductsFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: productKeys.dashboard(filters),
    queryFn: ({ pageParam }) =>
      getMyProductsDashboard(pageParam, DASHBOARD_SECTIONS_PER_PAGE, DASHBOARD_PRODUCTS_PER_SECTION, filters),
    initialPageParam: 1,
    getNextPageParam: (last: MyProductsPage) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled,
  })
}

/** Solo el total (`totalProducts`) de los productos del vendedor con un filtro de estado. */
export function useMyProductsCount(status: MyProductsFilters['status'], enabled = true) {
  return useQuery({
    queryKey: [...productKeys.all, 'dashboard-count', status ?? 'all'],
    queryFn: () => getMyProductsDashboard(1, 1, 1, status ? { status } : {}),
    select: (data) => data.totalProducts,
    enabled,
  })
}

const EXPLORE_PAGE_SIZE = 12

/** Pantalla Explorar: productos activos filtrados, con scroll infinito. */
export function useExploreProducts(filters: ExploreFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: productKeys.explore(filters),
    queryFn: ({ pageParam }) => getProducts(filters, pageParam, EXPLORE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  })
}
