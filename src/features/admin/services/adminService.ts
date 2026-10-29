import myntedAPI from '@/api/apiConfig'
import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import type { AdminCommunity, AdminStats, AdminUser, SellerDecision, SellerRequestDetail } from '../models/admin'
import type { ModerationLogPage } from '../models/moderationLog'

/** GET /users — [Superadmin] todas las cuentas, más nuevas primero. */
export async function getAllUsers(): Promise<AdminUser[]> {
  const { data } = await myntedAPI.get<AdminUser[]>('/users')
  return data
}

/**
 * PATCH /users/:id/deactivate — [Superadmin]. El backend no deja desactivar la
 * propia cuenta, y exige un motivo (1–500 caracteres): queda registrado en las
 * acciones de moderación y se le avisa a la persona.
 */
export async function deactivateUser(userId: string, reason: string): Promise<void> {
  await myntedAPI.patch(`/users/${userId}/deactivate`, { reason })
}

/**
 * DELETE /users/:id — [Superadmin] borrado lógico de una cuenta, con motivo.
 * No la borra de verdad: deja de aparecer y pierde el acceso, pero se conservan
 * sus compras, ventas y reseñas, que son de otras personas también.
 */
export async function deleteUser(userId: string, reason: string): Promise<void> {
  await myntedAPI.delete(`/users/${userId}`, { data: { reason } })
}

/**
 * GET /users/:id — [Superadmin] el usuario completo. A diferencia del listado,
 * trae los productos de su tienda, que es lo que se modera desde la hoja
 * lateral.
 */
export async function getAdminUser(userId: string): Promise<AdminUser> {
  const { data } = await myntedAPI.get<AdminUser>(`/users/${userId}`)
  return data
}

/**
 * PATCH /products/:id/deactivate — [Superadmin] baja administrativa de un
 * producto, con motivo. No es lo mismo que pausarlo: el vendedor no puede
 * revertirla, solo el panel.
 */
export async function deactivateProduct(productId: number, reason: string): Promise<void> {
  await myntedAPI.patch(`/products/${productId}/deactivate`, { reason })
}

/** PATCH /products/:id/activate — [Superadmin] retira esa baja, también con motivo. */
export async function activateProduct(productId: number, reason: string): Promise<void> {
  await myntedAPI.patch(`/products/${productId}/activate`, { reason })
}

/**
 * DELETE /products/:id — borrado lógico. Lo usa el dueño sin motivo y el
 * superadmin con motivo obligatorio; acá siempre va con motivo. Se conservan
 * los favoritos y las conversaciones; los listados lo ignoran.
 */
export async function deleteProduct(productId: number, reason: string): Promise<void> {
  await myntedAPI.delete(`/products/${productId}`, { data: { reason } })
}

/** GET /users/stats — [Superadmin] contadores del resumen. */
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await myntedAPI.get<AdminStats>('/users/stats')
  return data
}

/** PATCH /users/:id/activate — [Superadmin]. */
export async function activateUser(userId: string): Promise<void> {
  await myntedAPI.patch(`/users/${userId}/activate`)
}

/**
 * GET /users/seller-requests — [Superadmin] solicitudes de vendedor PENDIENTES, de la
 * más antigua a la más nueva, con la cuenta (`user`) y los datos de cobro de cada una.
 */
export async function getPendingSellerRequests(): Promise<SellerRequestDetail[]> {
  const { data } = await myntedAPI.get<SellerRequestDetail[]>('/users/seller-requests')
  return data
}

/**
 * Las ya decididas, con lo que se envió al pedir: el backend conserva la ficha
 * de la tienda también al rechazar. Las revocadas no se pueden listar así.
 */
export async function getReviewedSellerRequests(): Promise<SellerRequestDetail[]> {
  const [approved, rejected] = await Promise.all(
    (['approved', 'rejected'] as const).map((status) =>
      myntedAPI.get<SellerRequestDetail[]>('/users/seller-requests', { params: { status } }).then(({ data }) => data),
    ),
  )
  return [...approved, ...rejected]
}

