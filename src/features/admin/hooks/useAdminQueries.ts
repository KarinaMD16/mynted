import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminUser, SellerDecision } from '../models/admin'
import {
  activateCommunity,
  activateProduct,
  activateUser,
  deactivateCommunity,
  deactivateProduct,
  deactivateUser,
  deleteCommunity,
  deleteProduct,
  deleteUser,
  getAdminStats,
  getAdminUser,
  getAllCommunitiesForAdmin,
  getAllUsers,
  getAllModerationLog,
  getModerationLog,
  getPendingSellerRequests,
  getReviewedSellerRequests,
  getSellerRequest,
  updateSellerStatus,
  type ModerationLogFilters,
} from '../services/adminService'

export const adminKeys = {
  users: ['admin', 'users'] as const,
  communities: ['admin', 'communities'] as const,
  sellerRequests: ['admin', 'seller-requests'] as const,
  pendingSellerRequests: ['admin', 'seller-requests', 'pending'] as const,
  reviewedSellerRequests: ['admin', 'seller-requests', 'reviewed'] as const,
  sellerRequest: (userId: string) => ['admin', 'seller-request', userId] as const,
  stats: ['admin', 'stats'] as const,
  moderationLog: (page: number, limit: number, filters: ModerationLogFilters = {}) =>
    ['admin', 'moderation-log', page, limit, filters] as const,
  moderationLogAll: (filters: ModerationLogFilters) => ['admin', 'moderation-log', 'all', filters] as const,
  user: (userId: string) => ['admin', 'user', userId] as const,
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

/** Contadores del resumen del panel (GET /users/stats). */
export function useAdminStats(enabled = true) {
  return useQuery({ queryKey: adminKeys.stats, queryFn: getAdminStats, enabled })
}

/**
 * El usuario completo, con los productos de su tienda. Es otra consulta que la
 * del listado porque esos productos solo vienen en el detalle, y pedirlos para
 * toda la tabla sería un desperdicio.
 */
export function useAdminUser(userId: string | null) {
  return useQuery({
    queryKey: adminKeys.user(userId ?? ''),
    queryFn: () => getAdminUser(userId!),
    enabled: userId !== null,
  })
}

export function useAdminUsers(enabled = true) {
  return useQuery({ queryKey: adminKeys.users, queryFn: getAllUsers, enabled })
}

/** Solicitudes de vendedor pendientes (GET /users/seller-requests), más antiguas primero. */
export function usePendingSellerRequests(enabled = true) {
  return useQuery({ queryKey: adminKeys.pendingSellerRequests, queryFn: getPendingSellerRequests, enabled })
}

/** Solicitudes ya aprobadas o rechazadas, con los datos que se enviaron. */
export function useReviewedSellerRequests(enabled = true) {
  return useQuery({ queryKey: adminKeys.reviewedSellerRequests, queryFn: getReviewedSellerRequests, enabled })
}

export function useAdminCommunities(enabled = true) {
  return useQuery({ queryKey: adminKeys.communities, queryFn: getAllCommunitiesForAdmin, enabled })
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

/**
 * Activar o desactivar una cuenta. Desactivar exige motivo: el backend lo
 * registra como acción de moderación y se lo avisa a la persona.
 */
export function useSetUserActiveMutation() {
  const patchUser = usePatchUserInCache()
  const invalidateStats = useInvalidateStats()
  return useMutation({
    mutationFn: ({ userId, active, reason }: { userId: string; active: boolean; reason?: string }) =>
      active ? activateUser(userId) : deactivateUser(userId, reason ?? ''),
    onSuccess: (_data, { userId, active }) => {
      patchUser(userId, { isActive: active })
      invalidateStats()
    },
  })
}

/**
 * Borrado lógico de una cuenta, con motivo. Se saca de la lista en el acto en
 * vez de marcarla: para el panel deja de existir.
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  const invalidateStats = useInvalidateStats()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => deleteUser(userId, reason),
    onSuccess: (_data, { userId }) => {
      queryClient.setQueryData<AdminUser[]>(adminKeys.users, (users) => users?.filter((user) => user.id !== userId))
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      invalidateStats()
    },
  })
}

/** Los contadores del resumen cambian con casi cualquier acción de moderación. */
function useInvalidateStats() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: adminKeys.stats })
}

