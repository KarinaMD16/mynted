import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getHttpStatus } from '@/api/apiError'
import { getInbox, getMessages, getUnreadCount } from '../services/chatService'
import { chatKeys } from './chatKeys'

const INBOX_PAGE_SIZE = 20
const MESSAGES_PAGE_SIZE = 30

/** Bandeja de /messages, con "cargar más" por página. */
export function useInbox(enabled = true) {
  return useInfiniteQuery({
    queryKey: chatKeys.inbox(),
    queryFn: ({ pageParam }) => getInbox(pageParam, INBOX_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
    enabled,
  })
}

/**
 * Total de no leídos (badge de "Mensajes" en el nav). Se pide una vez al
 * cargar la app con sesión; después lo mantiene al día useInboxSync con el
 * `totalUnread` de los eventos del socket. Al volver a enfocar la pestaña se
 * vuelve a pedir (comportamiento por defecto de React Query), lo que corrige
 * el caso en que dos eventos llegan en desorden.
 */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: getUnreadCount,
    select: (data) => data.totalUnread,
    enabled,
  })
}

/**
 * Historial de una conversación, paginado por cursor hacia atrás: la primera
 * página son los mensajes más recientes y `fetchNextPage` trae los más viejos
 * (scroll hacia arriba). La primera página también trae el contexto
 * (`conversation`: producto y otro participante).
 *
 * Los mensajes nuevos no se piden: entran al cache por la respuesta del envío
 * y por `message:new` (ver useConversationRoom), así que no hace falta refetch
 * periódico ni al enfocar.
 */
export function useConversationMessages(conversationId: number | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId ?? 0),
    queryFn: ({ pageParam }) => getMessages(conversationId as number, pageParam, MESSAGES_PAGE_SIZE),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: conversationId !== undefined,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // 400/403/404 no se arreglan reintentando.
      const status = getHttpStatus(error)
      return status === undefined || status >= 500 ? failureCount < 2 : false
    },
  })
}
