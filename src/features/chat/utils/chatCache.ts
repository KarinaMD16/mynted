import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { chatKeys } from '../hooks/chatKeys'
import type { ChatMessage, InboxResponse, MessageHistoryResponse, UnreadCountResponse } from '../models/chat'

/**
 * Escrituras directas al cache del chat. Las usan tanto las mutations (con la
 * respuesta del POST) como los eventos del socket, para que la pantalla se
 * actualice sin volver a pedir todo. Cuando falta información para actualizar
 * en el lugar (por ejemplo, un mensaje de una conversación que todavía no está
 * en la bandeja cargada), se invalida y React Query la vuelve a pedir.
 */

type HistoryPages = InfiniteData<MessageHistoryResponse, number | undefined>
type InboxPages = InfiniteData<InboxResponse, number>

/**
 * Agrega un mensaje al historial cacheado (va al principio de la primera
 * página: el historial viene del más nuevo al más viejo). Deduplica por id,
 * porque el remitente recibe su propio mensaje dos veces: en la respuesta del
 * POST y en `message:new`.
 *
 * Si el historial todavía no está en cache (por ejemplo, llegó un mensaje
 * mientras la primera página se estaba pidiendo), se invalida para no perderlo.
 */
export function addMessageToHistory(queryClient: QueryClient, message: ChatMessage) {
  const key = chatKeys.messages(message.conversationId)
  const current = queryClient.getQueryData<HistoryPages>(key)

  if (!current || current.pages.length === 0) {
    void queryClient.invalidateQueries({ queryKey: key })
    return
  }
  if (current.pages.some((page) => page.data.some((item) => item.id === message.id))) return

  const [first, ...rest] = current.pages
  queryClient.setQueryData<HistoryPages>(key, {
    ...current,
    pages: [{ ...first, data: [message, ...first.data] }, ...rest],
  })
}

/** Aplica un `readAt` a ciertos mensajes del historial (vistos del otro, o los míos al marcar como leído). */
export function setMessagesReadAt(
  queryClient: QueryClient,
  conversationId: number,
  readAt: string,
  shouldMark: (message: ChatMessage) => boolean,
) {
  queryClient.setQueryData<HistoryPages>(chatKeys.messages(conversationId), (old) =>
    old && {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map((message) => (message.readAt === null && shouldMark(message) ? { ...message, readAt } : message)),
      })),
    },
  )
}

/**
 * Sube una conversación al principio de la bandeja con su último mensaje.
 * `unread` decide el contador: 'increment' para un mensaje entrante que no se
 * está viendo, un número para fijarlo, o undefined para dejarlo como está.
 * Si la conversación no está en lo cargado de la bandeja (un chat nuevo, o una
 * página que no se pidió), se invalida: faltan el producto y el participante.
 */
export function bumpConversationInInbox(
  queryClient: QueryClient,
  message: ChatMessage,
  unread?: 'increment' | number,
) {
  const key = chatKeys.inbox()
  const current = queryClient.getQueryData<InboxPages>(key)
  if (!current) return

  const existing = current.pages.flatMap((page) => page.data).find((item) => item.id === message.conversationId)
  if (!existing) {
    void queryClient.invalidateQueries({ queryKey: key })
    return
  }
  // Un evento viejo que llega tarde no debe pisar un último mensaje más nuevo.
  if (existing.lastMessage.id > message.id) return

  const unreadCount =
    unread === 'increment' ? existing.unreadCount + 1 : typeof unread === 'number' ? unread : existing.unreadCount
  const updated = {
    ...existing,
    lastMessage: {
      id: message.id,
      type: message.type,
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt,
    },
    lastMessageAt: message.createdAt,
    unreadCount,
  }

  const pages = current.pages.map((page) => ({ ...page, data: page.data.filter((item) => item.id !== updated.id) }))
  pages[0] = { ...pages[0], data: [updated, ...pages[0].data] }
  queryClient.setQueryData<InboxPages>(key, { ...current, pages })
}

/** Fija el contador de no leídos de una conversación en la bandeja (ej.: `inbox:read`). */
export function setInboxUnread(queryClient: QueryClient, conversationId: number, unreadCount: number) {
  queryClient.setQueryData<InboxPages>(chatKeys.inbox(), (old) =>
    old && {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map((item) => (item.id === conversationId ? { ...item, unreadCount } : item)),
      })),
    },
  )
}

/** Fija el total de no leídos del badge del nav. */
export function setTotalUnread(queryClient: QueryClient, totalUnread: number) {
  queryClient.setQueryData<UnreadCountResponse>(chatKeys.unreadCount(), { totalUnread })
}
