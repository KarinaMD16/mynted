import { useCallback } from 'react'
import { toast } from 'sonner'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import type { AppNotification } from '../models/notifications'
import { useNotificationActions } from '../hooks/useNotificationMutations'
import { useNotificationsSync } from '../hooks/useNotificationsSync'
import { useGoToNotificationTarget } from '../hooks/useOpenNotification'
import { getNotificationContent } from '../utils/notificationContent'

/**
 * Escucha las notificaciones en vivo (ver useNotificationsSync) y, si la
 * persona tiene activados los avisos (`pushNotifications`, que por defecto es
 * true), muestra un aviso emergente con un botón para abrirla. La campana y el
 * contador se actualizan igual, con o sin aviso.
 *
 * Va una sola vez en App, después de ChatRealtime (que conecta el socket).
 */
export function NotificationsRealtime() {
  const { data: user, userId } = useCurrentUser()
  const { t, language } = useLanguage()
  const { markRead } = useNotificationActions()
  const goTo = useGoToNotificationTarget()
  const showToasts = user?.pushNotifications ?? true

  const handleNew = useCallback(
    (notification: AppNotification) => {
      if (!showToasts) return
      const { text, target } = getNotificationContent(notification, t, language)
      // Mismo id para una notificación unificada: reemplaza el aviso anterior en vez de apilar otro.
      toast(text, {
        id: notification.id,
        action: target
          ? {
              label: t('notifications.view'),
              onClick: () => {
                markRead.mutate(notification.id)
                void goTo(target)
              },
            }
          : undefined,
      })
    },
    [showToasts, t, language, markRead, goTo],
  )

  useNotificationsSync(userId, handleNew)

  return null
}
