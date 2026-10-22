import { X } from 'lucide-react'
import { BadgeIcon } from '@/features/badges/components/BadgeIcon'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatRelativeTime } from '@/utils/relativeTime'
import type { AppNotification } from '../models/notifications'
import { getNotificationContent } from '../utils/notificationContent'

interface NotificationItemProps {
  notification: AppNotification
  /** Al tocarla: se marca como leída y, si tiene destino, se navega. */
  onOpen: (notification: AppNotification) => void
  onDelete: (notification: AppNotification) => void
}

/** Una fila de la campana: ícono (o el badge ganado), texto, hace cuánto y "sin leer". */
export function NotificationItem({ notification, onOpen, onDelete }: NotificationItemProps) {
  const { t, language } = useLanguage()
  const { text, icon: Icon, badge } = getNotificationContent(notification, t, language)
  const isUnread = notification.readAt === null

  return (
    <li className={cx('group relative flex items-start rounded-xl transition-colors', isUnread ? 'bg-mynted-orange/8' : 'hover:bg-mynted-bg')}>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 pr-9 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mynted-blue-mid"
      >
        {badge ? (
          <BadgeIcon code={badge.code} rarity={badge.rarity} className="size-9" />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mynted-bg text-mynted-ink" aria-hidden="true">
            <Icon className="size-[18px]" />
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className={cx('line-clamp-3 text-sm text-mynted-ink', isUnread && 'font-medium')}>{text}</span>
          <span className="text-xs text-mynted-gray">
            <time dateTime={notification.createdAt}>{formatRelativeTime(notification.createdAt, language)}</time>
            {isUnread && <span className="sr-only"> · {t('notifications.unread')}</span>}
          </span>
        </span>
        {isUnread && <span className="absolute top-3.5 right-3 size-2 rounded-full bg-mynted-orange group-hover:opacity-0 group-focus-within:opacity-0" aria-hidden="true" />}
      </button>

      {/* Hermano del botón principal (no anidado). Visible al pasar el mouse o con foco; en pantallas táctiles, siempre. */}
      <button
        type="button"
        onClick={() => onDelete(notification)}
        aria-label={t('notifications.delete')}
        title={t('notifications.delete')}
        className="absolute top-2 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-lg text-mynted-gray opacity-0 transition-opacity outline-none group-hover:opacity-100 hover:bg-mynted-white hover:text-mynted-ink focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-mynted-blue-mid pointer-coarse:opacity-100"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}
