import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminKeys } from '@/features/admin/hooks/useAdminQueries'
import {
  createReport,
  dismissCommunityReport,
  dismissGlobalReport,
  getCommunityReports,
  getGlobalReports,
  getModerationStats,
  resolveCommunityReport,
  resolveGlobalReport,
  restoreModeratedContent,
} from '../services/reportService'
import type { CreateReportPayload, ReportFilters, ResolveReportPayload } from '../models/report'
import type { ModerationItemType } from '../models/moderation'

export const reportKeys = {
  all: ['reports'] as const,
  global: (filters: ReportFilters) => [...reportKeys.all, 'global', filters] as const,
  community: (communityId: number, filters: ReportFilters) =>
    [...reportKeys.all, 'community', communityId, filters] as const,
  moderationStats: (communityId: number) => [...reportKeys.all, 'moderation-stats', communityId] as const,
}

/** Reportes de toda la plataforma, filtrados y paginados (solo superadmin). */
export function useGlobalReports(filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.global(filters),
    queryFn: () => getGlobalReports(filters),
    // Al cambiar de página se sigue viendo la anterior hasta que llega la nueva.
    placeholderData: keepPreviousData,
    enabled,
  })
}

/**
 * Resolver o descartar deja desactualizados todos los listados de reportes
 * (cambian los contadores de cada estado, no solo la fila) y el resumen del
 * panel, donde se muestran los pendientes. Se invalida todo en vez de parchear
 * una fila: es una acción poco frecuente y así no queda nada viejo.
 */
function useInvalidateReports() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    void queryClient.invalidateQueries({ queryKey: adminKeys.stats })
  }
}

export function useResolveReportMutation() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: ResolveReportPayload }) =>
      resolveGlobalReport(reportId, payload),
    onSuccess: invalidate,
  })
}

export function useDismissReportMutation() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: (reportId: number) => dismissGlobalReport(reportId),
    onSuccess: invalidate,
  })
}

/** Reportes de una comunidad (dueño y moderadores). */
export function useCommunityReports(communityId: number | undefined, filters: ReportFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.community(communityId ?? 0, filters),
    queryFn: () => getCommunityReports(communityId!, filters),
    // Al cambiar de página se sigue viendo la anterior hasta que llega la nueva.
    placeholderData: keepPreviousData,
    enabled: enabled && communityId !== undefined,
  })
}

/** Contadores de la cabecera de moderación. */
export function useModerationStats(communityId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: reportKeys.moderationStats(communityId ?? 0),
    queryFn: () => getModerationStats(communityId!),
    enabled: enabled && communityId !== undefined,
  })
}

export function useResolveCommunityReportMutation(communityId: number) {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: number; payload: ResolveReportPayload }) =>
      resolveCommunityReport(communityId, reportId, payload),
    onSuccess: invalidate,
  })
}

export function useDismissCommunityReportMutation(communityId: number) {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: (reportId: number) => dismissCommunityReport(communityId, reportId),
    onSuccess: invalidate,
  })
}

/**
 * Crear un reporte no cambia nada de lo que ve quien lo manda, así que no
 * invalida listados: los únicos que verían la diferencia son los moderadores,
 * que tienen su propia pantalla.
 */
export function useCreateReportMutation() {
  return useMutation({ mutationFn: (payload: CreateReportPayload) => createReport(payload) })
}

/**
 * Volver a mostrar contenido oculto. Se invalidan las raíces de `forumKeys`,
 * `communityKeys` y `productKeys` porque el contenido reaparece en listados
 * que no se pueden enumerar desde acá (feeds, búsquedas, perfiles).
 */
export function useRestoreContentMutation(communityId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: ModerationItemType; itemId: number }) =>
      restoreModeratedContent(communityId, itemType, itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forum'] })
      void queryClient.invalidateQueries({ queryKey: ['communities'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
