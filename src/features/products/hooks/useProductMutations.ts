import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '../services/productService'
import type { CreateProductPayload } from '../models/product'

export const productKeys = {
  all: ['products'] as const,
  mine: () => [...productKeys.all, 'mine'] as const,
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
