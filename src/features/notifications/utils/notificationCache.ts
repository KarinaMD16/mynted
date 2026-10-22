import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { AppNotification, NotificationsPage } from '../models/notifications'
import { notificationKeys } from '../hooks/notificationKeys'

/**
 * Cambios directos al cache de la campana (socket y actualizaciones
 * optimistas), para no volver a pedir la lista en cada evento.
 */

type NotificationPages = InfiniteData<NotificationsPage>

function updateLists(
  queryClient: QueryClient,
  userId: string,
  update: (pages: NotificationPages) => NotificationPages,
) {
  queryClient.setQueriesData<NotificationPages>({ queryKey: notificationKeys.lists(userId) }, (old) =>
    old ? update(old) : old,
  )
}

export function setNotificationsUnread(queryClient: QueryClient, userId: string, unreadCount: number) {
  queryClient.setQueryData<number>(notificationKeys.unreadCount(userId), unreadCount)
}

/**
 * Agrega la notificación arriba de todo. Si ya estaba (una unificada llega con
 * el mismo id y datos nuevos), la quita de donde estaba: así no se duplica y
 * "vuelve arriba", como indica la guía.
 */
export function upsertNotification(queryClient: QueryClient, userId: string, notification: AppNotification) {
  updateLists(queryClient, userId, (old) => {
    let wasPresent = false
    const pages = old.pages.map((page) => {
      const data = page.data.filter((item) => {
        if (item.id !== notification.id) return true
        wasPresent = true
        return false
      })
      return { ...page, data }
    })
    if (pages.length === 0) return old
    const [first, ...rest] = pages
    const total = first.pagination.total + (wasPresent ? 0 : 1)
    return {
      ...old,
      pages: [
        { ...first, data: [notification, ...first.data], pagination: { ...first.pagination, total } },
        ...rest,
      ],
    }
  })
}

/** Marca como leídas (todas, o solo `id`). Quedan en la lista: solo cambia su estilo. */
export function markNotificationsReadInCache(queryClient: QueryClient, userId: string, id?: string) {
  const readAt = new Date().toISOString()
  updateLists(queryClient, userId, (old) => ({
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: page.data.map((item) => (item.readAt === null && (id === undefined || item.id === id) ? { ...item, readAt } : item)),
    })),
  }))
}

export function removeNotificationFromCache(queryClient: QueryClient, userId: string, id: string) {
  updateLists(queryClient, userId, (old) => ({
    ...old,
    pages: old.pages.map((page) => {
      const data = page.data.filter((item) => item.id !== id)
      const removed = page.data.length - data.length
      return { ...page, data, pagination: { ...page.pagination, total: page.pagination.total - removed } }
    }),
  }))
}

/** Busca una notificación en las listas cacheadas (para saber si estaba sin leer). */
export function findCachedNotification(queryClient: QueryClient, userId: string, id: string): AppNotification | undefined {
  for (const [, data] of queryClient.getQueriesData<NotificationPages>({ queryKey: notificationKeys.lists(userId) })) {
    const found = data?.pages.flatMap((page) => page.data).find((item) => item.id === id)
    if (found) return found
  }
  return undefined
}
