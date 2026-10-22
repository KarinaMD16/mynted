import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import type { NotificationsFilter } from '../models/notifications'
import { getNotifications, getNotificationsUnreadCount } from '../services/notificationsService'
import { notificationKeys } from './notificationKeys'

const PAGE_SIZE = 20

/**
 * Lista de la campana, con "Cargar más". Solo se pide al abrir el menú
 * (`enabled`); después la mantiene al día useNotificationsSync.
 */
export function useNotificationsList(filter: NotificationsFilter, enabled: boolean) {
  const { userId } = useCurrentUser()
  return useInfiniteQuery({
    queryKey: notificationKeys.list(userId ?? '', filter),
    queryFn: ({ pageParam }) => getNotifications(filter, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled: enabled && Boolean(userId),
  })
}

/**
 * No leídas para el badge de la campana (0 sin sesión). Se pide una vez al
 * cargar la app; los cambios llegan por socket (ver useNotificationsSync).
 */
export function useNotificationsUnreadBadge(): number {
  const { userId } = useCurrentUser()
  const query = useQuery({
    queryKey: notificationKeys.unreadCount(userId ?? ''),
    queryFn: async () => (await getNotificationsUnreadCount()).unreadCount,
    enabled: Boolean(userId),
    staleTime: Infinity,
  })
  return userId ? (query.data ?? 0) : 0
}
