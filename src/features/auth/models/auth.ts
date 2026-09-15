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
  createdAt: string
  updatedAt: string
}

export interface LogoutResponse {
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
