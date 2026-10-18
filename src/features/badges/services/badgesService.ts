import myntedAPI from '@/api/apiConfig'
import type { AwardedBadge } from '../models/badges'

/** GET /users/:id/badges — badges de la cuenta, del más reciente al más antiguo. Pide sesión. */
export async function getUserBadges(userId: string): Promise<AwardedBadge[]> {
  const { data } = await myntedAPI.get<AwardedBadge[]>(`/users/${userId}/badges`)
  return data
}

/**
 * GET /community-profiles/:id/badges — badges del perfil dentro de una comunidad
 * (fundador, moderador, miembro fundador, voz de la comunidad). El id es el
 * `communityProfileId` que viene en `author` de los posts. Pide sesión.
 */
export async function getCommunityProfileBadges(communityProfileId: number): Promise<AwardedBadge[]> {
  const { data } = await myntedAPI.get<AwardedBadge[]>(`/community-profiles/${communityProfileId}/badges`)
  return data
}
