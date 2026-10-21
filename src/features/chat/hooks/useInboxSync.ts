import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { InboxMessagePayload, InboxReadPayload } from '../models/chat'
import { CHAT_EVENTS, chatSocket } from '../socket/chatSocket'
import { addMessageToHistory, bumpConversationInInbox, setInboxUnread, setTotalUnread } from '../utils/chatCache'
import { chatKeys } from './chatKeys'

/**
 * Mantiene al día la bandeja y el badge del nav en toda la app (flujo 1 de la
 * guía), aunque no haya ningún chat abierto:
 *
 * - `inbox:message`: mensaje de una conversación que esta pestaña no tiene
 *   abierta. Trae el `totalUnread` del badge y sube la conversación en la bandeja.
 * - `inbox:read`: leí desde otra pestaña o dispositivo (o desde esta misma).
 * - Al RE-conectar se vuelven a pedir bandeja y badge, por lo que haya llegado
 *   mientras el socket estaba caído.
 */
export function useInboxSync(userId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return
    let hasConnectedBefore = chatSocket.connected

    const onInboxMessage = ({ totalUnread, ...message }: InboxMessagePayload) => {
      setTotalUnread(queryClient, totalUnread)
      bumpConversationInInbox(queryClient, message, message.senderId !== userId ? 'increment' : undefined)
      // Si ese historial estaba cacheado de antes, que no quede viejo.
      if (queryClient.getQueryData(chatKeys.messages(message.conversationId))) addMessageToHistory(queryClient, message)
    }
    const onInboxRead = ({ conversationId, unreadCount, totalUnread }: InboxReadPayload) => {
      setTotalUnread(queryClient, totalUnread)
      setInboxUnread(queryClient, conversationId, unreadCount)
    }
    const onConnect = () => {
      if (hasConnectedBefore) {
        void queryClient.invalidateQueries({ queryKey: chatKeys.inbox() })
        void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
      }
      hasConnectedBefore = true
    }

    chatSocket.on(CHAT_EVENTS.inboxMessage, onInboxMessage)
    chatSocket.on(CHAT_EVENTS.inboxRead, onInboxRead)
    chatSocket.on('connect', onConnect)
    return () => {
      chatSocket.off(CHAT_EVENTS.inboxMessage, onInboxMessage)
      chatSocket.off(CHAT_EVENTS.inboxRead, onInboxRead)
      chatSocket.off('connect', onConnect)
    }
  }, [userId, queryClient])
}
