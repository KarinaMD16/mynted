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
  'review_received',
  'badge_awarded',
  'community_join_requested',
  'community_join_accepted',
  'community_join_rejected',
  'seller_request_approved',
  'seller_request_rejected',
  'post_replied',
  'reply_replied',
  'subscription_payment_confirmed',
  'subscription_expiring_soon',
  'subscription_expired',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

/** Por qué un favorito dejó de estar disponible. */
export type FavoriteUnavailableReason = 'sold' | 'inactive' | 'hidden' | 'deleted'

interface ProductRef {
  productId: number
  productTitle: string
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
