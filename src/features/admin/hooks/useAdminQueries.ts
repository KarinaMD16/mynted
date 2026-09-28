import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminUser, SellerDecision } from '../models/admin'
import {
  activateUser,
  deactivateUser,
  getAllActiveCommunities,
  getAllUsers,
  getSellerRequest,
  updateSellerStatus,
} from '../services/adminService'

export const adminKeys = {
  users: ['admin', 'users'] as const,
  communities: ['admin', 'communities'] as const,
  sellerRequest: (userId: string) => ['admin', 'seller-request', userId] as const,
}

export function useSellerRequest(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.sellerRequest(userId ?? ''),
    queryFn: () => getSellerRequest(userId!),
    enabled: userId !== null,
    // Una solicitud que ya no está pendiente responde 404; no tiene sentido reintentar.
    retry: false,
  })
}

export function useAdminUsers(enabled = true) {
  return useQuery({ queryKey: adminKeys.users, queryFn: getAllUsers, enabled })
}

export function useAdminCommunities(enabled = true) {
  return useQuery({ queryKey: adminKeys.communities, queryFn: getAllActiveCommunities, enabled })
}

/**
 * Después de cada acción se actualiza el usuario en el cache al toque (para
 * que la fila cambie sin esperar) y además se vuelve a pedir la lista, por
 * si el backend cambió algo más (p. ej. el rol al aprobar un vendedor).
 */
function usePatchUserInCache() {
  const queryClient = useQueryClient()
  return (userId: string, patch: Partial<AdminUser>) => {
    queryClient.setQueryData<AdminUser[]>(adminKeys.users, (users) =>
      users?.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    )
    void queryClient.invalidateQueries({ queryKey: adminKeys.users })
  }
}

export function useSetUserActiveMutation() {
  const patchUser = usePatchUserInCache()
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      active ? activateUser(userId) : deactivateUser(userId),
    onSuccess: (_data, { userId, active }) => patchUser(userId, { isActive: active }),
  })
}

export function useSellerDecisionMutation() {
  const queryClient = useQueryClient()
  const patchUser = usePatchUserInCache()
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: SellerDecision }) =>
      updateSellerStatus(userId, status),
    onSuccess: (_data, { userId, status }) => {
      patchUser(userId, {
        sellerRequestStatus: status,
        ...(status === 'approved' ? { role: 'seller' as const } : {}),
      })
      // Ya no está pendiente: el detalle en cache quedaría desactualizado.
      queryClient.removeQueries({ queryKey: adminKeys.sellerRequest(userId) })
    },
  })
}
