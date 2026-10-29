/**
 * Moderación de una comunidad: lo que ven el dueño y los moderadores en
 * /communities/:slug/moderacion.
 */

/** Lo que se puede ocultar y volver a mostrar. Un chat no se oculta. */
export type ModerationItemType = 'post' | 'reply' | 'product'

/** GET /communities/:id/moderation/stats. */
export interface ModerationStats {
  pendingReports: number
  /** Resueltos hoy, no en total: sirve para ver el ritmo del equipo. */
  resolvedToday: number
  activeMembers: number
  activeModerators: number
}
