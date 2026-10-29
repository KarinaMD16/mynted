import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { NotificationTarget } from '../utils/notificationContent'

/** Navega al destino de una notificación (ver getNotificationContent). */
export function useGoToNotificationTarget() {
  const navigate = useNavigate()

  return useCallback(
    (target: NotificationTarget) => {
      switch (target.kind) {
        case 'product':
          return navigate({ to: '/products/$productId', params: { productId: String(target.productId) }, hash: target.hash })
        case 'profile':
          return navigate({ to: '/profile' })
        case 'myProducts':
          return navigate({ to: '/my-products' })
        case 'store':
          return navigate({ to: '/sellers/$sellerId', params: { sellerId: String(target.sellerId) } })
        case 'community':
          return navigate({ to: '/communities/$slug', params: { slug: target.slug } })
        case 'communityRequests':
          return navigate({ to: '/communities/$slug/moderacion', params: { slug: target.slug }, search: { tab: 'requests' } })
        case 'communityModeration':
          return navigate({ to: '/communities/$slug/moderacion', params: { slug: target.slug } })
        case 'post':
          return navigate({
            to: '/communities/$slug/posts/$postId',
            params: { slug: target.slug, postId: String(target.postId) },
            hash: target.replyId !== undefined ? `reply-${target.replyId}` : undefined,
          })
        case 'subscription':
          return navigate({ to: '/settings', search: { tab: 'subscription' } })
        case 'proPlans':
          return navigate({ to: '/pro' })
        case 'receipt':
          return navigate({ to: '/compras/$transactionId', params: { transactionId: target.transactionId } })
      }
    },
    [navigate],
  )
}
