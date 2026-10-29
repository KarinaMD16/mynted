import type { QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/hooks/useAuthMutations'
import { badgeKeys } from '@/features/badges/hooks/useBadgesQueries'
import { productKeys } from '@/features/products/hooks/useProductMutations'
import { storeKeys } from '@/features/stores/hooks/useStoreQueries'

/**
 * Claves de React Query de Mynted Pro. No llevan el id del usuario: al cambiar
 * de sesión se vacía todo el cache (ver clearSessionCache en useAuthMutations).
 */
export const proKeys = {
  all: ['pro'] as const,
  plans: () => [...proKeys.all, 'plans'] as const,
  subscription: () => [...proKeys.all, 'subscription'] as const,
  payments: () => [...proKeys.all, 'payments'] as const,
  cosmeticsCatalog: () => [...proKeys.all, 'cosmetics', 'catalog'] as const,
  myCosmetics: () => [...proKeys.all, 'cosmetics', 'me'] as const,
}

/**
 * Ser Pro cambia muchas pantallas a la vez: el badge y el banner del perfil,
 * los cosméticos efectivos, los destacados del vendedor y su tienda. Tras
 * pagar, cancelar o recibir un aviso de la suscripción se refresca todo eso.
 */
export function invalidateProState(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: proKeys.all })
  void queryClient.invalidateQueries({ queryKey: authKeys.me })
  void queryClient.invalidateQueries({ queryKey: badgeKeys.all })
  void queryClient.invalidateQueries({ queryKey: productKeys.all })
  void queryClient.invalidateQueries({ queryKey: storeKeys.all })
}

/** Perfiles públicos (GET /users/:id y by-username) que traen `cosmetics` de alguien. */
export function invalidatePublicProfiles(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['users'] })
  void queryClient.invalidateQueries({ queryKey: storeKeys.all })
}
