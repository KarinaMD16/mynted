export const OAUTH_PROVIDERS = ['google', 'facebook'] as const

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

/** Espeja el enum UserRole del backend (users/entities/user.entity.ts). */
export type UserRole = 'user' | 'seller' | 'superadmin'

/** `identifier` acepta username o email (ver LoginDto en el backend). */
export interface LoginPayload {
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
  photoUrl: string | null
  createdAt: string
  updatedAt: string
  /**
   * El backend ya devuelve estos campos (User entity), pero el frontend
   * todavía no tenía pantallas que los usaran (ver ProfilePage). Opcionales
   * porque una respuesta vieja en cache de React Query, guardada antes de
   * este cambio, no los va a traer hasta el próximo refetch.
   */
  role?: UserRole
  bio?: string | null
  location?: string | null
}

export interface LogoutResponse {
  message: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}

/**
 * Login social: el navegador consigue el token en el proveedor y el backend lo
 * verifica. Google firma un ID token (JWT); Facebook entrega un access token.
 */
export interface GoogleLoginPayload {
  idToken: string
}

export interface FacebookLoginPayload {
  accessToken: string
}

export const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
}
