import myntedAPI from '@/api/apiConfig'
import type { AuthUser, RequestSellerPayload } from '../models/auth'

/**
 * POST users/me/request-seller — el backend responde el User actualizado
 * (con role/sellerRequestStatus al día), no un Seller aparte, así que se
 * puede escribir directo en el cache de authKeys.me (ver useRequestSellerMutation).
 */
export async function requestSellerRequest(payload: RequestSellerPayload): Promise<AuthUser> {
  const { data } = await myntedAPI.post<AuthUser>('/users/me/request-seller', payload)
  return data
}
