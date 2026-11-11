import myntedAPI from '@/api/apiConfig'
import type { UserReputation } from '../models/reputation'

/** GET /profiles/:userId/reputation — reputación pública (funciona sin sesión). */
export async function getUserReputation(userId: string): Promise<UserReputation> {
  const { data } = await myntedAPI.get<UserReputation>(`/profiles/${userId}/reputation`)
  return data
}
