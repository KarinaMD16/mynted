import type { PaginatedResponse } from '@/features/community/models/communityDTOs'
import type { SubscriptionPeriod } from '@/features/pro/models/subscription'

/**
 * Notificaciones dentro de la app (docs/GUIA_NOTIFICACIONES_FRONTEND.md del
 * backend). Toda notificación se guarda (GET /notifications) y además llega en
 * vivo por el mismo socket del chat (`notification:new`).
 *
 * El texto lo arma el frontend con `type` + `data` (ver utils/notificationContent).
 * `message` es solo un respaldo en español para un `type` que todavía no
 * conozcamos.
 */

export const NOTIFICATION_TYPES = [
  'favorite_price_changed',
  'favorite_unavailable',
  'favorite_available_again',
  'purchase_completed',
  'sale_completed',
  // Seguimiento del pedido (docs/FLUJO_COMPRAS_PAGOS.md del backend).
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'payment_refunded',
  'payment_dispute_closed',
  'review_received',
  'badge_awarded',
  'community_join_requested',
  'community_join_accepted',
  'community_join_rejected',
  'community_member_removed',
  'community_moderator_added',
  'community_moderator_removed',
  'seller_request_approved',
  'seller_request_rejected',
  'post_replied',
  'reply_replied',
  'subscription_payment_confirmed',
  'subscription_expiring_soon',
  'subscription_expired',
  'community_moderation_warning',
  // Moderación (docs/frontend-moderation-reports-api.md del backend).
  'moderation_warning',
  'content_hidden',
  'content_restored',
  'product_deactivated',
  'product_activated',
  'product_deleted',
  'seller_revoked',
  'seller_restored',
  'user_deactivated',
  'user_reactivated',
  'community_deactivated',
  'community_activated',
  'community_made_public',
  'community_made_private',
  'community_deleted',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

/** Por qué un favorito dejó de estar disponible. */
export type FavoriteUnavailableReason = 'sold' | 'inactive' | 'hidden' | 'deleted'

interface ProductRef {
  productId: number
  productTitle: string
}

interface OrderRef extends ProductRef {
  transactionId: string
}

interface CommunityRef {
  communityId: number
  communityName: string
  communitySlug: string
}

interface PostReplyData {
  postId: number
  postTitle: string
  replyId: number
  communityId: number
  communitySlug: string
  authorUsername: string
}

/** `data` de cada tipo (sección 4 de la guía). Los montos van en la moneda original. */
export interface NotificationDataByType {
  favorite_price_changed: ProductRef & { previousPrice: number; newPrice: number; currency: string }
  favorite_unavailable: ProductRef & { reason: FavoriteUnavailableReason }
  favorite_available_again: ProductRef
  purchase_completed: ProductRef & { transactionId: string; amount: number; currency: string; sellerName: string }
  sale_completed: ProductRef & { transactionId: string; amount: number; currency: string; buyerUsername: string }
  review_received: ProductRef & { reviewId: number; rating: number; authorUsername: string }
  /** Al comprador. No traen dirección ni número de guía: eso está en el recibo. */
  order_shipped: OrderRef
  /** Al vendedor. */
  order_delivered: OrderRef
  /** Al comprador: el vendedor canceló y se le reembolsó. */
  order_cancelled: OrderRef
  /**
   * Resolución de un reclamo. Llega igual a las dos partes, sin decir quién es
   * quién, así que el texto no puede asumirlo.
   */
  payment_refunded: OrderRef
  payment_dispute_closed: OrderRef
  badge_awarded: {
    badgeCode: string
    badgeName: string
    rarity: string
    scope: 'user' | 'community'
    /** Solo si es un badge de comunidad. */
    communityProfileId?: number
    communityId?: number
    communityName?: string
    communitySlug?: string
  }
  community_join_requested: CommunityRef & { requestId: number; requesterId: string; requesterUsername: string }
  community_join_accepted: CommunityRef & { requestId: number }
  community_join_rejected: CommunityRef & { requestId: number }
  /** Expulsión: puede volver a unirse. `reason` lo escribió quien moderó. */
  community_member_removed: CommunityRef & { reason: string }
  community_moderator_added: CommunityRef
  community_moderator_removed: CommunityRef
  seller_request_approved: { sellerId: number | string; displayName: string }
  seller_request_rejected: Record<string, never>
  post_replied: PostReplyData
  reply_replied: PostReplyData & { parentReplyId: number }
  /** Mynted Pro (sección 10 de la guía Pro). Montos en USD, fechas en ISO. */
  subscription_payment_confirmed: {
    paymentId: string
    period: SubscriptionPeriod
    amount: number
    currency: string
    startsAt: string
    endsAt: string
    /** true si ya era Pro y se extendió; false si es el primer pago o volvió tras vencer. */
    renewal: boolean
  }
  subscription_expiring_soon: {
    subscriptionId: string
    period: SubscriptionPeriod
    endsAt: string
    daysRemaining: number
    /** true si canceló: el texto no le pide renovar "para no perder" nada. */
    cancelAtPeriodEnd: boolean
  }
  subscription_expired: { subscriptionId: string; period: SubscriptionPeriod; endsAt: string }
  /**
   * El superadmin resolvió un reporte contra la comunidad de quien la creó.
   * Es genérica a propósito: no trae el reporte ni su motivo, ni el slug.
   */
  community_moderation_warning: { communityId: number; communityName: string }
  /**
   * Al resolver un reporte contra algo que publicó: advertencia (sin ocultar)
   * u ocultado. No trae título ni slug, así que una publicación no se enlaza.
   */
  moderation_warning: ModeratedItemRef & { warned?: boolean }
  /** `reason` es el motivo del reporte (spam, acoso...), no un texto libre. */
  content_hidden: ModeratedItemRef & { reason?: string; warned?: boolean }
  content_restored: { itemType: ModeratedItemType; itemId: number }
  /** Acciones de administración sobre un producto; `reason` lo escribió quien moderó. */
  product_deactivated: { productId: number; reason: string }
  product_activated: { productId: number; reason: string }
  product_deleted: { productId: number; reason: string }
  seller_revoked: { reason: string }
  seller_restored: Record<string, never>
  /** También llega cuando la cuenta se elimina: el backend usa el mismo tipo. */
  user_deactivated: { reason: string }
  user_reactivated: Record<string, never>
  /** Al equipo de la comunidad (dueño y moderadores). Sin slug: no se enlaza. */
  community_deactivated: { communityId: number; communityName: string }
  community_activated: { communityId: number; communityName: string }
  community_made_public: { communityId: number; communityName: string }
  community_made_private: { communityId: number; communityName: string }
  community_deleted: { communityId: number; communityName: string; reason: string }
}

/** Lo que se puede moderar desde un reporte. */
export type ModeratedItemType = 'post' | 'reply' | 'product' | 'conversation'

interface ModeratedItemRef {
  itemType: ModeratedItemType
  itemId: number
  communityId: number | null
}

/** Notificación tal como llega del backend (REST o socket). */
export interface AppNotification {
  /** uuid. Una notificación unificada conserva el mismo id. */
  id: string
  type: string
  data: Record<string, unknown>
  /** Texto de respaldo en español. */
  message: string
  /** null = sin leer. */
  readAt: string | null
  /** Se renueva al unificarse (la notificación vuelve arriba). */
  createdAt: string
}

/** Una notificación de un tipo conocido, con `data` tipada según `type`. */
export type KnownNotification = {
  [K in NotificationType]: Omit<AppNotification, 'type' | 'data'> & { type: K; data: NotificationDataByType[K] }
}[NotificationType]

export function isKnownNotification(notification: AppNotification): notification is AppNotification & KnownNotification {
  return (NOTIFICATION_TYPES as readonly string[]).includes(notification.type)
}

/** Filtro de la lista: todas o solo las no leídas (`unread=true`). */
export type NotificationsFilter = 'all' | 'unread'

export type NotificationsPage = PaginatedResponse<AppNotification>

export interface UnreadCountResponse {
  unreadCount: number
}

export interface MarkAllReadResponse {
  updated: number
  unreadCount: number
}

/** Payload de `notification:new`: nueva, o unificada que volvió arriba con datos nuevos. */
export interface NotificationNewPayload {
  notification: AppNotification
  unreadCount: number
}

/** Payload de `notification:unread-count`: el contador cambió (leer, marcar todas, borrar, otra pestaña). */
export type NotificationUnreadCountPayload = UnreadCountResponse
