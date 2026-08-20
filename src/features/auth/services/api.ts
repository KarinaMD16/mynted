/**
 * Capa de acceso al backend de autenticación.
 *
 * IMPORTANTE: el backend (NestJS) todavía no existe / no está conectado.
 * Estas funciones ya tienen la forma final que va a tener la integración
 * (payload, respuesta esperada), pero de momento solo simulan la llamada
 * para que el resto del frontend (formularios, mutations, manejo de
 * error/carga) quede completamente listo.
 *
 * Cuando el backend esté disponible, el único cambio necesario es
 * reemplazar el cuerpo de cada función por un `fetch`/cliente HTTP real
 * hacia el endpoint correspondiente (ej. POST /auth/login, POST /auth/register).
 */

export interface LoginPayload {
  /** Puede ser el correo o el username, según define la regla de negocio del login. */
  identifier: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

const BACKEND_NOT_READY_MESSAGE =
  'El backend de autenticación todavía no está conectado. Esta acción va a funcionar en cuanto el endpoint de NestJS esté disponible.'

// TODO(backend): reemplazar por POST {API_URL}/auth/login, enviando `payload` en el body
export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  await simulateNetworkDelay()
  console.debug('[auth] loginRequest (stub, sin backend todavía):', payload)
  throw new Error(BACKEND_NOT_READY_MESSAGE)
}

// TODO(backend): reemplazar por POST {API_URL}/auth/register, enviando `payload` en el body
export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  await simulateNetworkDelay()
  console.debug('[auth] registerRequest (stub, sin backend todavía):', payload)
  throw new Error(BACKEND_NOT_READY_MESSAGE)
}

// TODO(backend): reemplazar por el flujo real de OAuth (redirect a {API_URL}/auth/google, /auth/facebook)
export async function socialLoginRequest(provider: 'google' | 'facebook'): Promise<AuthResponse> {
  await simulateNetworkDelay()
  console.debug('[auth] socialLoginRequest (stub, sin backend todavía):', provider)
  throw new Error(BACKEND_NOT_READY_MESSAGE)
}

function simulateNetworkDelay() {
  return new Promise((resolve) => setTimeout(resolve, 400))
}
