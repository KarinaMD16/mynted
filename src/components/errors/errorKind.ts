import axios from 'axios'
import type { ErrorKind } from './ErrorState'

/**
 * Qué estado mostrar para una petición fallida:
 * - sin respuesta del servidor (o el navegador está offline) → offline
 * - 401 → signedOut · 403 → forbidden · 404 → notFound
 * - cualquier otra cosa → error ("honk")
 */
export function getErrorKind(error: unknown): ErrorKind {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'offline'
    switch (error.response.status) {
      case 401:
        return 'signedOut'
      case 403:
        return 'forbidden'
      case 404:
        return 'notFound'
    }
  }
  return 'error'
}
