import myntedAPI from '@/api/apiConfig'
import type {
  ChatMessage,
  Conversation,
  InboxResponse,
  MarkReadResponse,
  MessageHistoryResponse,
  UnreadCountResponse,
} from '../models/chat'

/**
 * Endpoints REST del chat (tag `conversations` en Swagger). Todos piden sesión;
 * la cookie viaja sola por `withCredentials` en myntedAPI. Las rutas con
 * `:conversationId` solo las puede usar el comprador o el vendedor de esa
 * conversación (403 si no participas, 404 si no existe).
 */

/**
 * POST /conversations — botón "Contactar vendedor". Es idempotente: responde
 * 201 si la crea y 200 si ya existía, en ambos casos con la misma forma.
 * Errores: 400 producto no activo u oculto (solo al crear), 403 el producto
 * es tuyo, 404 el producto no existe.
 */
export async function openConversation(productId: number): Promise<Conversation> {
  const { data } = await myntedAPI.post<Conversation>('/conversations', { productId })
  return data
}

/** GET /conversations — bandeja, ordenada por último mensaje. `limit` máximo 50. */
export async function getInbox(page: number, limit: number): Promise<InboxResponse> {
  const { data } = await myntedAPI.get<InboxResponse>('/conversations', { params: { page, limit } })
  return data
}

/** GET /conversations/unread-count — total de no leídos para el badge del nav. */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await myntedAPI.get<UnreadCountResponse>('/conversations/unread-count')
  return data
}

/**
 * GET /conversations/:id/messages — historial, del más nuevo al más viejo.
 * Sin `cursor` trae lo último; con el `nextCursor` de la respuesta anterior,
 * lo que sigue hacia atrás. `limit` máximo 100.
 */
export async function getMessages(conversationId: number, cursor: number | undefined, limit: number): Promise<MessageHistoryResponse> {
  const { data } = await myntedAPI.get<MessageHistoryResponse>(`/conversations/${conversationId}/messages`, {
    params: { limit, cursor },
  })
  return data
}

/**
 * POST /conversations/:id/messages — enviar texto. El body acepta SOLO
 * `content` (con cualquier otro campo responde 400). El backend recorta
 * espacios; no puede quedar vacío ni pasar de 2000 caracteres.
 */
export async function sendTextMessage(conversationId: number, content: string): Promise<ChatMessage> {
  const { data } = await myntedAPI.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content })
  return data
}

/**
 * POST /conversations/:id/messages/image — multipart con un único campo
 * `image`. JPG/PNG/WEBP de hasta 5 MB. Errores: 400 archivo inválido, 413 muy
 * pesado, 502 falló la subida (no se creó el mensaje, se puede reintentar).
 */
export async function sendImageMessage(conversationId: number, file: File): Promise<ChatMessage> {
  const body = new FormData()
  body.append('image', file)
  const { data } = await myntedAPI.post<ChatMessage>(`/conversations/${conversationId}/messages/image`, body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * PATCH /conversations/:id/read — marca como leídos los mensajes del otro.
 * Idempotente: sin pendientes responde `markedCount: 0`, así que se puede
 * llamar cada vez que se abre o enfoca el chat.
 */
export async function markConversationRead(conversationId: number): Promise<MarkReadResponse> {
  const { data } = await myntedAPI.patch<MarkReadResponse>(`/conversations/${conversationId}/read`)
  return data
}
