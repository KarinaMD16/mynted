import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  getCommunityProducts,
  getMyProducts,
  getMyProductsDashboard,
  getMyProductsStats,
  getProduct,
  getProductReviews,
  getProducts,
  getProductsByTag,
  getRecommendedProducts,
  getRelatedProducts,
  getShop,
  getTag,
} from '../services/productService'
import type { ExploreFilters, MyProductsFilters, MyProductsPage, ProductPage, ProductReviewsPage, ShopPage } from '../models/product'
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

/**
 * Pantalla Shop: secciones por tag, con scroll infinito (cada página trae unas
 * pocas secciones). Sin filtro de país: el backend con `shipTo` deja fuera los
 * productos que no indicaron a dónde envían, así que ese filtro solo se aplica
 * si la persona lo pide (ver Explorar).
 */
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

/** Detalle de un producto (público; un borrador solo lo ve su dueño). */
export function useProduct(productId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(productId ?? 0),
    queryFn: () => getProduct(productId ?? 0),
    enabled: enabled && productId !== undefined,
  })
}

/** "También te puede interesar": a partir del producto actual y de lo visto hace poco. */
export function useRecommendedProducts(productId: number | undefined, recentIds: number[], enabled = true) {
  return useQuery({
    queryKey: productKeys.recommended(productId ?? 0, recentIds),
    queryFn: () => getRecommendedProducts(productId, 4, recentIds),
    enabled: enabled && productId !== undefined,
  })
}

/** Productos relacionados: primero los que eligió el vendedor, luego los automáticos. */
export function useRelatedProducts(productId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: productKeys.related(productId ?? 0),
    queryFn: () => getRelatedProducts(productId ?? 0),
    enabled: enabled && productId !== undefined,
  })
}

const REVIEWS_PER_PAGE = 5

/** Reseñas de un producto, con "Cargar más". El resumen (promedio y total) viene en cada página. */
export function useProductReviews(productId: number | undefined, enabled = true) {
  return useInfiniteQuery({
    queryKey: productKeys.reviews(productId ?? 0),
    queryFn: ({ pageParam }) => getProductReviews(productId ?? 0, pageParam, REVIEWS_PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (last: ProductReviewsPage) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
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

/** Contadores del vendedor por estado (GET /products/me/stats). Cualquier mutación de productos los invalida. */
export function useMyProductsStats(enabled = true) {
  return useQuery({
    queryKey: productKeys.stats(),
    queryFn: getMyProductsStats,
    enabled,
  })
}

/**
 * ¿Es un producto mío? GET /products/:id no trae el dueño (solo el sellerId
 * público), así que se busca el producto por título entre los míos
 * (GET /products/me?q=). Solo se consulta si la persona es vendedora.
 * Mientras no se sepa, devuelve false.
 */
export function useIsOwnProduct(productId: number | undefined, title: string | undefined, enabled: boolean) {
  const query = useQuery({
    queryKey: [...productKeys.all, 'ownership', productId, title],
    queryFn: async () => {
      const result = await getMyProductsDashboard(1, 20, 50, { q: title })
      return result.sections.some((section) => section.products.some((product) => product.id === productId))
    },
    enabled: enabled && productId !== undefined && Boolean(title),
    staleTime: 5 * 60 * 1000,
  })
  return query.data === true
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
