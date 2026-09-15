import myntedAPI from '@/api/apiConfig'
import type { Interest } from '../models/interests'

/** GET /interests — catálogo público de intereses/franquicias disponibles. */
export async function getInterestsRequest(): Promise<Interest[]> {
  const { data } = await myntedAPI.get<Interest[]>('/interests')
  return data
}

/**
 * POST /interests/me — guarda la selección de intereses del onboarding.
 * Requiere sesión (cookie JWT) y un mínimo de 3 ids; reemplaza la selección anterior.
 */
export async function saveInterestsRequest(interestIds: number[]): Promise<Interest[]> {
  const { data } = await myntedAPI.post<Interest[]>('/interests/me', { interestIds })
  return data
}

/** GET /interests/me — intereses ya elegidos por el usuario logueado. */
export async function getMyInterestsRequest(): Promise<Interest[]> {
  const { data } = await myntedAPI.get<Interest[]>('/interests/me')
  return data
}
