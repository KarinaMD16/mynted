import {
  Award,
  Ban,
  Bell,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleX,
  EyeOff,
  Globe,
  Lock,
  MessageSquareReply,
  PackageCheck,
  PackageX,
  RotateCcw,
  Truck,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { getBadgeTexts } from '@/features/badges/utils/badgeDisplay'
import type { BadgeRarity } from '@/features/badges/models/badges'
import { formatPaymentDate } from '@/features/payments/utils/paymentFormat'
import { PERIOD_LABEL } from '@/features/pro/utils/subscriptionFormat'
import { REPORT_REASON_LABEL, type ReportReason } from '@/features/reports/models/report'
import type { TranslateFn } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { AppLanguage } from '@/utils/locale'
import { formatPrice } from '@/utils/price'
import { isKnownNotification, type AppNotification, type ModeratedItemType } from '../models/notifications'

/*
 * Lo moderado se nombra por tipo (y no con una palabra suelta) para que cada
 * idioma arme la frase con su propio género y artículo.
 */
const WARNING_TEXT: Record<ModeratedItemType, TranslationKey> = {
  post: 'notifications.moderationWarning.post',
  reply: 'notifications.moderationWarning.reply',
  product: 'notifications.moderationWarning.product',
  conversation: 'notifications.moderationWarning.conversation',
}

const HIDDEN_TEXT: Record<ModeratedItemType, TranslationKey> = {
  post: 'notifications.contentHidden.post',
  reply: 'notifications.contentHidden.reply',
  product: 'notifications.contentHidden.product',
  conversation: 'notifications.contentHidden.conversation',
}

const RESTORED_TEXT: Record<ModeratedItemType, TranslationKey> = {
  post: 'notifications.contentRestored.post',
  reply: 'notifications.contentRestored.reply',
  product: 'notifications.contentRestored.product',
  conversation: 'notifications.contentRestored.conversation',
}

/** Solo un producto se abre con lo que trae el aviso: una publicación necesitaría el slug. */
function moderatedTarget(itemType: ModeratedItemType, itemId: number): NotificationTarget | null {
  return itemType === 'product' ? { kind: 'product', productId: itemId } : null
}

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
  /** El panel de moderación de la comunidad, en su pestaña inicial. */
  | { kind: 'communityModeration'; slug: string }
  | { kind: 'post'; slug: string; postId: number; replyId?: number }
  /** /settings?tab=subscription: estado de Mynted Pro e historial de pagos. */
  | { kind: 'subscription' }
  /** /pro: los planes, para renovar. */
  | { kind: 'proPlans' }
  /** /compras/:id: el recibo con el seguimiento del pedido. */
  | { kind: 'receipt'; transactionId: string }

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
    case 'order_shipped':
      return {
        text: t('notifications.orderShipped', { product: notification.data.productTitle }),
        icon: Truck,
        target: { kind: 'receipt', transactionId: notification.data.transactionId },
      }
    case 'order_delivered':
      return {
        text: t('notifications.orderDelivered', { product: notification.data.productTitle }),
        icon: PackageCheck,
        target: { kind: 'receipt', transactionId: notification.data.transactionId },
      }
    case 'order_cancelled':
      return {
        text: t('notifications.orderCancelled', { product: notification.data.productTitle }),
        icon: PackageX,
        target: { kind: 'receipt', transactionId: notification.data.transactionId },
      }
    case 'payment_refunded':
      return {
        text: t('notifications.paymentRefunded', { product: notification.data.productTitle }),
        icon: RotateCcw,
        target: { kind: 'receipt', transactionId: notification.data.transactionId },
      }
    case 'payment_dispute_closed':
      return {
        text: t('notifications.paymentDisputeClosed', { product: notification.data.productTitle }),
        icon: CircleCheck,
        target: { kind: 'receipt', transactionId: notification.data.transactionId },
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
    case 'community_member_removed': {
      const { communityName, communitySlug, reason } = notification.data
      return {
        text: t('notifications.memberRemoved', { community: communityName, reason }),
        icon: UserMinus,
        // Sigue pudiendo verla y volver a unirse.
        target: { kind: 'community', slug: communitySlug },
      }
    }
    case 'community_moderator_added': {
      const { communityName, communitySlug } = notification.data
      return {
        text: t('notifications.moderatorAdded', { community: communityName }),
        icon: ShieldCheck,
        target: { kind: 'communityModeration', slug: communitySlug },
      }
    }
    case 'community_moderator_removed': {
      const { communityName, communitySlug } = notification.data
      return {
        text: t('notifications.moderatorRemoved', { community: communityName }),
        icon: ShieldOff,
        target: { kind: 'community', slug: communitySlug },
      }
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
    case 'moderation_warning': {
      const { itemType, itemId } = notification.data
      return {
        text: t(WARNING_TEXT[itemType] ?? 'notifications.moderationWarning.generic'),
        icon: ShieldAlert,
        target: moderatedTarget(itemType, itemId),
      }
    }
    case 'content_hidden': {
      const { itemType, itemId, reason } = notification.data
      const reasonKey = reason ? REPORT_REASON_LABEL[reason as ReportReason] : undefined
      const text = t(HIDDEN_TEXT[itemType] ?? 'notifications.contentHidden.generic')
      return {
        text: reasonKey ? `${text} ${t('notifications.moderationReason', { reason: t(reasonKey) })}` : text,
        icon: EyeOff,
        // Oculto lo sigue viendo su dueño, así que el producto se puede abrir.
        target: moderatedTarget(itemType, itemId),
      }
    }
    case 'content_restored': {
      const { itemType, itemId } = notification.data
      return {
        text: t(RESTORED_TEXT[itemType] ?? 'notifications.contentRestored.generic'),
        icon: ShieldCheck,
        target: moderatedTarget(itemType, itemId),
      }
    }
    case 'product_deactivated':
      return {
        text: t('notifications.productDeactivated', { reason: notification.data.reason }),
        icon: Ban,
        target: { kind: 'product', productId: notification.data.productId },
      }
    case 'product_activated':
      return {
        text: t('notifications.productActivated'),
        icon: PackageCheck,
        target: { kind: 'product', productId: notification.data.productId },
      }
    case 'product_deleted':
      // Borrado ya no tiene detalle.
      return { text: t('notifications.productDeleted', { reason: notification.data.reason }), icon: Trash2, target: null }
    case 'seller_revoked':
      return { text: t('notifications.sellerRevoked', { reason: notification.data.reason }), icon: Ban, target: null }
    case 'seller_restored':
      return { text: t('notifications.sellerRestored'), icon: Store, target: { kind: 'myProducts' } }
    case 'user_deactivated':
      return { text: t('notifications.userDeactivated', { reason: notification.data.reason }), icon: Ban, target: null }
    case 'user_reactivated':
      return { text: t('notifications.userReactivated'), icon: CircleCheck, target: { kind: 'profile' } }
    // Al equipo de la comunidad. Sin slug no hay ruta a la comunidad.
    case 'community_deactivated':
      return {
        text: t('notifications.communityDeactivated', { community: notification.data.communityName }),
        icon: Ban,
        target: null,
      }
    case 'community_activated':
      return {
        text: t('notifications.communityActivated', { community: notification.data.communityName }),
        icon: CircleCheck,
        target: null,
      }
    case 'community_made_public':
      return {
        text: t('notifications.communityMadePublic', { community: notification.data.communityName }),
        icon: Globe,
        target: null,
      }
    case 'community_made_private':
      return {
        text: t('notifications.communityMadePrivate', { community: notification.data.communityName }),
        icon: Lock,
        target: null,
      }
    case 'community_deleted':
      return {
        text: t('notifications.communityDeleted', {
          community: notification.data.communityName,
          reason: notification.data.reason,
        }),
        icon: Trash2,
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
