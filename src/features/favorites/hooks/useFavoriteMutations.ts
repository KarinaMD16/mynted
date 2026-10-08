import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import { removeProductFavorite, saveProductFavorite } from '../services/favoritesService'
import type { FavoriteEntry } from '../models/favorites'
import { favoriteKeys } from './useFavoritesQueries'

type FavoritesPages = InfiniteData<PaginatedResponse<FavoriteEntry>>

/**
 * Guardar / quitar un producto de favoritos con actualización optimista: el
 * corazón cambia al instante y, si el backend falla, vuelve a como estaba.
 * Al quitar, además, la tarjeta sale de la pestaña Favoritos sin esperar al
 * refetch; al guardar, las listas se refrescan para que aparezca el nuevo.
 */
export function useToggleProductFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, save }: { productId: number; save: boolean }) =>
      save ? saveProductFavorite(productId) : removeProductFavorite(productId),

    onMutate: async ({ productId, save }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all })

      const previousIds = queryClient.getQueryData<number[]>(favoriteKeys.savedProducts())
      if (previousIds) {
        queryClient.setQueryData<number[]>(
          favoriteKeys.savedProducts(),
          save ? [...new Set([...previousIds, productId])] : previousIds.filter((id) => id !== productId),
        )
      }

      if (!save) {
        queryClient.setQueriesData<FavoritesPages>({ queryKey: favoriteKeys.lists() }, (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((entry) => !(entry.type === 'product' && entry.product.id === productId)),
            })),
          },
        )
      }

      return { previousIds }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousIds) queryClient.setQueryData(favoriteKeys.savedProducts(), context.previousIds)
      // Las listas ya habían quitado la tarjeta: se vuelven a pedir.
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() })
    },

    onSuccess: (_result, { save }) => {
      if (save) void queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() })
    },
  })
}
