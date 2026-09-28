import myntedAPI from '@/api/apiConfig'
import type { CommunityListItem, PaginatedResponse } from '@/features/community/models/communityDTOs'
import type { AdminUser, SellerDecision, SellerRequestDetail } from '../models/admin'

/** GET /users — [Superadmin] todas las cuentas, más nuevas primero. */
export async function getAllUsers(): Promise<AdminUser[]> {
  const { data } = await myntedAPI.get<AdminUser[]>('/users')
  return data
}

/** PATCH /users/:id/deactivate — [Superadmin]. El backend no deja desactivar la propia cuenta. */
export async function deactivateUser(userId: string): Promise<void> {
  await myntedAPI.patch(`/users/${userId}/deactivate`)
}

/** PATCH /users/:id/activate — [Superadmin]. */
export async function activateUser(userId: string): Promise<void> {
  await myntedAPI.patch(`/users/${userId}/activate`)
}

/**
 * GET /users/seller-request/:id — [Superadmin] datos de la tienda y de cobro
 * de la solicitud pendiente de ese usuario. Responde 404 si ya no está pendiente.
 */
export async function getSellerRequest(userId: string): Promise<SellerRequestDetail> {
  const { data } = await myntedAPI.get<SellerRequestDetail>(`/users/seller-request/${userId}`)
  return data
}

/** PATCH /users/:id/seller-status — [Superadmin] aprobar o rechazar una solicitud pendiente. */
export async function updateSellerStatus(userId: string, status: SellerDecision): Promise<void> {
  await myntedAPI.patch(`/users/${userId}/seller-status`, { status })
}

/**
 * Trae todas las comunidades activas recorriendo las páginas de
 * GET /communities (el backend limita a 100 por página). El backend todavía
 * no tiene un listado de administración que incluya las inactivas, así que
 * esto es lo más completo que se puede mostrar hoy. MAX_PAGES es un tope de
 * seguridad para no quedarse pidiendo páginas sin fin.
 */
const PAGE_LIMIT = 100
const MAX_PAGES = 20

export async function getAllActiveCommunities(): Promise<CommunityListItem[]> {
  const all: CommunityListItem[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data } = await myntedAPI.get<PaginatedResponse<CommunityListItem>>('/communities', {
      params: { page, limit: PAGE_LIMIT },
    })
    all.push(...data.data)
    if (page >= data.pagination.totalPages) break
  }
  return all
}
