import myntedAPI from '@/api/apiConfig'
import type {
  AuthUser,
  ChangePasswordPayload,
  ConfirmEmailChangePayload,
  ForgotPasswordPayload,
  LoginPayload,
  LogoutResponse,
  MessageResponse,
  RegisterPayload,
  RequestEmailChangePayload,
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

/** GET /users/me — fuente de verdad de "¿hay sesión, y de quién?" (ver useCurrentUserQuery). */
export async function getCurrentUserRequest(): Promise<AuthUser> {
  const { data } = await myntedAPI.get<AuthUser>('/users/me')
  return data
}

/**
 * PATCH /users/me — multipart porque puede llevar una foto nueva (ver
 * /settings). Mismo patrón que createCommunity: hay que forzar el
 * Content-Type acá porque myntedAPI por defecto manda 'application/json'.
 */
export async function updateProfileRequest(formData: FormData): Promise<AuthUser> {
  const { data } = await myntedAPI.patch<AuthUser>('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
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

export async function forgotPasswordRequest(payload: ForgotPasswordPayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/forgot-password', payload)
  return data
}

export async function resetPasswordRequest(payload: ResetPasswordPayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/reset-password', payload)
  return data
}

/** POST /auth/change-password — requiere sesión activa (JwtAuthGuard), a diferencia de reset-password. */
export async function changePasswordRequest(payload: ChangePasswordPayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/change-password', payload)
  return data
}

/**
 * POST /auth/request-email-change — requiere sesión. Manda un enlace de
 * confirmación al correo NUEVO; el correo de la cuenta no cambia todavía.
 */
export async function requestEmailChangeRequest(payload: RequestEmailChangePayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/request-email-change', payload)
  return data
}

/** POST /auth/confirm-email-change — no requiere sesión: el token del enlace autoriza el cambio. */
export async function confirmEmailChangeRequest(payload: ConfirmEmailChangePayload): Promise<MessageResponse> {
  const { data } = await myntedAPI.post<MessageResponse>('/auth/confirm-email-change', payload)
  return data
}
