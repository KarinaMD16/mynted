import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL, refreshSession } from '@/api/apiConfig'
import type {
  ChatMessage,
  InboxMessagePayload,
  InboxReadPayload,
  JoinConversationAck,
  LeaveConversationAck,
  MessageReadPayload,
  PresencePayload,
} from '../models/chat'
import type { NotificationNewPayload, NotificationUnreadCountPayload } from '@/features/notifications/models/notifications'

/** Nombres de los eventos (mismos que ChatSocketEvents en el backend). */
export const CHAT_EVENTS = {
  join: 'conversation:join',
  leave: 'conversation:leave',
  messageNew: 'message:new',
  messageRead: 'message:read',
  inboxMessage: 'inbox:message',
  inboxRead: 'inbox:read',
  presenceOnline: 'presence:online',
  presenceOffline: 'presence:offline',
} as const

interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void
  'message:read': (payload: MessageReadPayload) => void
  'inbox:message': (payload: InboxMessagePayload) => void
  'inbox:read': (payload: InboxReadPayload) => void
  'presence:online': (payload: PresencePayload) => void
  'presence:offline': (payload: PresencePayload) => void
  // Notificaciones: viajan por esta misma conexión (ver useNotificationsSync).
  'notification:new': (payload: NotificationNewPayload) => void
  'notification:unread-count': (payload: NotificationUnreadCountPayload) => void
}

interface ClientToServerEvents {
  'conversation:join': (payload: { conversationId: number }, ack: (response: JoinConversationAck) => void) => void
  'conversation:leave': (payload: { conversationId: number }, ack: (response: LeaveConversationAck) => void) => void
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/** Lo que manda el backend en `connect_error` cuando no hay sesión o el access_token venció. */
const UNAUTHENTICATED_MESSAGE = 'No autenticado'
const ACK_TIMEOUT_MS = 5000

/**
 * Único socket de la app: lo comparten el chat y las notificaciones (el
 * backend mete cada conexión en la sala del usuario, no hay que unirse a nada).
 * Es el único socket del chat para toda la app. Se crea sin conectar
 * (`autoConnect: false`): lo conecta y desconecta `ChatRealtime` según haya
 * sesión o no, así un visitante sin cuenta nunca abre un socket.
 *
 * Se autentica con la misma cookie httpOnly `access_token` que la API
 * (`withCredentials`); no se manda ningún token a mano. El backend solo acepta
 * conexiones desde el origen del frontend permitido (http://localhost:5173 en
 * desarrollo): desde otro puerto la conexión se rechaza con "Origen no permitido".
 */
export const chatSocket: ChatSocket = io(API_BASE_URL, {
  withCredentials: true,
  autoConnect: false,
})

// -----------------------------------------------------------------------------
// Sesión vencida
// -----------------------------------------------------------------------------
//
// La sesión del socket solo se valida al conectar. Si el access_token venció
// (dura 15 min), el handshake de una reconexión responde "No autenticado" y
// socket.io NO reintenta solo un rechazo del servidor. En ese caso se refresca
// la sesión por HTTP (misma función que el interceptor de axios) y se vuelve a
// conectar UNA vez; si el refresh también falla, la sesión murió y el socket
// queda desconectado hasta el próximo login (useCurrentUser pasa a "sin sesión"
// en la siguiente petición y ChatRealtime lo desconecta del todo).

let retriedAfterRefresh = false

chatSocket.on('connect', () => {
  retriedAfterRefresh = false
})

chatSocket.on('connect_error', (error) => {
  if (error.message !== UNAUTHENTICATED_MESSAGE) {
    if (import.meta.env.DEV) console.warn('[chat] No se pudo conectar el socket:', error.message)
    return
  }
  if (retriedAfterRefresh) {
    if (import.meta.env.DEV) console.warn('[chat] El socket sigue sin sesión después de renovarla.')
    return
  }
  retriedAfterRefresh = true
  refreshSession()
    .then(() => {
      chatSocket.connect()
    })
    .catch(() => {
      // Sin refresh_token válido no hay nada que hacer: queda desconectado.
    })
})

/** Si hay sesión y el socket debería estar conectado (lo decide ChatRealtime). */
let shouldStayConnected = false

// Si el servidor cierra la conexión a propósito (p. ej. al apagarse), socket.io
// no reintenta solo; los cortes de red sí los reintenta él.
chatSocket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect' && shouldStayConnected) chatSocket.connect()
})

// Vite (desarrollo): si este archivo cambia, el socket viejo se cerraría sin que
// nadie conecte el nuevo; mejor recargar la página entera.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    chatSocket.disconnect()
  })
  import.meta.hot.accept(() => window.location.reload())
}

/** Conecta el socket si todavía no lo está (idempotente). */
export function connectChatSocket() {
  shouldStayConnected = true
  if (!chatSocket.connected && !chatSocket.active) {
    retriedAfterRefresh = false
    chatSocket.connect()
  }
}

/** Cierra el socket (al cerrar sesión, o al cambiar de cuenta). */
export function disconnectChatSocket() {
  shouldStayConnected = false
  chatSocket.disconnect()
}

/**
 * Entra a la sala de una conversación. Resuelve con el ack del servidor
 * (`ok: false` con el status si no participas o no existe); rechaza solo si no
 * hubo respuesta a tiempo (socket caído o lento).
 */
export function joinConversationRoom(conversationId: number): Promise<JoinConversationAck> {
  return chatSocket.timeout(ACK_TIMEOUT_MS).emitWithAck(CHAT_EVENTS.join, { conversationId })
}

/** Sale de la sala: desde ahí los mensajes de esa conversación llegan como `inbox:message`. */
export function leaveConversationRoom(conversationId: number): Promise<LeaveConversationAck> {
  return chatSocket.timeout(ACK_TIMEOUT_MS).emitWithAck(CHAT_EVENTS.leave, { conversationId })
}
