import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from '../services/notificationsService'
import {
  findCachedNotification,
  markNotificationsReadInCache,
  removeNotificationFromCache,
  setNotificationsUnread,
} from '../utils/notificationCache'
import { notificationKeys } from './notificationKeys'

/**
 * Leer, marcar todas y borrar, con actualización optimista: la campana cambia
 * al instante. El backend además emite `notification:unread-count`, que deja
 * el contador exacto (y sincroniza las otras pestañas). Si algo falla, se
 * vuelve a pedir todo.
 */
export function useNotificationActions() {
  const queryClient = useQueryClient()
  const userId = useCurrentUser().userId ?? ''

  const decrementUnread = () => {
    queryClient.setQueryData<number>(notificationKeys.unreadCount(userId), (count) => Math.max(0, (count ?? 0) - 1))
  }
  const resync = () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) })
  }

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id) => {
      if (findCachedNotification(queryClient, userId, id)?.readAt === null) decrementUnread()
      markNotificationsReadInCache(queryClient, userId, id)
    },
    onError: resync,
  })

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => {
      markNotificationsReadInCache(queryClient, userId)
      setNotificationsUnread(queryClient, userId, 0)
    },
    onSuccess: ({ unreadCount }) => setNotificationsUnread(queryClient, userId, unreadCount),
    onError: resync,
  })

  const remove = useMutation({
    mutationFn: deleteNotification,
    onMutate: (id) => {
      if (findCachedNotification(queryClient, userId, id)?.readAt === null) decrementUnread()
      removeNotificationFromCache(queryClient, userId, id)
    },
    onError: resync,
  })

  return { markRead, markAllRead, remove }
}
