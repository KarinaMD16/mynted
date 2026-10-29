/**
 * Miembros y bloqueos de una comunidad, tal como los ve su equipo (dueño,
 * moderadores y superadmin). Ver docs/frontend-moderation-reports-api.md del
 * backend.
 */

export type CommunityMemberRole = 'member' | 'moderator' | 'owner'

/** GET /communities/:id/members. `communityProfileId` es el que piden moderadores, expulsar y transferir. */
export interface CommunityMember {
  communityProfileId: number
  userId: string
  username: string
  displayName: string
  photoUrl: string | null
  role: CommunityMemberRole
  joinedAt: string
  /** Incluyen lo oculto: es el historial de la persona en la comunidad. */
  postCount: number
  replyCount: number
  hiddenContentCount: number
}

export interface CommunityMembersQuery {
  page: number
  limit: number
  role?: CommunityMemberRole
  /** Parcial, por username o displayName. */
  search?: string
}

/** GET /communities/:id/bans. Bloquear también saca de la comunidad. */
export interface CommunityBan {
  banId: number
  userId: string
  username: string | null
  displayName: string | null
  photoUrl: string | null
  reason: string
  bannedAt: string
  bannedBy: { userId: string; username: string | null }
}

export interface CommunityBansQuery {
  page: number
  limit: number
  search?: string
}

export interface Paginated<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
