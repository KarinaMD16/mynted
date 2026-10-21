import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { markConversationRead, openConversation } from '../services/chatService'
import { chatSocket } from '../socket/chatSocket'
import { setInboxUnread, setMessagesReadAt } from '../utils/chatCache'
import { chatKeys } from './chatKeys'

/**
 * "Contactar vendedor": abre (o recupera) la conversación de un producto.
 * Errores a manejar en la pantalla: 400 producto no disponible, 403 es tu
 * propio producto, 404 no existe, 401 sin sesión.
 */
export function useOpenConversation() {
  return useMutation({
    mutationFn: (productId: number) => openConversation(productId),
  })
}

/**
 * Marca como leído lo que mandó el otro en una conversación. Actualiza el
 * historial y la bandeja al instante; el total del badge lo trae `inbox:read`
 * por socket, y si el socket está caído se vuelve a pedir por REST.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  const { userId } = useCurrentUser()

  return useMutation({
    mutationFn: (conversationId: number) => markConversationRead(conversationId),
    onSuccess: (result) => {
      if (result.markedCount === 0 || !result.readAt) return
      const readAt = result.readAt
      setMessagesReadAt(queryClient, result.conversationId, readAt, (message) => message.senderId !== userId)
      setInboxUnread(queryClient, result.conversationId, 0)
      if (!chatSocket.connected) void queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() })
    },
  })
}
