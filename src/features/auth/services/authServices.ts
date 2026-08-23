import myntedAPI from '@/api/apiConfig'
import type { AuthUser, LoginPayload, LogoutResponse, RegisterPayload } from '../models/auth'

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await myntedAPI.post<AuthUser>('/auth/login', payload)
  return data
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

// TODO(backend): el login social todavía no forma parte de los endpoints conectados.
export async function socialLoginRequest(provider: 'google' | 'facebook'): Promise<AuthUser> {
  console.debug('[auth] socialLoginRequest (stub, sin backend todavía):', provider)
  throw new Error(`Sign-in with ${provider} isn't connected to the backend yet.`)
}
