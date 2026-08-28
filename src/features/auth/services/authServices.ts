import myntedAPI, { API_BASE_URL } from '@/api/apiConfig'
import type {
  AccountIdentities,
  AuthUser,
  LinkConfirmPayload,
  LoginPayload,
  LogoutResponse,
  OAuthProvider,
  RegisterPayload,
  SetPasswordPayload,
} from '../models/auth'

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await myntedAPI.post<{ user: AuthUser }>('/auth/login', payload)
  return data.user
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await myntedAPI.post<AuthUser>('/users', payload)
  return data
}

export async function getUserByIdRequest(id: string): Promise<AuthUser> {
  const { data } = await myntedAPI.get<AuthUser>(`/users/${id}`)
  return data
}

export async function logoutRequest(): Promise<LogoutResponse> {
  const { data } = await myntedAPI.post<LogoutResponse>('/auth/logout')
  return data
}

/**
 * Usuario de la sesión actual. La cookie de sesión es httpOnly, así que el
 * navegador no puede leerla: hay que preguntarle al backend quiénes somos.
 * Responde 401 cuando no hay sesión.
 */
export async function getCurrentUserRequest(): Promise<AuthUser> {
  const { data } = await myntedAPI.get<{ user: AuthUser }>('/auth/me')
  return data.user
}

// -----------------------------------------------------------------------------
// OAuth
// -----------------------------------------------------------------------------

/**
 * Arranca el login/registro con un proveedor.
 *
 * No es una llamada XHR: el navegador tiene que navegar de verdad hasta la
 * pantalla de consentimiento del proveedor. Por eso acá no hay axios ni
 * promesa — la ejecución de esta página termina en el redirect, y el usuario
 * vuelve a /auth/callback.
 */
export function startOAuth(provider: OAuthProvider): void {
  window.location.href = `${API_BASE_URL}/auth/${provider}`
}

/**
 * Igual que startOAuth pero para agregar un proveedor a la sesión ya abierta.
 * El backend distingue los dos casos por la cookie link_intent que setea acá.
 */
export function startOAuthLink(provider: OAuthProvider): void {
  window.location.href = `${API_BASE_URL}/auth/link/${provider}`
}

/**
 * Cierra una vinculación pendiente: el proveedor trajo un email que ya tenía
 * cuenta local sin verificar, y el backend exige la contraseña para confirmar
 * que es la misma persona. El ticket viaja solo en la cookie `link_ticket`.
 */
export async function confirmLinkRequest(payload: LinkConfirmPayload): Promise<AuthUser> {
  const { data } = await myntedAPI.post<{ user: AuthUser; linked: boolean }>(
    '/auth/link/confirm',
    payload,
  )
  return data.user
}

export async function getIdentitiesRequest(): Promise<AccountIdentities> {
  const { data } = await myntedAPI.get<AccountIdentities>('/auth/identities')
  return data
}

/** Define contraseña en una cuenta nacida por OAuth, o cambia la existente. */
export async function setPasswordRequest(payload: SetPasswordPayload): Promise<AuthUser> {
  const { data } = await myntedAPI.post<{ user: AuthUser }>('/auth/set-password', payload)
  return data.user
}

export async function unlinkProviderRequest(
  provider: OAuthProvider,
): Promise<{ message: string }> {
  const { data } = await myntedAPI.delete<{ message: string }>(`/auth/unlink/${provider}`)
  return data
}
