import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell01 } from '@untitledui/icons'
import { CheckCheck } from 'lucide-react'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components'
import { BlurAppear } from '@/components/ui/BlurAppear'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { formatBadgeCount } from '@/features/chat/utils/chatFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import type { AppNotification, NotificationsFilter } from '../models/notifications'
import { useNotificationActions } from '../hooks/useNotificationMutations'
import { useNotificationsList, useNotificationsUnreadBadge } from '../hooks/useNotificationsQueries'
import { useGoToNotificationTarget } from '../hooks/useOpenNotification'
import { getNotificationContent } from '../utils/notificationContent'
import { NotificationItem } from './NotificationItem'

/**
 * Campana del header con el contador de no leídas y, al abrirla, la lista.
 * El contador se pide al cargar la app y lo mantiene al día el socket
 * (useNotificationsSync); la lista se pide recién al abrir el menú.
 */
export function NotificationsMenu() {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const unread = useNotificationsUnreadBadge()

  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label={unread > 0 ? `${t('header.notifications')} · ${t('notifications.unreadCount', { count: unread })}` : t('header.notifications')}
        className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mynted-border bg-mynted-white text-mynted-ink outline-none transition-colors hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:bg-mynted-bg"
      >
        <Bell01 className="size-[22px]" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-mynted-orange px-1 text-[11px] leading-[18px] font-bold text-white tabular-nums ring-2 ring-mynted-white"
          >
            {formatBadgeCount(unread)}
          </span>
        )}
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog
          aria-label={t('header.notifications')}
          className="w-[min(380px,calc(100vw-2rem))] rounded-xl border border-mynted-border bg-mynted-white shadow-lg outline-none"
        >
          {({ close }) => (
            <BlurAppear>
              {isLoggedIn ? (
                <NotificationsPanel unread={unread} onClose={close} />
              ) : (
                <div className="p-4">
                  <p className="text-sm font-semibold text-mynted-ink">{t('header.notifications')}</p>
                  <p className="mt-2 text-sm text-mynted-gray">{t('notifications.signedOut')}</p>
                  <Link to="/login" onClick={close} className="mt-3 inline-block text-sm font-semibold text-mynted-blue hover:underline">
                    {t('notifications.signIn')}
                  </Link>
                </div>
              )}
            </BlurAppear>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}

const FILTERS: NotificationsFilter[] = ['all', 'unread']

function NotificationsPanel({ unread, onClose }: { unread: number; onClose: () => void }) {
  const { t, language } = useLanguage()
  const [filter, setFilter] = useState<NotificationsFilter>('all')
  const list = useNotificationsList(filter, true)
  const { markRead, markAllRead, remove } = useNotificationActions()
  const goTo = useGoToNotificationTarget()

  const notifications = list.data?.pages.flatMap((page) => page.data) ?? []

  const open = (notification: AppNotification) => {
    if (notification.readAt === null) markRead.mutate(notification.id)
    const { target } = getNotificationContent(notification, t, language)
    if (target) {
      onClose()
      void goTo(target)
    }
  }

  return (
    <div className="flex max-h-[min(560px,calc(100svh-120px))] flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-mynted-border px-4 pt-3.5 pb-2.5">
        <p className="text-sm font-semibold text-mynted-ink">{t('header.notifications')}</p>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-2 text-xs"
          disabled={unread === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          <CheckCheck className="size-3.5" aria-hidden="true" />
          {t('notifications.markAllRead')}
        </Button>
      </div>

      <div className="flex gap-1.5 px-4 py-2.5" role="group" aria-label={t('notifications.filterLabel')}>
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
            className={cx(
              'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid',
              filter === option ? 'bg-mynted-ink text-white' : 'bg-mynted-bg text-mynted-ink hover:bg-mynted-orange/15',
            )}
          >
            {t(option === 'all' ? 'notifications.filterAll' : 'notifications.filterUnread')}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {list.isPending ? (
          <ul className="flex flex-col gap-1 px-1" aria-busy="true">
            {[0, 1, 2].map((key) => (
              <li key={key} className="h-14 animate-pulse rounded-xl bg-mynted-bg" />
            ))}
          </ul>
        ) : list.isError ? (
          <div className="flex flex-col items-start gap-2 px-2 py-3">
            <p className="text-sm text-mynted-gray" role="alert">
              {t('notifications.loadError')}
            </p>
            <Button variant="secondary" size="sm" onClick={() => void list.refetch()}>
              {t('notifications.retry')}
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-mynted-gray">
            {filter === 'unread' ? t('notifications.emptyUnread') : t('header.notificationsEmpty')}
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-0.5">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onOpen={open}
                  onDelete={(item) => remove.mutate(item.id)}
                />
              ))}
            </ul>
            {list.hasNextPage && (
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                className="mt-1"
                isLoading={list.isFetchingNextPage}
                onClick={() => void list.fetchNextPage()}
              >
                {t('notifications.loadMore')}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
