import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import type { UserDisplaySummary } from '@/features/pro/models/cosmetics'
import type { ProductStatus } from '@/features/products/models/product'
import type { DisplayPriceFields } from '@/utils/price'

/**
 * Modelos del chat comprador ↔ vendedor (módulo `conversations` del backend,
 * ver GUIA_CHAT.md). Las fechas llegan como string ISO.
 *
 * Una conversación es única por (comprador, vendedor, producto): abrirla dos
 * veces devuelve la misma. Todo lo que guarda algo va por REST; el socket
 * solo avisa de cambios en vivo.
 */

export type MessageType = 'text' | 'image'

/** Un mensaje, tal como lo devuelven la API y los eventos del socket. */
export interface ChatMessage {
  id: number
  conversationId: number
  senderId: string
  type: MessageType
  /** Texto del mensaje; `null` en los mensajes de imagen (no llevan pie de foto). */
  content: string | null
  /** URL de Cloudinary; solo en los mensajes de imagen. */
  imageUrl: string | null
  createdAt: string
  /** `null` mientras el destinatario no lo haya leído. */
  readAt: string | null
}

/**
 * El otro participante de la conversación, siempre visto desde quien consulta.
 * Trae su badge Pro y su marco de avatar (ver UserDisplaySummary).
 */
export interface ChatParticipant extends UserDisplaySummary {
  /** Id de usuario (uuid). Sirve para enlazar a /users/$userId y para la presencia. */
  id: string
  username: string
  /** Nombre de la tienda si es vendedor; si no, su username. */
  displayName: string
  photoUrl: string | null
  /** `seller.isVerified`; `false` si no tiene tienda. */
  isVerified: boolean
}

/** Producto del que trata la conversación (bandeja). */
export interface ChatProductSummary {
  id: number
  title: string
  price: number
  /** Precio con descuento aplicado. */
  finalPrice: number
  currency: string | null
  /** Portada del producto. */
  imageUrl: string | null
}

/**
 * Producto en el historial: además dice si todavía se puede comprar. Trae los
 * campos `display*`; el resumen de la bandeja (ChatProductSummary) no.
 */
export interface ChatProductContext extends ChatProductSummary, DisplayPriceFields {
  status: ProductStatus
  /** `false` si ya no está activo, está oculto o fue borrado. El chat sigue funcionando igual. */
  isAvailable: boolean
}

/** Respuesta de POST /conversations. */
export interface Conversation {
  id: number
  productId: number
  buyerId: string
  /** Id de USUARIO del dueño de la tienda (no el sellerId numérico). */
  sellerId: string
  createdAt: string
  lastMessageAt: string
}

export interface InboxLastMessage {
  id: number
  type: MessageType
  content: string | null
  senderId: string
  createdAt: string
}

/** Una fila de la bandeja (GET /conversations). Solo aparecen chats con al menos un mensaje. */
export interface InboxItem {
  id: number
  otherParticipant: ChatParticipant
  product: ChatProductSummary
  lastMessage: InboxLastMessage
  /** No leídos del usuario actual en esta conversación. */
  unreadCount: number
  lastMessageAt: string
}

export type InboxResponse = PaginatedResponse<InboxItem>

/** Contexto que acompaña al historial: producto y otro participante. */
export interface ChatConversationContext {
  id: number
  product: ChatProductContext
  otherParticipant: ChatParticipant
}

/** Respuesta de GET /conversations/:id/messages. `data` viene del más nuevo al más viejo. */
export interface MessageHistoryResponse {
  conversation: ChatConversationContext
  data: ChatMessage[]
  /** Cursor para pedir mensajes más viejos; `null` si no hay más. */
  nextCursor: number | null
}

/** Respuesta de PATCH /conversations/:id/read. */
export interface MarkReadResponse {
  conversationId: number
  markedCount: number
  /** `null` si no había nada pendiente de marcar. */
  readAt: string | null
}

export interface UnreadCountResponse {
  totalUnread: number
}

// -----------------------------------------------------------------------------
// Eventos del socket (ver gateway/chat-socket.events.ts en el backend)
// -----------------------------------------------------------------------------

export interface SocketAckError {
  ok: false
  error: { status: number; message: string }
}

export type JoinConversationAck =
  | { ok: true; conversationId: number; otherParticipant: { userId: string; online: boolean } }
  | SocketAckError

export type LeaveConversationAck = { ok: true; conversationId: number } | SocketAckError

/** `inbox:message`: le llega al destinatario cuando NO tiene ese chat abierto. */
export type InboxMessagePayload = ChatMessage & { totalUnread: number }

/** `message:read`: el otro leyó estos mensajes míos (para los "vistos"). */
export interface MessageReadPayload {
  conversationId: number
  readerId: string
  messageIds: number[]
  readAt: string | null
}

/** `inbox:read`: sincroniza la bandeja y el badge entre pestañas/dispositivos de quien leyó. */
export interface InboxReadPayload {
  conversationId: number
  unreadCount: number
  totalUnread: number
}

export interface PresencePayload {
  userId: string
}

// -----------------------------------------------------------------------------
// Límites (los mismos que valida el backend)
// -----------------------------------------------------------------------------

export const CHAT_TEXT_MAX_LENGTH = 2000
export const CHAT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
/** Para el `accept` del <input type="file">. */
export const CHAT_IMAGE_ACCEPT = CHAT_IMAGE_TYPES.join(',')
