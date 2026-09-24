import type { AuthUser, PaymentType, SellerRequestStatus, UserRole } from '@/features/auth/models/auth'

/**
 * Usuario tal como lo devuelve GET /users (solo superadmin). Es la misma
 * entidad User del backend que /users/me, pero acá sí nos importan los
 * campos de administración (isActive, sellerRequestedAt...).
 */
export interface AdminUser extends AuthUser {
  role: UserRole
  sellerRequestStatus: SellerRequestStatus
  sellerRequestedAt: string | null
  isActive: boolean
  locale?: string | null
  currency?: string | null
  acceptedPrivacyPolicyAt?: string | null
  privacyPolicyVersion?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
}

/** Cuenta de cobro que la persona registró al pedir ser vendedora (PaymentInfo en el backend). */
export interface SellerPaymentInfo {
  paymentInfoId: number
  ownerFullName: string
  /** Nombre del banco, o nombre del titular de la cuenta PayPal. */
  name: string
  /** Número de cuenta/IBAN, o correo de la cuenta PayPal. */
  number: string
  type: PaymentType
}

/**
 * GET /users/seller-request/:id — [Superadmin] el Seller creado por la
 * solicitud pendiente de un usuario. `paymentInfo` es opcional porque el
 * backend solo lo incluye si carga esa relación.
 */
export interface SellerRequestDetail {
  sellerId: number
  displayName: string
  description: string
  location: string
  isVerified: boolean
  userId: string
  paymentId: number
  paymentInfo?: SellerPaymentInfo | null
  user: AdminUser
}

/** Decisión sobre una solicitud de vendedor (ver UpdateSellerStatusDto en el backend). */
export type SellerDecision = 'approved' | 'rejected'

export const ADMIN_SECTIONS = ['communities', 'categories', 'users', 'sellerRequests'] as const
export type AdminSection = (typeof ADMIN_SECTIONS)[number]

export const ADMIN_TABS = ['overview', 'manage'] as const
export type AdminTab = (typeof ADMIN_TABS)[number]
