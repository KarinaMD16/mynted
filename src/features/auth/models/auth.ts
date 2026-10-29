import type { CosmeticAsset, EffectiveCosmetics } from '@/features/pro/models/cosmetics'
import type { ResponseTime } from '@/features/stores/models/store'

export const OAUTH_PROVIDERS = ['google', 'facebook'] as const

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

/** Espeja el enum UserRole del backend (users/entities/user.entity.ts). */
export type UserRole = 'user' | 'seller' | 'superadmin'

/** Espeja el enum SellerRequestStatus del backend. */
export type SellerRequestStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'revoked'

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
  /**
   * Moneda en la que el usuario publica sus precios (ISO 4217, p. ej. CRC).
   * Para publicar productos es OBLIGATORIA: ya no hay USD por defecto.
   */
  currency?: string | null
  /**
   * Moneda en la que la persona VE los precios (se elige en /settings). null si
   * nunca la eligió: entonces se usa `currency`. Solo afecta la visualización.
   */
  displayCurrency?: string | null
  /** País de la persona (ISO 3166-1 alfa-2, p. ej. CR): "dónde recibo mis compras". */
  country?: string | null
  locale?: string | null
  /** Preferencias de notificación (ver /settings, pestaña Notificaciones). */
  emailNotifications?: boolean
  pushNotifications?: boolean
  /** Pedir confirmación antes de quitar un favorito (el backend no lo impone; lo aplica el front). */
  confirmUnfavorite?: boolean
  /** Cuándo aceptó la Política de Privacidad y qué versión (ver /settings, pestaña Privacidad). */
  acceptedPrivacyPolicyAt?: string | null
  privacyPolicyVersion?: string
  /**
   * Su tienda, solo si es vendedor APROBADO (un pendiente o rechazado no lo
   * trae). Con `sellerId` se abre /sellers/:sellerId.
   */
  seller?: PublicSeller
  /** Mynted Pro vigente ahora mismo (lo calcula el backend en cada respuesta). */
  isPro?: boolean
  /** Cosméticos EFECTIVOS (banner, ganso y marco): lo que se pinta (ver features/pro). */
  cosmetics?: EffectiveCosmetics
}

/** Objeto `seller` del perfil público y de GET /users/me: solo vendedores aprobados. */
export interface PublicSeller {
  /** Id de la tienda (no el User.id): para abrir /sellers/:sellerId. */
  sellerId: number
  displayName: string
  isVerified: boolean
  /** Promedio de las reseñas de sus productos; null si no tiene. */
  ratingAverage: number | null
  reviewsCount: number
  /** null si tiene menos de 3 conversaciones respondidas. */
  responseTime: ResponseTime | null
}

/**
 * Vista pública de un usuario (GET /users/:id, /users/by-username/:username,
 * /users/search y /search): nunca trae correo, locale, moneda, preferencias ni
 * datos de la solicitud de vendedor. (Un superadmin recibe el usuario completo.)
 */
export interface PublicUser {
  id: string
  username: string
  photoUrl: string | null
  bio: string | null
  location: string | null
  role: UserRole
  createdAt: string
  /** Solo si es vendedor aprobado. */
  seller?: PublicSeller
  /** Pro vigente: pinta el badge Pro. */
  isPro?: boolean
  /** Marco efectivo del avatar (igual a `cosmetics.frame`). */
  frame?: CosmeticAsset
  /** Cosméticos efectivos completos (perfil público y búsqueda de usuarios). */
  cosmetics?: EffectiveCosmetics
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

/** POST /auth/request-email-change (ver RequestEmailChangeDto en el backend). */
export interface RequestEmailChangePayload {
  newEmail: string
}

/** POST /auth/confirm-email-change: el token llega en el enlace enviado al correo nuevo. */
export interface ConfirmEmailChangePayload {
  token: string
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