/**
 * GET /users/seller-request/:id — [Superadmin] datos de la tienda y de cobro
 * de la solicitud pendiente de ese usuario. Responde 404 si ya no está pendiente.
 */
export async function getSellerRequest(userId: string): Promise<SellerRequestDetail> {
  const { data } = await myntedAPI.get<SellerRequestDetail>(`/users/seller-request/${userId}`)
  return data
}

/**
 * PATCH /users/:id/seller-status — [Superadmin] aprueba o rechaza una solicitud
 * pendiente, o revoca el rol de uno ya aprobado. Al revocar, el motivo es
 * obligatorio y el backend desactiva sus productos.
 */
export async function updateSellerStatus(userId: string, status: SellerDecision, reason?: string): Promise<void> {
  await myntedAPI.patch(`/users/${userId}/seller-status`, { status, ...(reason && { reason }) })
}

/**
 * Trae todas las comunidades recorriendo las páginas de GET /communities/all
 * (el backend limita a 100 por página). Este listado es el de administración:
 * a diferencia de GET /communities incluye las desactivadas y las eliminadas,
 * que son justo las que hay que poder ver desde el panel. MAX_PAGES es un tope
 * de seguridad para no quedarse pidiendo páginas sin fin.
 */
const PAGE_LIMIT = 100
const MAX_PAGES = 20

export async function getAllCommunitiesForAdmin(): Promise<AdminCommunity[]> {
  const all: AdminCommunity[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data } = await myntedAPI.get<PaginatedResponse<AdminCommunity>>('/communities/all', {
      params: { page, limit: PAGE_LIMIT },
    })
    all.push(...data.data)
    if (page >= data.pagination.totalPages) break
  }
  return all
}

/**
 * PATCH /communities/:id/deactivate — la comunidad deja de aparecer y nadie
 * puede publicar en ella, pero se conserva todo. El endpoint pide ser dueño de
 * la comunidad; el superadmin se salta esa comprobación (CommunityRoleGuard).
 * No lleva motivo: el backend no lo recibe.
 */
export async function deactivateCommunity(communityId: number): Promise<void> {
  await myntedAPI.patch(`/communities/${communityId}/deactivate`)
}

/** PATCH /communities/:id/activate — la vuelve a poner en línea. */
export async function activateCommunity(communityId: number): Promise<void> {
  await myntedAPI.patch(`/communities/${communityId}/activate`)
}

/**
 * DELETE /communities/:id — [Superadmin] borrado lógico, con motivo
 * obligatorio (1–500 caracteres). No se deshace desde el panel.
 */
export async function deleteCommunity(communityId: number, reason: string): Promise<void> {
  await myntedAPI.delete(`/communities/${communityId}`, { data: { reason } })
}

/**
 * Filtros de GET /moderation-log que usa el panel. Todos son opcionales y se
 * combinan con AND. `from` y `to` son ISO date-time e inclusivos.
 */
export interface ModerationLogFilters {
  actorUserId?: string
  from?: string
  to?: string
}

/**
 * GET /moderation-log — [Superadmin] el registro de acciones, más nuevas
 * primero. Es append-only: no hay nada que resolver, solo mirar.
 */
export async function getModerationLog(
  page: number,
  limit: number,
  filters: ModerationLogFilters = {},
): Promise<ModerationLogPage> {
  const { data } = await myntedAPI.get<ModerationLogPage>('/moderation-log', { params: { page, limit, ...filters } })
  return data
}

/**
 * Todo el registro que cumple los filtros, recorriendo las páginas de GET
 * /moderation-log (máximo 100 por página). Quién y las fechas los filtra el
 * backend; buscar, ordenar y filtrar por área sigue siendo del lado del
 * cliente, así que hace falta tener el resultado entero. MAX_PAGES es el mismo
 * tope de seguridad que en comunidades.
 */
export async function getAllModerationLog(filters: ModerationLogFilters = {}): Promise<ModerationLogPage['data']> {
  const all: ModerationLogPage['data'] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await getModerationLog(page, PAGE_LIMIT, filters)
    all.push(...data.data)
    if (page >= data.pagination.totalPages) break
  }
  return all
}