export function useSellerDecisionMutation() {
  const queryClient = useQueryClient()
  const patchUser = usePatchUserInCache()
  return useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: SellerDecision; reason?: string }) =>
      updateSellerStatus(userId, status, reason),
    onSuccess: (_data, { userId, status }) => {
      /* Solo se adelanta el estado de la solicitud. El rol no se toca acá
         porque el backend no lo cambia igual en los dos caminos: aprobar una
         solicitud pendiente sí pone 'seller', pero revocar y restaurar lo
         dejan como estaba. Adivinarlo mostraba un rol falso hasta recargar. */
      patchUser(userId, { sellerRequestStatus: status })
      // Ya no está pendiente: el detalle en cache quedaría desactualizado.
      queryClient.removeQueries({ queryKey: adminKeys.sellerRequest(userId) })
      // Pasa de las pendientes a las revisadas: se vuelven a pedir las dos.
      void queryClient.invalidateQueries({ queryKey: adminKeys.sellerRequests })
      void queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    },
  })
}

/**
 * Dar de baja o reactivar un producto desde el panel, con motivo. Después se
 * vuelve a pedir el detalle del usuario (ahí viven sus productos) y el
 * resumen, donde se cuentan los productos activos.
 */
export function useProductModerationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    /** `userId` no viaja al backend: sirve para saber qué detalle refrescar. */
    mutationFn: ({ productId, active, reason }: { productId: number; active: boolean; reason: string; userId: string }) =>
      active ? activateProduct(productId, reason) : deactivateProduct(productId, reason),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
      void queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    },
  })
}

/**
 * Borrado lógico de un producto desde el panel, con motivo. A diferencia de
 * darlo de baja, esto no se revierte desde acá: el producto desaparece de los
 * listados para siempre.
 */
export function useDeleteProductMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    /** `userId` no viaja al backend: dice qué detalle hay que refrescar. */
    mutationFn: ({ productId, reason }: { productId: number; reason: string; userId: string }) =>
      deleteProduct(productId, reason),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) })
      void queryClient.invalidateQueries({ queryKey: adminKeys.users })
      void queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    },
  })
}

/**
 * Las tres acciones sobre una comunidad comparten el mismo efecto en el cache,
 * así que comparten también este envoltorio. Además de la lista del panel se
 * invalida ['communities'], que es la que usan las pantallas públicas: si se
 * desactiva una comunidad desde acá, la vitrina no debería seguir mostrándola.
 */
function useCommunityActionMutation<TVars>(mutationFn: (vars: TVars) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.communities })
      void queryClient.invalidateQueries({ queryKey: ['communities'] })
      void queryClient.invalidateQueries({ queryKey: adminKeys.stats })
    },
  })
}

/** Desactivar o reactivar una comunidad. Ninguna de las dos lleva motivo. */
export function useCommunityActiveMutation() {
  return useCommunityActionMutation(({ communityId, active }: { communityId: number; active: boolean }) =>
    active ? activateCommunity(communityId) : deactivateCommunity(communityId),
  )
}

/** Borrado lógico de una comunidad, con motivo obligatorio. */
export function useDeleteCommunityMutation() {
  return useCommunityActionMutation(({ communityId, reason }: { communityId: number; reason: string }) =>
    deleteCommunity(communityId, reason),
  )
}

/** Una página del registro de moderación. */
export function useModerationLog(page: number, limit: number, filters: ModerationLogFilters = {}) {
  return useQuery({
    queryKey: adminKeys.moderationLog(page, limit, filters),
    queryFn: () => getModerationLog(page, limit, filters),
  })
}

/**
 * Cuántas acciones cumplen los filtros. Se pide una sola de tamaño 1 y se lee
 * `pagination.total`: el backend no tiene un endpoint de conteo.
 */
export function useModerationLogCount(filters: ModerationLogFilters) {
  const query = useModerationLog(1, 1, filters)
  return { ...query, data: query.data?.pagination.total }
}

/**
 * El registro completo que cumple los filtros, para la tabla de "Gestionar".
 * Al cambiar un filtro se sigue viendo el resultado anterior hasta que llega
 * el nuevo, en vez de vaciar la tabla.
 */
export function useAllModerationLog(filters: ModerationLogFilters = {}) {
  return useQuery({
    queryKey: adminKeys.moderationLogAll(filters),
    queryFn: () => getAllModerationLog(filters),
    placeholderData: keepPreviousData,
  })
}
