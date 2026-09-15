import myntedAPI from '@/api/apiConfig'
import type {
  AuthUser,
  LoginPayload,
  LogoutResponse,
  RegisterPayload,
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

// -----------------------------------------------------------------------------
// Login social
// -----------------------------------------------------------------------------

/**
 * El backend no redirige al proveedor: recibe el token que el SDK ya consiguió
 * en el navegador, lo verifica contra Google/Facebook y responde con la sesión
 * en una cookie httpOnly (`access_token`) más el usuario en el body.
 *
 * Si el correo del proveedor ya tiene cuenta local, el backend la vincula solo
 */
export async function loginWithGoogleRequest(idToken: string): Promise<AuthUser> {
  const { data } = await myntedAPI.post<{ user: AuthUser }>('/auth/google', { idToken })
  return data.user
}

export async function loginWithFacebookRequest(accessToken: string): Promise<AuthUser> {
  const { data } = await myntedAPI.post<{ user: AuthUser }>('/auth/facebook', { accessToken })
  return data.user
}
