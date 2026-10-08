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
