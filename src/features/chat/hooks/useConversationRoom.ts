import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import type { ChatMessage, MessageReadPayload, PresencePayload } from '../models/chat'
import { CHAT_EVENTS, chatSocket, joinConversationRoom, leaveConversationRoom } from '../socket/chatSocket'
import { addMessageToHistory, bumpConversationInInbox, setMessagesReadAt } from '../utils/chatCache'
import { chatKeys } from './chatKeys'
import { useMarkConversationRead } from './useChatMutations'

/** La pestaña está visible y con foco: lo que llega se puede dar por leído. */
function isPageFocused() {
  return document.visibilityState === 'visible' && document.hasFocus()
}

interface PresenceState {
  conversationId: number
  otherUserId: string
  online: boolean
}

/**
 * Todo lo "en vivo" de un chat abierto (flujo 3–6 de la guía):
 *
 * - Entra a la sala `conversation:{id}` y sale al desmontar o cambiar de chat.
 *   Al reconectar el socket las salas se pierden, así que vuelve a entrar y
 *   pide de nuevo el historial (pudo haber llegado algo mientras estaba caído).
 * - `message:new`: lo agrega al historial y a la bandeja; si es del otro y la
 *   pestaña tiene foco, marca como leído.
 * - `message:read`: marca como vistos mis mensajes.
 * - Presencia: "Activo ahora" inicial por el ack del join, y después
 *   `presence:online` / `presence:offline`.
 * - Marca como leído al abrir el chat y cada vez que la pestaña vuelve a tener foco.
 */
export function useConversationRoom(conversationId: number | undefined) {
  const queryClient = useQueryClient()
  const { userId } = useCurrentUser()
  const { mutate: markRead } = useMarkConversationRead()
  const [presence, setPresence] = useState<PresenceState | null>(null)
  const [joinError, setJoinError] = useState<{ conversationId: number; status: number } | null>(null)

  // Sala: entrar / salir / volver a entrar al reconectar.
  useEffect(() => {
    if (conversationId === undefined) return
    let cancelled = false

    const join = () => {
      joinConversationRoom(conversationId)
        .then((ack) => {
          if (cancelled) return
          if (ack.ok) {
            setPresence({ conversationId, otherUserId: ack.otherParticipant.userId, online: ack.otherParticipant.online })
            setJoinError(null)
          } else {
            setJoinError({ conversationId, status: ack.error.status })
          }
        })
        .catch(() => {
          // Sin respuesta a tiempo: se vuelve a intentar en el próximo "connect".
        })
    }
    const rejoin = () => {
      join()
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) })
    }

    if (chatSocket.connected) join()
    chatSocket.on('connect', rejoin)

    return () => {
      cancelled = true
      chatSocket.off('connect', rejoin)
      if (chatSocket.connected) leaveConversationRoom(conversationId).catch(() => {})
    }
  }, [conversationId, queryClient])

  // Eventos de la sala.
  useEffect(() => {
    if (conversationId === undefined) return

    const onMessage = (message: ChatMessage) => {
      if (message.conversationId !== conversationId) return
      addMessageToHistory(queryClient, message)
      bumpConversationInInbox(queryClient, message)
      if (message.senderId !== userId && isPageFocused()) markRead(conversationId)
    }
    const onRead = (payload: MessageReadPayload) => {
      if (payload.conversationId !== conversationId || payload.readerId === userId) return
      const ids = new Set(payload.messageIds)
      setMessagesReadAt(queryClient, conversationId, payload.readAt ?? new Date().toISOString(), (message) => ids.has(message.id))
    }
    const setOnline = (online: boolean) => (payload: PresencePayload) =>
      setPresence((current) => (current && current.otherUserId === payload.userId ? { ...current, online } : current))
    const onOnline = setOnline(true)
    const onOffline = setOnline(false)

    chatSocket.on(CHAT_EVENTS.messageNew, onMessage)
    chatSocket.on(CHAT_EVENTS.messageRead, onRead)
    chatSocket.on(CHAT_EVENTS.presenceOnline, onOnline)
    chatSocket.on(CHAT_EVENTS.presenceOffline, onOffline)
    return () => {
      chatSocket.off(CHAT_EVENTS.messageNew, onMessage)
      chatSocket.off(CHAT_EVENTS.messageRead, onRead)
      chatSocket.off(CHAT_EVENTS.presenceOnline, onOnline)
      chatSocket.off(CHAT_EVENTS.presenceOffline, onOffline)
    }
  }, [conversationId, queryClient, userId, markRead])

  // Marcar como leído al abrir y al volver a la pestaña.
  useEffect(() => {
    if (conversationId === undefined) return
    const markIfFocused = () => {
      if (isPageFocused()) markRead(conversationId)
    }
    markIfFocused()
    window.addEventListener('focus', markIfFocused)
    document.addEventListener('visibilitychange', markIfFocused)
    return () => {
      window.removeEventListener('focus', markIfFocused)
      document.removeEventListener('visibilitychange', markIfFocused)
    }
  }, [conversationId, markRead])

  return {
    /** "Activo ahora": el otro participante tiene al menos una pestaña conectada. */
    isOtherOnline: presence !== null && presence.conversationId === conversationId ? presence.online : false,
    /** Status del rechazo al entrar a la sala (403 no participas, 404 no existe), o null. */
    joinError: joinError !== null && joinError.conversationId === conversationId ? joinError.status : null,
  }
}
