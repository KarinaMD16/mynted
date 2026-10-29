import myntedAPI from '@/api/apiConfig'
import type {
  CommunityBan,
  CommunityBansQuery,
  CommunityMember,
  CommunityMembersQuery,
  Paginated,
} from '../models/communityMembers'

/** GET /communities/:id/members — dueño, moderadores y superadmin. Más recientes primero. */
export async function getCommunityMembers(communityId: number, query: CommunityMembersQuery) {
  const { data } = await myntedAPI.get<Paginated<CommunityMember>>(`/communities/${communityId}/members`, { params: query })
  return data
}

/** POST /communities/:id/moderators/:profileId — solo el dueño. */
export async function addCommunityModerator(communityId: number, profileId: number) {
  await myntedAPI.post(`/communities/${communityId}/moderators/${profileId}`)
}

/** DELETE /communities/:id/moderators/:profileId — solo el dueño. */
export async function removeCommunityModerator(communityId: number, profileId: number) {
  await myntedAPI.delete(`/communities/${communityId}/moderators/${profileId}`)
}

/**
 * DELETE /communities/:id/members/:profileId — expulsa sin borrar lo que
 * publicó. Puede volver a unirse: para que no, está el bloqueo.
 */
export async function removeCommunityMember(communityId: number, profileId: number, reason: string) {
  await myntedAPI.delete(`/communities/${communityId}/members/${profileId}`, { data: { reason } })
}

/** POST /communities/:id/bans — bloquea (y saca, si era miembro). Va por userId, no por perfil. */
export async function banCommunityUser(communityId: number, userId: string, reason: string) {
  await myntedAPI.post(`/communities/${communityId}/bans`, { userId, reason })
}

export async function getCommunityBans(communityId: number, query: CommunityBansQuery) {
  const { data } = await myntedAPI.get<Paginated<CommunityBan>>(`/communities/${communityId}/bans`, { params: query })
  return data
}

/** DELETE /communities/:id/bans/:userId — puede volver a unirse. */
export async function unbanCommunityUser(communityId: number, userId: string) {
  await myntedAPI.delete(`/communities/${communityId}/bans/${userId}`)
}

/**
 * POST /communities/:id/transfer — solo el dueño. El destino pasa a dueño y el
 * dueño anterior queda como moderador.
 */
export async function transferCommunityOwnership(communityId: number, profileId: number) {
  await myntedAPI.post(`/communities/${communityId}/transfer`, { profileId })
}
