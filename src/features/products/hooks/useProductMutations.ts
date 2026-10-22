import { useMutation, useQueryClient } from '@tanstack/react-query'
import { favoriteKeys } from '@/features/favorites/hooks/useFavoritesQueries'
import {
  createProduct,
  createReview,
  deleteMyReview,
  deleteProduct,
  publishProduct,
  recordProductView,
  updateMyReview,
  updateProduct,
  updateProductStatus,
} from '../services/productService'
import type { CreateProductPayload, PublishedProductStatus, ReviewPayload, UpdateProductPayload } from '../models/product'

export const productKeys = {
  all: ['products'] as const,
  shop: () => [...productKeys.all, 'shop'] as const,
  detail: (productId: number) => [...productKeys.all, 'detail', productId] as const,
  recommended: (productId: number, recentIds: number[]) =>
    [...productKeys.all, 'recommended', productId, recentIds] as const,
  related: (productId: number) => [...productKeys.all, 'related', productId] as const,
  reviews: (productId: number) => [...productKeys.all, 'reviews', productId] as const,
  tag: (tagId: number) => [...productKeys.all, 'tag-info', tagId] as const,
  byTag: (tagId: number) => [...productKeys.all, 'tag', tagId] as const,
  explore: (filters: object) => [...productKeys.all, 'explore', filters] as const,
  mine: () => [...productKeys.all, 'mine'] as const,
  stats: () => [...productKeys.all, 'stats'] as const,
  dashboard: (filters: object) => [...productKeys.all, 'dashboard', filters] as const,
  community: (communityId: number) => [...productKeys.all, 'community', communityId] as const,
}

/**
 * Cualquier cambio en un producto deja desactualizados los listados que ya
 * están en cache (shop, explorar, panel del vendedor, perfil, favoritos...).
 */
function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: productKeys.all })
    void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
  }
}

export function useCreateProductMutation() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    /** `communityId: null` publica el producto sin comunidad (POST /products). */
    mutationFn: ({ communityId, payload }: { communityId: number | null; payload: CreateProductPayload }) =>
      createProduct(communityId, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateProductMutation() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: UpdateProductPayload }) =>
      updateProduct(productId, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateProductStatusMutation() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: PublishedProductStatus }) =>
      updateProductStatus(productId, status),
    onSuccess: invalidate,
  })
}

export function usePublishProductMutation() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: (productId: number) => publishProduct(productId),
    onSuccess: invalidate,
  })
}

export function useDeleteProductMutation() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: invalidate,
  })
}

/** Avisa al backend que se abrió el detalle (alimenta las recomendaciones). Falla en silencio: no es crítico. */
export function useRecordProductViewMutation() {
  return useMutation({
    mutationFn: (productId: number) => recordProductView(productId),
  })
}

// -----------------------------------------------------------------------------
// Reseñas
// -----------------------------------------------------------------------------

/** Una reseña cambia el promedio del producto y del vendedor, así que se invalida el producto entero. */
function useInvalidateReviews(productId: number) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: productKeys.reviews(productId) })
    void queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) })
    // El promedio del vendedor sale en el perfil público.
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  }
}

export function useCreateReviewMutation(productId: number) {
  const invalidate = useInvalidateReviews(productId)
  return useMutation({
    mutationFn: (payload: ReviewPayload) => createReview(productId, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateReviewMutation(productId: number) {
  const invalidate = useInvalidateReviews(productId)
  return useMutation({
    mutationFn: (payload: Partial<ReviewPayload>) => updateMyReview(productId, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteReviewMutation(productId: number) {
  const invalidate = useInvalidateReviews(productId)
  return useMutation({
    mutationFn: () => deleteMyReview(productId),
    onSuccess: invalidate,
  })
}
