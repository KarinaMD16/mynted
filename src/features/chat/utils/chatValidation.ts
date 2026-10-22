import { getHttpStatus } from '@/api/apiError'
import { CHAT_IMAGE_MAX_BYTES, CHAT_IMAGE_TYPES, CHAT_TEXT_MAX_LENGTH } from '../models/chat'

/**
 * Validaciones del lado del cliente con los mismos límites que el backend, para
 * avisar antes de subir nada. El backend vuelve a validar igual.
 */

export type ChatImageError = 'invalidType' | 'tooLarge'

export function validateChatImage(file: File): ChatImageError | null {
  if (!(CHAT_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'invalidType'
  if (file.size > CHAT_IMAGE_MAX_BYTES) return 'tooLarge'
  return null
}

/** Texto listo para enviar (recortado), o `null` si queda vacío o se pasa del máximo. */
export function normalizeChatText(raw: string): string | null {
  const content = raw.trim()
  if (content.length === 0 || content.length > CHAT_TEXT_MAX_LENGTH) return null
  return content
}

/** Por qué falló un envío, para elegir el mensaje que se muestra en la burbuja. */
export type ChatSendError = 'tooLarge' | 'invalid' | 'forbidden' | 'network' | 'failed'

export function classifySendError(error: unknown): ChatSendError {
  const status = getHttpStatus(error)
  if (status === undefined) return 'network'
  if (status === 413) return 'tooLarge'
  if (status === 400) return 'invalid'
  if (status === 403 || status === 404) return 'forbidden'
  return 'failed'
}

/** Si tiene sentido ofrecer "Reintentar" (no lo tiene si el archivo o el texto son inválidos). */
export function isRetriableSendError(error: ChatSendError): boolean {
  return error === 'network' || error === 'failed'
}
