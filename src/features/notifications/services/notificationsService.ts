import myntedAPI from '@/api/apiConfig'
import type {
  AppNotification,
  MarkAllReadResponse,
  NotificationsFilter,
  NotificationsPage,
  UnreadCountResponse,
} from '../models/notifications'

/**
 * Endpoints REST de notificaciones. Todos piden sesión y cada usuario solo ve
 * las suyas (la de otro responde 404, igual que una que no existe).
 */

/** GET /notifications — de la más reciente a la más antigua. `limit` máximo 50. */
export async function getNotifications(filter: NotificationsFilter, page: number, limit: number): Promise<NotificationsPage> {
  const { data } = await myntedAPI.get<NotificationsPage>('/notifications', {
    params: { page, limit, unread: filter === 'unread' ? true : undefined },
  })
  return data
}

/** GET /notifications/unread-count — para el badge de la campana. */
export async function getNotificationsUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await myntedAPI.get<UnreadCountResponse>('/notifications/unread-count')
  return data
}

/** PATCH /notifications/:id/read — si ya estaba leída no cambia. */
export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await myntedAPI.patch<AppNotification>(`/notifications/${id}/read`)
  return data
}

/** PATCH /notifications/read-all */
export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  const { data } = await myntedAPI.patch<MarkAllReadResponse>('/notifications/read-all')
  return data
}

/** DELETE /notifications/:id — 204. */
export async function deleteNotification(id: string): Promise<void> {
  await myntedAPI.delete(`/notifications/${id}`)
}
