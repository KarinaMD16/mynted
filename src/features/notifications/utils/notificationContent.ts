import {
  Award,
  Bell,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleX,
  MessageSquareReply,
  PackageCheck,
  PackageX,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingDown,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { getBadgeTexts } from '@/features/badges/utils/badgeDisplay'
import type { BadgeRarity } from '@/features/badges/models/badges'
import { formatPaymentDate } from '@/features/payments/utils/paymentFormat'
import { PERIOD_LABEL } from '@/features/pro/utils/subscriptionFormat'
import type { TranslateFn } from '@/i18n/LanguageContext'
import type { AppLanguage } from '@/utils/locale'
import { formatPrice } from '@/utils/price'
import { isKnownNotification, type AppNotification } from '../models/notifications'

/**
 * A dónde lleva tocar una notificación (sección 4 de la guía). Es una lista
 * cerrada para que NotificationItem navegue con rutas tipadas.
 */
export type NotificationTarget =
  | { kind: 'product'; productId: number; hash?: string }
  | { kind: 'profile' }
  | { kind: 'myProducts' }
  | { kind: 'store'; sellerId: number }
  | { kind: 'community'; slug: string }
  | { kind: 'communityRequests'; slug: string }
  | { kind: 'post'; slug: string; postId: number; replyId?: number }
  /** /settings?tab=subscription: estado de Mynted Pro e historial de pagos. */
  | { kind: 'subscription' }
  /** /pro: los planes, para renovar. */
  | { kind: 'proPlans' }

export interface NotificationContent {
  text: string
  icon: LucideIcon
  /** null: no hay a dónde ir (p. ej. el producto se borró o la solicitud fue rechazada). */
  target: NotificationTarget | null
  /** Para badge_awarded: se pinta el SVG del badge en vez del ícono. */
  badge?: { code: string; rarity: BadgeRarity | string }
}

/**
 * Texto, ícono y destino de una notificación a partir de `type` + `data`. Si
 * llega un `type` que todavía no conocemos, se usa `message` (respaldo en
 * español del backend) sin enlace.
 */
export function getNotificationContent(notification: AppNotification, t: TranslateFn, language: AppLanguage): NotificationContent {
  if (!isKnownNotification(notification)) {
    return { text: notification.message, icon: Bell, target: null }
  }

  const price = (amount: number, currency: string) => formatPrice(amount, currency, language)

  switch (notification.type) {
    case 'favorite_price_changed': {
      const { productId, productTitle, previousPrice, newPrice, currency } = notification.data
      const dropped = Number(newPrice) < Number(previousPrice)
      return {
        text: t(dropped ? 'notifications.favoritePriceDropped' : 'notifications.favoritePriceRaised', {
          product: productTitle,
          newPrice: price(newPrice, currency),
          previousPrice: price(previousPrice, currency),
        }),
        icon: dropped ? TrendingDown : TrendingUp,
        target: { kind: 'product', productId },
      }
    }
    case 'favorite_unavailable': {
      const { productId, productTitle, reason } = notification.data
      const key = {
        sold: 'notifications.favoriteSold',
        inactive: 'notifications.favoritePaused',
        hidden: 'notifications.favoriteHidden',
        deleted: 'notifications.favoriteDeleted',
      } as const
      return {
        text: t(key[reason] ?? key.inactive, { product: productTitle }),
        icon: PackageX,
        // Un producto borrado ya no tiene detalle.
        target: reason === 'deleted' ? null : { kind: 'product', productId },
      }
    }
    case 'favorite_available_again': {
      const { productId, productTitle } = notification.data
      return {
        text: t('notifications.favoriteAvailableAgain', { product: productTitle }),
        icon: PackageCheck,
        target: { kind: 'product', productId },
      }
    }
    case 'purchase_completed': {
      const { productId, productTitle, amount, currency, sellerName } = notification.data
      return {
        text: t('notifications.purchaseCompleted', { product: productTitle, seller: sellerName, amount: price(amount, currency) }),
        icon: ShoppingBag,
        // Todavía no hay pantalla de recibo (GET /payments/:transactionId): se abre el producto.
        target: { kind: 'product', productId },
      }
    }
    case 'sale_completed': {
      const { productId, productTitle, amount, currency, buyerUsername } = notification.data
      return {
        text: t('notifications.saleCompleted', { product: productTitle, buyer: buyerUsername, amount: price(amount, currency) }),
        icon: Receipt,
        // Sin recibo ni historial de ventas en el frontend todavía: se abre el producto.
        target: { kind: 'product', productId },
      }
    }
    case 'review_received': {
      const { productId, productTitle, rating, authorUsername } = notification.data
      return {
        text: t('notifications.reviewReceived', { author: authorUsername, rating, product: productTitle }),
        icon: Star,
        target: { kind: 'product', productId, hash: 'reviews' },
      }
    }
    case 'badge_awarded': {
      const { badgeCode, badgeName, rarity, scope, communityName, communitySlug } = notification.data
      const { name } = getBadgeTexts(
        { code: badgeCode, name: badgeName, description: '', scope, rarity: rarity as BadgeRarity, awardedAt: null, derived: false },
        t,
      )
      const inCommunity = scope === 'community' && communitySlug
      return {
        text: inCommunity
          ? t('notifications.badgeAwardedCommunity', { badge: name, community: communityName ?? '' })
          : t('notifications.badgeAwarded', { badge: name }),
        icon: Award,
        badge: { code: badgeCode, rarity },
        target: inCommunity ? { kind: 'community', slug: communitySlug } : { kind: 'profile' },
      }
    }
    case 'community_join_requested': {
      const { communityName, communitySlug, requesterUsername } = notification.data
      return {
        text: t('notifications.joinRequested', { user: requesterUsername, community: communityName }),
        icon: UserPlus,
        target: { kind: 'communityRequests', slug: communitySlug },
      }
    }
    case 'community_join_accepted': {
      const { communityName, communitySlug } = notification.data
      return {
        text: t('notifications.joinAccepted', { community: communityName }),
        icon: CircleCheck,
        target: { kind: 'community', slug: communitySlug },
      }
    }
    case 'community_join_rejected':
      return {
        text: t('notifications.joinRejected', { community: notification.data.communityName }),
        icon: CircleX,
        target: null,
      }
    case 'seller_request_approved':
      return {
        text: t('notifications.sellerApproved', { store: notification.data.displayName }),
        icon: Store,
        target: { kind: 'store', sellerId: Number(notification.data.sellerId) },
      }
    case 'seller_request_rejected':
      return { text: t('notifications.sellerRejected'), icon: CircleX, target: null }
    case 'community_moderation_warning':
      // Sin slug no hay ruta a la comunidad.
      return {
        text: t('notifications.communityWarning', { community: notification.data.communityName }),
        icon: ShieldAlert,
        target: null,
      }
    case 'post_replied':
    case 'reply_replied': {
      const { postId, postTitle, replyId, communitySlug, authorUsername } = notification.data
      return {
        text: t(notification.type === 'post_replied' ? 'notifications.postReplied' : 'notifications.replyReplied', {
          author: authorUsername,
          post: postTitle,
        }),
        icon: MessageSquareReply,
        target: { kind: 'post', slug: communitySlug, postId, replyId },
      }
    }
    case 'subscription_payment_confirmed': {
      const { period, endsAt, renewal } = notification.data
      const date = formatPaymentDate(endsAt, language)
      return {
        text: renewal
          ? t('notifications.subscriptionRenewed', { period: t(PERIOD_LABEL[period] ?? 'pro.period.monthly'), date })
          : t('notifications.subscriptionPaymentConfirmed', { date }),
        icon: Sparkles,
        target: { kind: 'subscription' },
      }
    }
    case 'subscription_expiring_soon': {
      const { endsAt, cancelAtPeriodEnd } = notification.data
      const date = formatPaymentDate(endsAt, language)
      return {
        // Si canceló, no se le dice "renueva para no perder tus beneficios".
        text: t(cancelAtPeriodEnd ? 'notifications.subscriptionExpiringCancelled' : 'notifications.subscriptionExpiringSoon', { date }),
        icon: CalendarClock,
        target: { kind: 'proPlans' },
      }
    }
    case 'subscription_expired':
      return {
        text: t('notifications.subscriptionExpired', { date: formatPaymentDate(notification.data.endsAt, language) }),
        icon: CalendarX,
        target: { kind: 'proPlans' },
      }
  }
}
