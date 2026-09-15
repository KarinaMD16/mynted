import myntedAPI from '@/api/apiConfig'
import type { Community } from '@/features/community/models/community'

interface PaginatedResponse<T> {
  data: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/**
 * GET /communities — catálogo de comunidades para el picker de "unirse a
 * comunidades" del onboarding.
 *
 * ⚠️ Este endpoint TODAVÍA NO EXISTE en el backend: community.controller.ts
 * solo tiene POST/PATCH sobre `communities`, sin un GET de listado (ver
 * tareas.md → módulo Comunidades → Backend → "Endpoint de listado de
 * comunidades con búsqueda y filtros", que sigue pendiente). Se implementa
 * acá con el mismo contrato paginado que ya usan `/categories` y `/tags`
 * (`{ data, pagination }`) para que sea un simple "wire up" apenas se agregue
 * del lado del backend. Hasta entonces, este paso del onboarding va a
 * mostrarse en estado de error (ver CommunitiesStep → communitiesQuery.isError).
 */
export async function getCommunitiesRequest(): Promise<Community[]> {
  const { data } = await myntedAPI.get<PaginatedResponse<Community>>('/communities', {
    params: { limit: 100 },
  })
  return data.data
}

export interface JoinCommunitiesPayload {
  communityIds: number[]
}

/**
 * POST /users/me/communities — une al usuario a las comunidades elegidas en
 * el onboarding (0 ids para "Omitir por ahora"). Requiere sesión (cookie JWT).
 */
export async function joinCommunitiesRequest(payload: JoinCommunitiesPayload): Promise<void> {
  await myntedAPI.post('/users/me/communities', payload)
}
