import { useMutation, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import { removeProductFavorite, saveProductFavorite, updateProductFavoriteAlerts } from '../services/favoritesService'
import type { FavoriteAlerts, FavoriteEntry, SavedProductItem } from '../models/favorites'
import { favoriteKeys } from './useFavoritesQueries'

type FavoritesPages = InfiniteData<PaginatedResponse<FavoriteEntry>>

function setSavedItems(queryClient: QueryClient, update: (items: SavedProductItem[]) => SavedProductItem[]) {
  queryClient.setQueryData<SavedProductItem[]>(favoriteKeys.savedProducts(), (old) => (old ? update(old) : old))
}

/**
 * Guardar / quitar un producto de favoritos con actualización optimista: el
 * corazón cambia al instante y, si el backend falla, vuelve a como estaba.
 * Al quitar, además, la tarjeta sale de la pestaña Favoritos sin esperar al
 * refetch; al guardar, las listas se refrescan para que aparezca el nuevo.
 * Un producto recién guardado arranca con los avisos apagados (como el backend).
 */
export function useToggleProductFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, save }: { productId: number; save: boolean }) =>
      save ? saveProductFavorite(productId) : removeProductFavorite(productId),

    onMutate: async ({ productId, save }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all })

      const previousItems = queryClient.getQueryData<SavedProductItem[]>(favoriteKeys.savedProducts())
      setSavedItems(queryClient, (items) =>
        save
          ? items.some((item) => item.id === productId)
            ? items
            : [...items, { id: productId, notifyPrice: false, notifyAvailability: false }]
          : items.filter((item) => item.id !== productId),
      )

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

      return { previousItems }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) queryClient.setQueryData(favoriteKeys.savedProducts(), context.previousItems)
      // Las listas ya habían quitado la tarjeta: se vuelven a pedir.
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() })
    },

    onSuccess: (result, { productId, save }) => {
      if (!save) return
      // Si ya estaba guardado, el backend conserva sus avisos: se toman de la respuesta.
      setSavedItems(queryClient, (items) =>
        items.map((item) =>
          item.id === productId
            ? {
                ...item,
                notifyPrice: result.notifyPrice ?? item.notifyPrice,
                notifyAvailability: result.notifyAvailability ?? item.notifyAvailability,
              }
            : item,
        ),
      )
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() })
    },
  })
}

/**
 * Prender / apagar los avisos de un producto guardado (PATCH), con
 * actualización optimista del interruptor. Si falla, vuelve a como estaba.
 */
export function useUpdateFavoriteAlerts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, alerts }: { productId: number; alerts: Partial<FavoriteAlerts> }) =>
      updateProductFavoriteAlerts(productId, alerts),

    onMutate: async ({ productId, alerts }) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.savedProducts() })
      const previousItems = queryClient.getQueryData<SavedProductItem[]>(favoriteKeys.savedProducts())
      setSavedItems(queryClient, (items) => items.map((item) => (item.id === productId ? { ...item, ...alerts } : item)))
      return { previousItems }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousItems) queryClient.setQueryData(favoriteKeys.savedProducts(), context.previousItems)
    },

    onSuccess: (result, { productId }) => {
      setSavedItems(queryClient, (items) =>
        items.map((item) =>
          item.id === productId
            ? {
                ...item,
                notifyPrice: result.notifyPrice ?? item.notifyPrice,
                notifyAvailability: result.notifyAvailability ?? item.notifyAvailability,
              }
            : item,
        ),
      )
    },
  })
}
