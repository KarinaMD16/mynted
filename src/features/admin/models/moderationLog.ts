/**
 * Registro de acciones de moderación (GET /moderation-log, solo superadmin).
 *
 * Es histórico y solo se agrega: nada se edita ni se borra, así que sirve para
 * responder "quién hizo esto y cuándo" aunque el contenido ya no exista.
 */

/** Las 18 acciones que el backend registra (`MODERATION_ACTIONS`). */
export const MODERATION_ACTIONS = [
  'content_hidden',
  'content_restored',
  'report_resolved',
  'report_dismissed',
  'author_warned',
  'user_deactivated',
  'user_reactivated',
  'user_soft_deleted',
  'seller_revoked',
  'seller_restored',
  'product_deactivated',
  'product_activated',
  'product_soft_deleted',
  'community_deactivated',
  'community_activated',
  'community_made_public',
  'community_made_private',
  'community_soft_deleted',
] as const

export type ModerationActionType = (typeof MODERATION_ACTIONS)[number]

/** Sobre qué se actuó (`MODERATION_TARGET_TYPES`). */
export type ModerationTargetType =
  | 'report'
  | 'post'
  | 'reply'
  | 'product'
  | 'user'
  | 'seller'
  | 'community'
  | 'conversation'

export interface ModerationActor {
  id: string
  username: string
  photoUrl: string | null
  role: string
}

export interface ModerationLogEntry {
  id: number
  /** Puede ser una acción que el frontend todavía no conozca. */
  action: ModerationActionType | string
  targetType: ModerationTargetType | string
  /** Siempre llega como texto, aunque el objetivo tenga id numérico. */
  targetId: string
  reason: string | null
  communityId: number | null
  createdAt: string
  actor: ModerationActor
}

export interface ModerationLogPage {
  data: ModerationLogEntry[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
