import type { TranslationKey } from '@/i18n/translations/es'

/**
 * Reportes de contenido (módulo `reports` del backend).
 *
 * Los mismos tipos sirven para los dos listados: el global del panel de
 * administración (`GET /reports`) y el de una comunidad
 * (`GET /communities/:id/reports`). La única diferencia es que el global
 * agrega la comunidad de cada reporte, porque ahí hay que poder ubicarlos.
 */

/** Qué se reportó. */
export type ReportItemType = 'post' | 'reply' | 'product' | 'conversation' | 'community'

/**
 * Qué deja hacer el backend al resolver, según lo reportado
 * (`reports.service.ts`, `resolveReportInternal`):
 *
 * - una conversación no se puede ocultar;
 * - una comunidad no se puede ocultar ni tiene un autor único al que avisar;
 *   se cierra solo con una nota (o se descarta).
 *
 * Mandar una acción que no corresponde es un 400, así que el diálogo ni la
 * ofrece.
 */
export function canHideContent(itemType: ReportItemType): boolean {
  return itemType !== 'conversation' && itemType !== 'community'
}

export function canWarnAuthor(itemType: ReportItemType): boolean {
  return itemType !== 'community'
}

/** Por qué se reportó (lo elige quien denuncia). */
export type ReportReason =
  | 'spam'
  | 'fake_product'
  | 'offensive_language'
  | 'harassment'
  | 'inappropriate_content'
  | 'other'

export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

/** Un pedazo del contenido reportado, para no tener que abrirlo. */
export interface ReportExcerpt {
  title: string | null
  text: string | null
}

/** La comunidad donde ocurrió. Solo viene en el listado global. */
export interface ReportCommunity {
  id: number
  name: string
  slug: string
  /** Si la comunidad fue dada de baja, el enlace ya no lleva a ningún lado. */
  deletedAt: string | null
}

export interface Report {
  id: number
  reason: ReportReason
  status: ReportStatus
  itemType: ReportItemType
  /** Id del contenido reportado, según `itemType`. */
  itemId: number
  excerpt: ReportExcerpt | null
  /**
   * El contenido ya no está (lo borraron o se ocultó). El reporte se conserva
   * igual: hay que poder resolverlo aunque el contenido haya desaparecido.
   */
  contentUnavailable: boolean
  /** Solo en el listado global; `null` cuando el reporte no es de una comunidad. */
  communityId?: number | null
  community?: ReportCommunity | null
  createdAt: string
}

/** Cuántos hay de cada estado, para las pestañas y los contadores. */
export interface ReportCounts {
  pending: number
  resolved: number
  dismissed: number
}

export interface ReportPage {
  data: Report[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  counts: ReportCounts
}

export interface ReportFilters {
  status?: ReportStatus
  itemType?: ReportItemType
  /** Solo el listado global. El backend no sabe filtrar "sin comunidad". */
  communityId?: number
  page?: number
  limit?: number
}

/**
 * Qué hacer al resolver un reporte. Los tres campos son opcionales: resolver
 * sin ninguno es decir "lo miré y queda cerrado" sin tocar el contenido.
 */
export interface ResolveReportPayload {
  /** Ocultar el contenido reportado. */
  hideContent?: boolean
  /** Avisarle a quien lo publicó. */
  warnAuthor?: boolean
  /** Nota interna, solo para el equipo. */
  note?: string
}

/**
 * Lo que manda quien reporta. `description` es opcional y el backend la
 * recorta; si queda vacía no se envía, porque rechaza una cadena vacía.
 */
export interface CreateReportPayload {
  itemType: ReportItemType
  itemId: number
  reason: ReportReason
  description?: string
}

/** Cómo se nombra cada razón (la tarjeta y el diálogo de resolver). */
export const REPORT_REASON_LABEL: Record<ReportReason, TranslationKey> = {
  spam: 'reports.reason.spam',
  fake_product: 'reports.reason.fakeProduct',
  offensive_language: 'reports.reason.offensiveLanguage',
  harassment: 'reports.reason.harassment',
  inappropriate_content: 'reports.reason.inappropriateContent',
  other: 'reports.reason.other',
}

/** Cómo se nombra cada tipo de contenido reportado. */
export const REPORT_ITEM_LABEL: Record<ReportItemType, TranslationKey> = {
  post: 'reports.item.post',
  reply: 'reports.item.reply',
  product: 'reports.item.product',
  conversation: 'reports.item.conversation',
  community: 'reports.item.community',
}

/** Las seis razones, en el orden en que se ofrecen. */
export const REPORT_REASONS: readonly ReportReason[] = [
  'spam',
  'fake_product',
  'offensive_language',
  'harassment',
  'inappropriate_content',
  'other',
]
