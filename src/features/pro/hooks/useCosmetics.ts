import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { authKeys } from '@/features/auth/hooks/useAuthMutations'
import type { AuthUser } from '@/features/auth/models/auth'
import type { EquipCosmeticsPayload, MyCosmetics } from '../models/cosmetics'
import {
  deleteCustomBanner,
  equipCosmetics,
  getCosmeticsCatalog,
  getMyCosmetics,
  uploadCustomBanner,
} from '../services/cosmeticsService'
import { invalidatePublicProfiles, proKeys } from './proKeys'

/** Catálogo de cosméticos. El backend lo cachea ~60 s; aquí se pide una vez por sesión. */
export function useCosmeticsCatalog() {
  return useQuery({
    queryKey: proKeys.cosmeticsCatalog(),
    queryFn: getCosmeticsCatalog,
    staleTime: 10 * 60 * 1000,
  })
}

export function useMyCosmetics(enabled = true) {
  return useQuery({
    queryKey: proKeys.myCosmetics(),
    queryFn: getMyCosmetics,
    enabled,
  })
}

/**
 * Guarda la respuesta (mismo cuerpo que GET /users/me/cosmetics) y la copia en
 * el usuario actual: así el header, /profile y /settings cambian al instante,
 * sin esperar a pedir /users/me de nuevo.
 */
function applyMyCosmetics(queryClient: QueryClient, data: MyCosmetics) {
  queryClient.setQueryData(proKeys.myCosmetics(), data)
  queryClient.setQueryData<AuthUser>(authKeys.me, (user) =>
    user ? { ...user, isPro: data.isPro, cosmetics: data.cosmetics } : user,
  )
  // Mi tienda y mi perfil público (si alguien los tiene abiertos en esta pestaña).
  invalidatePublicProfiles(queryClient)
}

export function useEquipCosmetics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EquipCosmeticsPayload) => equipCosmetics(payload),
    onSuccess: (data) => applyMyCosmetics(queryClient, data),
  })
}

export function useUploadCustomBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadCustomBanner(file),
    onSuccess: (data) => applyMyCosmetics(queryClient, data),
  })
}

export function useDeleteCustomBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomBanner,
    // Responde 204 sin cuerpo: se vuelve a pedir lo efectivo.
    onSuccess: async () => {
      const data = await queryClient.fetchQuery({ queryKey: proKeys.myCosmetics(), queryFn: getMyCosmetics, staleTime: 0 })
      applyMyCosmetics(queryClient, data)
    },
  })
}
