import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatBadgeCount } from '../utils/chatFormat'

/** Pastilla azul con el número de no leídos. No pinta nada con 0. */
export function UnreadBadge({ count, className }: { count: number; className?: string }) {
  const { t } = useLanguage()
  if (count <= 0) return null
  return (
    <span
      className={cx(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-mynted-blue px-1.5 py-px text-[11px] leading-[18px] font-bold text-white tabular-nums',
        className,
      )}
    >
      <span aria-hidden="true">{formatBadgeCount(count)}</span>
      <span className="sr-only">{t('nav.messagesUnread', { count })}</span>
    </span>
  )
}
