export const OAUTH_PROVIDERS = ['google', 'facebook'] as const

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

export interface LoginPayload {
  email: string
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
  /** Lo pone en true un proveedor OAuth, o confirmar una vinculación con la contraseña. */
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface LogoutResponse {
  message: string
}

/** Contraseña de la cuenta local, para cerrar una vinculación pendiente. */
export interface LinkConfirmPayload {
  password: string
}

export interface SetPasswordPayload {
  /** Obligatoria solo si la cuenta ya tiene contraseña definida. */
  currentPassword?: string
  newPassword: string
}

export interface LinkedProvider {
  provider: OAuthProvider
  linkedAt: string
}

/** Métodos de acceso disponibles en la cuenta actual. */
export interface AccountIdentities {
  hasPassword: boolean
  providers: LinkedProvider[]
}

/**
 * Query params con los que el backend devuelve al usuario después de un flujo
 * OAuth. Nunca traen tokens: la sesión viaja en cookie httpOnly.
 */
export interface AuthCallbackSearch {
  newUser?: 'true'
  linked?: 'true'
  error?: string
  /** Detalle legible del fallo, cuando `error` es OAUTH_FAILED. */
  message?: string
  email?: string
  provider?: OAuthProvider
}

/** El proveedor trajo un email que ya tiene cuenta local sin verificar. */
export const LINK_REQUIRES_PASSWORD = 'LINK_REQUIRES_PASSWORD'

export const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
}
