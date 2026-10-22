import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { chatSocket } from '@/features/chat/socket/chatSocket'
import type { AppNotification, NotificationNewPayload, NotificationUnreadCountPayload } from '../models/notifications'
import { setNotificationsUnread, upsertNotification } from '../utils/notificationCache'
import { notificationKeys } from './notificationKeys'

export const NOTIFICATION_EVENTS = {
  new: 'notification:new',
  unreadCount: 'notification:unread-count',
} as const

/**
 * Mantiene al día la campana en toda la app con el socket (el mismo del chat,
 * que conecta ChatRealtime mientras haya sesión):
 *
 * - `notification:new`: nueva, o una unificada que vuelve arriba con el mismo
 *   id y datos nuevos → upsert por id + contador. Llama a `onNew` para el
 *   aviso emergente.
 * - `notification:unread-count`: el contador cambió por leer, marcar todas o
 *   borrar (en esta u otra pestaña), o porque una unificada de precio se
 *   borró sola. La lista se marca como vieja para que se vuelva a pedir.
 * - Al RE-conectar se pide todo de nuevo, por lo que llegó con el socket caído.
 */
export function useNotificationsSync(userId: string | null, onNew: (notification: AppNotification) => void) {
  const queryClient = useQueryClient()
  // onNew cambia en cada render (lee preferencias del usuario): se guarda en
  // un ref para no volver a registrar los listeners por eso.
  const onNewRef = useRef(onNew)
  useEffect(() => {
    onNewRef.current = onNew
  }, [onNew])

  useEffect(() => {
    if (!userId) return
    let hasConnectedBefore = chatSocket.connected

    const handleNew = ({ notification, unreadCount }: NotificationNewPayload) => {
      setNotificationsUnread(queryClient, userId, unreadCount)
      upsertNotification(queryClient, userId, notification)
      onNewRef.current(notification)
    }
    const handleUnreadCount = ({ unreadCount }: NotificationUnreadCountPayload) => {
      setNotificationsUnread(queryClient, userId, unreadCount)
      void queryClient.invalidateQueries({ queryKey: notificationKeys.lists(userId) })
    }
    const handleConnect = () => {
      if (hasConnectedBefore) void queryClient.invalidateQueries({ queryKey: notificationKeys.user(userId) })
      hasConnectedBefore = true
    }

    chatSocket.on(NOTIFICATION_EVENTS.new, handleNew)
    chatSocket.on(NOTIFICATION_EVENTS.unreadCount, handleUnreadCount)
    chatSocket.on('connect', handleConnect)
    return () => {
      chatSocket.off(NOTIFICATION_EVENTS.new, handleNew)
      chatSocket.off(NOTIFICATION_EVENTS.unreadCount, handleUnreadCount)
      chatSocket.off('connect', handleConnect)
    }
  }, [userId, queryClient])
}
