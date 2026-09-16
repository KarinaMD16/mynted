export const OAUTH_PROVIDERS = ['google', 'facebook'] as const

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

/** Espeja el enum UserRole del backend (users/entities/user.entity.ts). */
export type UserRole = 'user' | 'seller' | 'superadmin'

/** Espeja el enum SellerRequestStatus del backend. */
export type SellerRequestStatus = 'none' | 'pending' | 'approved' | 'rejected'

/** Espeja el enum PaymentType del backend (sellers/entities/payment-info.entity.ts). */
export type PaymentType = 'bank_account' | 'paypal'

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
  sellerRequestStatus?: SellerRequestStatus
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

/** POST /auth/change-password (ver ChangePasswordDto en el backend). */
export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

/**
 * POST users/me/request-seller (ver RequestSellerDto en el backend). `name` y
 * `number` cambian de sentido según `type`: para banco son el nombre del
 * banco y el número de cuenta/IBAN; para PayPal, el nombre del titular y el
 * correo de la cuenta.
 */
export interface RequestSellerPayload {
  displayName: string
  description: string
  location: string
  ownerFullName: string
  name: string
  number: string
  type: PaymentType
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
