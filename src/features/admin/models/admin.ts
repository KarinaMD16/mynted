import type { AuthUser, PaymentType, SellerRequestStatus, UserRole } from '@/features/auth/models/auth'

/**
 * Usuario tal como lo devuelve GET /users (solo superadmin). Es la misma
 * entidad User del backend que /users/me, pero acá sí nos importan los
 * campos de administración (isActive, sellerRequestedAt...).
 */
/**
 * Una comunidad tal como la manda GET /communities/all (solo superadmin). Es
 * un listado distinto al público: incluye las desactivadas (isActive false) y
 * las eliminadas (deletedAt con fecha), y trae los contadores que importan
 * para moderar. No trae imagen, dueño ni etiquetas; para eso hay que entrar a
 * la comunidad.
 */
export interface AdminCommunity {
  id: number
  name: string
  slug: string
  description: string
  isActive: boolean
  isPrivate: boolean
  category: { categoryId: number; name: string } | null
  memberCount: number
  productCount: number
  pendingReportsCount: number
  createdAt: string
  deletedAt: string | null
}

/**
 * Un producto del vendedor, tal como lo manda GET /users/:id para el
 * superadmin. `isDeactivated` es la baja administrativa (la que aplica el
 * panel); `isHidden` es el ocultamiento por moderación de contenido.
 */
export interface AdminSellerProduct {
  id: number
  title: string
  status: string
  isDeactivated: boolean
  isHidden: boolean
  isVisible: boolean
  publishedAt: string | null
}

/**
 * Datos de la tienda que acompañan al usuario en el panel. `products` solo
 * viene en el detalle (GET /users/:id), no en el listado.
 */
export interface AdminUserSeller {
  sellerId: number
  status: SellerRequestStatus
  isVerified: boolean
  /** Nombre de la tienda. */
  displayName: string
  location: string
  productCount: number
  salesCount: number
  reportsReceivedCount: number
  products?: AdminSellerProduct[]
}

// Se omite `seller` de AuthUser: el público trae la tienda tal como la ve
// cualquiera, y acá hace falta el de administración, con métricas y productos.
export interface AdminUser extends Omit<AuthUser, 'seller'> {
  role: UserRole
  sellerRequestStatus: SellerRequestStatus
  sellerRequestedAt: string | null
  isActive: boolean
  /** `null` cuando la cuenta no es vendedora. */
  seller?: AdminUserSeller | null
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

/**
 * Decisión sobre un vendedor (ver UpdateSellerStatusDto en el backend).
 * `revoked` le quita el rol a uno ya aprobado y exige motivo.
 */
export type SellerDecision = 'approved' | 'rejected' | 'revoked'

/** GET /users/stats — contadores del resumen del panel. */
export interface AdminStats {
  totalUsers: number
  approvedSellers: number
  activeCommunities: number
  activeProducts: number
  pendingReports: number
}

export const ADMIN_SECTIONS = [
  'reports',
  'users',
  'sellers',
  'sellerRequests',
  'communities',
  'categories',
  'commissions',
  'moderationLog',
] as const
export type AdminSection = (typeof ADMIN_SECTIONS)[number]

export const ADMIN_TABS = ['overview', 'manage'] as const
export type AdminTab = (typeof ADMIN_TABS)[number]

/** Categoría de comunidades tal como la ve el panel: activas e inactivas. */
export interface AdminCategory {
  categoryId: number
  name: string
  isActive: boolean
}
