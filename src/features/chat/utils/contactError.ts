import { getHttpStatus } from '@/api/apiError'
import type { TranslationKey } from '@/i18n/translations/es'

/** Mensaje para un error de POST /conversations ("Contactar vendedor"). El 401 lo maneja quien llama (va a /login). */
export function contactErrorKey(error: unknown): TranslationKey {
  switch (getHttpStatus(error)) {
    case 400:
      return 'chat.contact.unavailable'
    case 403:
      return 'chat.contact.ownProduct'
    case 404:
      return 'chat.contact.notFound'
    default:
      return 'chat.contact.error'
  }
}
