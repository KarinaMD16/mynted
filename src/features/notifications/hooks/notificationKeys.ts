import type { NotificationsFilter } from '../models/notifications'

/**
 * Claves de React Query de notificaciones. Llevan el id del usuario para que,
 * al cambiar de cuenta, nunca se pinte un instante la campana de la anterior.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  user: (userId: string) => [...notificationKeys.all, userId] as const,
  lists: (userId: string) => [...notificationKeys.user(userId), 'list'] as const,
  list: (userId: string, filter: NotificationsFilter) => [...notificationKeys.lists(userId), filter] as const,
  unreadCount: (userId: string) => [...notificationKeys.user(userId), 'unread-count'] as const,
}
