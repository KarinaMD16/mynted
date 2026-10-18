import myntedAPI from '@/api/apiConfig'
import type { AwardedBadge, BadgeScope } from '../models/badges'

/** GET /badges?scope= — catálogo activo (awardedAt: null), para pintar también los bloqueados. */
export async function getBadgeCatalog(scope?: BadgeScope): Promise<AwardedBadge[]> {
  const { data } = await myntedAPI.get<AwardedBadge[]>('/badges', { params: scope ? { scope } : undefined })
  return data
}

/** GET /users/me/badges — badges de cuenta del usuario autenticado. */
export async function getMyBadges(): Promise<AwardedBadge[]> {
  const { data } = await myntedAPI.get<AwardedBadge[]>('/users/me/badges')
  return data
}

/** GET /users/:id/badges — badges de cuenta de un perfil público. Ordenados por rareza y fecha. */
export async function getUserBadges(userId: string): Promise<AwardedBadge[]> {
  const { data } = await myntedAPI.get<AwardedBadge[]>(`/users/${userId}/badges`)
  return data
}

/**
 * GET /community-profiles/:id/badges — badges del perfil dentro de una comunidad,
 * ganados + derivados del rol. El id es el `communityProfileId` que viene en los
 * posts. En comunidades privadas solo responde a miembros (403).
 */
export async function getCommunityProfileBadges(communityProfileId: number): Promise<AwardedBadge[]> {
  const { data } = await myntedAPI.get<AwardedBadge[]>(`/community-profiles/${communityProfileId}/badges`)
  return data
}
