import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct, updateProductStatus } from '../services/productService'
import type { CreateProductPayload, ProductStatus, UpdateProductPayload } from '../models/product'

export const productKeys = {
  all: ['products'] as const,
  shop: () => [...productKeys.all, 'shop'] as const,
  detail: (productId: number) => [...productKeys.all, 'detail', productId] as const,
  recommended: (productId: number) => [...productKeys.all, 'recommended', productId] as const,
  tag: (tagId: number) => [...productKeys.all, 'tag-info', tagId] as const,
  byTag: (tagId: number) => [...productKeys.all, 'tag', tagId] as const,
  explore: (filters: object) => [...productKeys.all, 'explore', filters] as const,
  mine: () => [...productKeys.all, 'mine'] as const,
  dashboard: (filters: object) => [...productKeys.all, 'dashboard', filters] as const,
  community: (communityId: number) => [...productKeys.all, 'community', communityId] as const,
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ communityId, payload }: { communityId: number; payload: CreateProductPayload }) =>
      createProduct(communityId, payload),
    // Cualquier listado de productos que ya esté en cache queda desactualizado.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: UpdateProductPayload }) =>
      updateProduct(productId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useUpdateProductStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: Exclude<ProductStatus, 'active'> }) =>
      updateProductStatus(productId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}
