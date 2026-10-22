import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { MessageType } from '../models/chat'
import { sendImageMessage, sendTextMessage } from '../services/chatService'
import { addMessageToHistory, bumpConversationInInbox } from '../utils/chatCache'
import { classifySendError, normalizeChatText, validateChatImage, type ChatImageError, type ChatSendError } from '../utils/chatValidation'

/** Un mensaje propio que todavía no confirmó el backend (se está enviando o falló). */
export interface PendingMessage {
  localId: string
  conversationId: number
  type: MessageType
  content: string | null
  /** Object URL de la imagen local, para mostrarla mientras sube. */
  previewUrl: string | null
  createdAt: string
  status: 'sending' | 'failed'
  error: ChatSendError | null
}

let localIdCounter = 0
const nextLocalId = () => `local-${Date.now()}-${++localIdCounter}`

/**
 * Envío de mensajes con "bandeja de salida" local: el mensaje aparece al
 * instante como pendiente y, cuando el backend responde, se reemplaza por el
 * mensaje real (que entra al historial cacheado). Si falla, queda marcado con
 * el motivo para ofrecer "Reintentar" o "Descartar".
 *
 * El mensaje real también llega por `message:new` (el remitente está en la
 * sala); addMessageToHistory deduplica por id, así que no aparece dos veces.
 */
export function useSendMessages(conversationId: number | undefined) {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<PendingMessage[]>([])
  // Los File no van al estado (no hacen falta para pintar); se guardan para reintentar.
  const files = useRef(new Map<string, File>())
  const previews = useRef(new Map<string, string>())

  // Al desmontar, liberar las previsualizaciones que queden.
  useEffect(() => {
    const urls = previews.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const remove = useCallback((localId: string) => {
    files.current.delete(localId)
    const previewUrl = previews.current.get(localId)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      previews.current.delete(localId)
    }
    setPending((items) => items.filter((entry) => entry.localId !== localId))
  }, [])

  const deliver = useCallback(
    async (item: PendingMessage) => {
      try {
        const file = files.current.get(item.localId)
        const message =
          item.type === 'image' && file
            ? await sendImageMessage(item.conversationId, file)
            : await sendTextMessage(item.conversationId, item.content ?? '')
        addMessageToHistory(queryClient, message)
        bumpConversationInInbox(queryClient, message)
        remove(item.localId)
      } catch (error) {
        const reason = classifySendError(error)
        setPending((items) =>
          items.map((entry) => (entry.localId === item.localId ? { ...entry, status: 'failed', error: reason } : entry)),
        )
      }
    },
    [queryClient, remove],
  )

  /** Envía texto. Devuelve `false` si quedó vacío o pasa del máximo (no se envía nada). */
  const sendText = useCallback(
    (raw: string): boolean => {
      const content = normalizeChatText(raw)
      if (conversationId === undefined || content === null) return false
      const item: PendingMessage = {
        localId: nextLocalId(),
        conversationId,
        type: 'text',
        content,
        previewUrl: null,
        createdAt: new Date().toISOString(),
        status: 'sending',
        error: null,
      }
      setPending((items) => [...items, item])
      void deliver(item)
      return true
    },
    [conversationId, deliver],
  )

  /** Envía una imagen. Devuelve el error de validación si el archivo no sirve (no se sube nada). */
  const sendImage = useCallback(
    (file: File): ChatImageError | null => {
      const invalid = validateChatImage(file)
      if (invalid) return invalid
      if (conversationId === undefined) return null
      const previewUrl = URL.createObjectURL(file)
      const item: PendingMessage = {
        localId: nextLocalId(),
        conversationId,
        type: 'image',
        content: null,
        previewUrl,
        createdAt: new Date().toISOString(),
        status: 'sending',
        error: null,
      }
      files.current.set(item.localId, file)
      previews.current.set(item.localId, previewUrl)
      setPending((items) => [...items, item])
      void deliver(item)
      return null
    },
    [conversationId, deliver],
  )

  const retry = useCallback(
    (localId: string) => {
      const item = pending.find((entry) => entry.localId === localId)
      if (!item || item.status !== 'failed') return
      const again = { ...item, status: 'sending' as const, error: null }
      setPending((items) => items.map((entry) => (entry.localId === localId ? again : entry)))
      void deliver(again)
    },
    [pending, deliver],
  )

  return {
    /** Pendientes de la conversación actual, del más viejo al más nuevo. */
    pending: pending.filter((item) => item.conversationId === conversationId),
    sendText,
    sendImage,
    retry,
    discard: remove,
  }
}
