import axios from 'axios'

interface ApiErrorBody {
  message?: string | string[]
  error?: string
  statusCode?: number
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'

export function getApiErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const backendMessage = error.response?.data?.message
    if (Array.isArray(backendMessage) && backendMessage.length > 0) {
      return backendMessage.join(' ')
    }
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage
    }
    if (error.message) return error.message
  }

  if (error instanceof Error && error.message) return error.message

  return fallback
}

/** `true` si la petición falló con 401: no hay sesión, o venció y no se pudo refrescar. */
export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}

/** Código HTTP de una petición fallida con axios (undefined si no hubo respuesta: red caída, CORS, etc.). */
export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

/** `true` si el backend respondió 404 (el recurso no existe o fue borrado). */
export function isNotFoundError(error: unknown): boolean {
  return getHttpStatus(error) === 404
}

/** `true` si el backend respondió 403 (hay sesión, pero sin permiso para esto). */
export function isForbiddenError(error: unknown): boolean {
  return getHttpStatus(error) === 403
}
