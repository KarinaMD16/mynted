import myntedAPI from '@/api/apiConfig'
import type { Interest } from '../models/interests'

interface PaginatedTags {
  data: Interest[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/**
 * GET /tags?isInterest=true — catálogo público de tags "principales"
 * (isInterest = true) que arma el picker de onboarding. El endpoint pagina
 * (10 por página por default), así que pedimos un limit alto para traerlos
 * todos de una vez. Si el catálogo de intereses crece más allá de eso, esto
 * necesita paginación real en el picker.
 */
export async function getInterestsRequest(): Promise<Interest[]> {
  const { data } = await myntedAPI.get<PaginatedTags>('/tags', {
    params: { isInterest: true, limit: 100 },
  })
  return data.data
}

export interface SaveInterestsPayload {
  tagIds: number[]
  /** Versión de la política de privacidad aceptada en el onboarding. */
  privacyPolicyVersion?: string
  /** Locale detectado del navegador (ej. "es-CR"). */
  locale?: string
  /** Moneda detectada del navegador (ej. "CRC"). */
  currency?: string
}

/**
 * POST /users/me/tags — guarda la selección de intereses del onboarding.
 * Requiere sesión (cookie JWT). Acepta 0 ids (flujo "Omitir por ahora") o un
 * mínimo de 3; reemplaza la selección anterior en cada guardado.
 */
export async function saveInterestsRequest(payload: SaveInterestsPayload): Promise<Interest[]> {
  const { data } = await myntedAPI.post<Interest[]>('/users/me/tags', payload)
  return data
}

/** GET /users/me/tags — intereses ya elegidos por el usuario logueado. */
export async function getMyInterestsRequest(): Promise<Interest[]> {
  const { data } = await myntedAPI.get<Interest[]>('/users/me/tags')
  return data
}
