import { Link } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { useInbox } from '../hooks/useChatQueries'
import type { InboxItem } from '../models/chat'
import { formatInboxTime } from '../utils/chatFormat'
import { ChatAvatar } from './ChatAvatar'
import { UnreadBadge } from './UnreadBadge'
import { VerifiedMark } from './VerifiedMark'

/**
 * Bandeja de /messages: conversaciones con al menos un mensaje, la más reciente
 * arriba. Se reordena sola con los eventos del socket (ver useInboxSync).
 */
export function InboxList({
  activeConversationId,
  onSelect,
}: {
  activeConversationId?: number
  /** Si se pasa, las filas abren el chat ahí mismo (hoja del botón flotante) en vez de navegar a /messages/$id. */
  onSelect?: (conversationId: number) => void
}) {
  const { t } = useLanguage()
  const inbox = useInbox()
  const items = inbox.data?.pages.flatMap((page) => page.data) ?? []

  if (inbox.isPending) {
    return (
      <ul className="flex flex-col gap-1 p-2" aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 rounded-xl px-3 py-3">
            <span className="size-11 animate-pulse rounded-full bg-mynted-bg" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 w-1/2 animate-pulse rounded bg-mynted-bg" />
              <span className="h-3 w-3/4 animate-pulse rounded bg-mynted-bg" />
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (inbox.isError) {
    return (
      <div className="p-3">
        <QueryErrorState
          error={inbox.error}
          onRetry={() => void inbox.refetch()}
          variant="compact"
          texts={{ error: { description: t('chat.inbox.loadError') } }}
        />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="p-3">
        <ErrorState kind="empty" variant="compact" title={t('chat.inbox.empty.title')} description={t('chat.inbox.empty.description')}>
          <Link
            to="/explore"
            className="rounded-[10px] bg-mynted-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
          >
            {t('chat.inbox.empty.action')}
          </Link>
        </ErrorState>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col gap-0.5 p-2">
        {items.map((item) => (
          <li key={item.id}>
            <InboxRow item={item} isActive={item.id === activeConversationId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
      {inbox.hasNextPage && (
        <div className="flex justify-center px-3 pb-4">
          <Button type="button" variant="secondary" onClick={() => void inbox.fetchNextPage()} disabled={inbox.isFetchingNextPage}>
            {t('chat.inbox.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}

function InboxRow({
  item,
  isActive,
  onSelect,
}: {
  item: InboxItem
  isActive: boolean
  onSelect?: (conversationId: number) => void
}) {
  const { t, language } = useLanguage()
  const { userId } = useCurrentUser()
  const hasUnread = item.unreadCount > 0
  const isMine = item.lastMessage.senderId === userId
  const preview = item.lastMessage.type === 'image' ? t('chat.inbox.photo') : (item.lastMessage.content ?? '')

  const rowClass = cx(
    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mynted-blue-mid',
    isActive ? 'bg-[#fff1ea]' : 'hover:bg-mynted-bg',
  )
  const content = (
    <>
      <ChatAvatar
        name={item.otherParticipant.displayName}
        photoUrl={item.otherParticipant.photoUrl}
        frame={item.otherParticipant.frame}
      />

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className={cx('truncate font-heading text-[15px] text-mynted-ink', hasUnread ? 'font-bold' : 'font-semibold')}>
              {item.otherParticipant.displayName}
            </span>
            {item.otherParticipant.isVerified && <VerifiedMark />}
            {item.otherParticipant.isPro && <ProBadge size="xs" />}
          </span>
          <time
            dateTime={item.lastMessageAt}
            className={cx('shrink-0 text-xs', hasUnread ? 'font-semibold text-mynted-blue' : 'text-mynted-gray')}
          >
            {formatInboxTime(item.lastMessageAt, language, t)}
          </time>
        </span>

        <span className="truncate text-xs text-mynted-gray-light">{item.product.title}</span>

        <span className="flex items-center gap-2">
          <span className={cx('flex min-w-0 flex-1 items-center gap-1 text-[13px]', hasUnread ? 'font-semibold text-mynted-ink' : 'text-mynted-gray')}>
            {item.lastMessage.type === 'image' && <ImageIcon className="size-3.5 shrink-0" aria-hidden="true" />}
            <span className="truncate">{isMine ? t('chat.inbox.you', { text: preview }) : preview}</span>
          </span>
          <UnreadBadge count={item.unreadCount} />
        </span>
      </span>

      <span className="hidden size-11 shrink-0 overflow-hidden rounded-lg bg-mynted-bg sm:block lg:hidden xl:block">
        {item.product.imageUrl && <img src={item.product.imageUrl} alt="" loading="lazy" className="size-full object-cover" />}
      </span>
    </>
  )

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(item.id)} className={rowClass}>
        {content}
      </button>
    )
  }

  return (
    <Link
      to="/messages/$conversationId"
      params={{ conversationId: String(item.id) }}
      aria-current={isActive ? 'page' : undefined}
      className={rowClass}
    >
      {content}
    </Link>
  )
}
