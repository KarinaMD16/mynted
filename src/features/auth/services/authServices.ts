import myntedAPI from '@/api/apiConfig'
import type {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  LogoutResponse,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from '../models/auth'

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  // AuthController.login responde { user: {...} }, no el usuario "pelado".
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

// TODO(backend): el login social todavía no forma parte de los endpoints conectados.
export async function socialLoginRequest(provider: 'google' | 'facebook'): Promise<AuthUser> {
  console.debug('[auth] socialLoginRequest (stub, sin backend todavía):', provider)
  throw new Error(`Sign-in with ${provider} isn't connected to the backend yet.`)
}

export async function forgotPasswordRequest(payload: ForgotPasswordPayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/forgot-password', payload)
  return data
}

export async function resetPasswordRequest(payload: ResetPasswordPayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/reset-password', payload)
  return data
}
