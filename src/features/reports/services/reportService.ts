import myntedAPI from '@/api/apiConfig'
import type {
  CreateReportPayload,
  Report,
  ReportFilters,
  ReportPage,
  ResolveReportPayload,
} from '../models/report'
import type { ModerationItemType, ModerationStats } from '../models/moderation'

/**
 * GET /reports — [Superadmin] reportes de toda la plataforma, más nuevos
 * primero. `communityId` deja solo los de una comunidad; el backend no sabe
 * filtrar "los que no son de ninguna", así que eso no se ofrece.
 */
export async function getGlobalReports(filters: ReportFilters): Promise<ReportPage> {
  const { data } = await myntedAPI.get<ReportPage>('/reports', { params: filters })
  return data
}

/** GET /communities/:id/reports — lo mismo para una comunidad (moderadores). */
export async function getCommunityReports(communityId: number, filters: ReportFilters): Promise<ReportPage> {
  const { data } = await myntedAPI.get<ReportPage>(`/communities/${communityId}/reports`, { params: filters })
  return data
}

/**
 * PATCH /reports/:id/resolve — [Superadmin] cierra el reporte y, si se pide,
 * oculta el contenido y avisa a quien lo publicó.
 */
export async function resolveGlobalReport(reportId: number, payload: ResolveReportPayload): Promise<Report> {
  const { data } = await myntedAPI.patch<Report>(`/reports/${reportId}/resolve`, payload)
  return data
}

/**
 * PATCH /reports/:id/dismiss — [Superadmin] lo descarta: el contenido queda
 * como está. Es la salida para un reporte sin fundamento.
 */
export async function dismissGlobalReport(reportId: number): Promise<Report> {
  const { data } = await myntedAPI.patch<Report>(`/reports/${reportId}/dismiss`)
  return data
}

/** PATCH /communities/:id/reports/:reportId/resolve — la misma acción, en una comunidad. */
export async function resolveCommunityReport(
  communityId: number,
  reportId: number,
  payload: ResolveReportPayload,
): Promise<Report> {
  const { data } = await myntedAPI.patch<Report>(`/communities/${communityId}/reports/${reportId}/resolve`, payload)
  return data
}

/** PATCH /communities/:id/reports/:reportId/dismiss. */
export async function dismissCommunityReport(communityId: number, reportId: number): Promise<Report> {
  const { data } = await myntedAPI.patch<Report>(`/communities/${communityId}/reports/${reportId}/dismiss`)
  return data
}

/**
 * POST /reports — denunciar contenido ajeno. El backend responde 409 si esa
 * misma persona ya reportó ese contenido, 400 si es propio y 403 si se reporta
 * una conversación en la que no participa.
 */
export async function createReport(payload: CreateReportPayload): Promise<Report> {
  const { data } = await myntedAPI.post<Report>('/reports', payload)
  return data
}

/** GET /communities/:id/moderation/stats — los contadores de la cabecera. */
export async function getModerationStats(communityId: number): Promise<ModerationStats> {
  const { data } = await myntedAPI.get<ModerationStats>(`/communities/${communityId}/moderation/stats`)
  return data
}

/**
 * PATCH /communities/:id/moderation/:itemType/:itemId/restore — deshace el
 * ocultamiento de una publicación, una respuesta o un producto.
 */
export async function restoreModeratedContent(
  communityId: number,
  itemType: ModerationItemType,
  itemId: number,
): Promise<void> {
  await myntedAPI.patch(`/communities/${communityId}/moderation/${itemType}/${itemId}/restore`)
}
