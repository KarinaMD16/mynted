import type { ReactNode } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'

/** Colores del avatar, rotando por posicion (el perfil de comunidad no guarda uno). */
const AVATAR_COLORS = [
  'bg-mynted-orange text-white',
  'bg-mynted-blue text-white',
  'bg-mynted-yellow text-mynted-ink',
  'bg-violet-500 text-white',
]

interface ForumAuthorLineProps {
  displayName: string
  /** 'member' | 'moderator' | 'owner'; solo se marcan los dos ultimos. */
  role?: string
  postedAt: string
  relativeTime: string
  index: number
  /** Marca "Autor" en las respuestas de quien abrio la publicacion. */
  isOriginalPoster?: boolean
  /** Va junto a la hora; en el feed global es la comunidad de la publicacion. */
  meta?: ReactNode
}

/** Avatar con iniciales, nombre, hace cuanto y la etiqueta de rol. */
export function ForumAuthorLine({
  displayName,
  role,
  postedAt,
  relativeTime,
  index,
  isOriginalPoster = false,
  meta,
}: ForumAuthorLineProps) {
  const { t } = useLanguage()
  const isStaff = role === 'moderator' || role === 'owner'

  return (
    <header className="flex items-center gap-3">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          AVATAR_COLORS[index % AVATAR_COLORS.length]
        }`}
        aria-hidden="true"
      >
        {displayName.slice(0, 2).toUpperCase()}
      </span>

      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-mynted-ink">{displayName}</span>

          {isOriginalPoster && (
            <span className="rounded-full bg-mynted-orange/15 px-2 py-0.5 text-[10px] font-bold text-mynted-orange">
              {t('forum.authorBadge')}
            </span>
          )}

          {isStaff && (
            <span className="rounded-full bg-mynted-bg px-2 py-0.5 text-[10px] font-bold text-mynted-gray uppercase">
              {t(role === 'owner' ? 'forum.ownerBadge' : 'forum.moderatorBadge')}
            </span>
          )}
        </span>

        <span className="flex min-w-0 items-center gap-1 text-xs text-mynted-gray">
          <time dateTime={postedAt}>{relativeTime}</time>
          {meta && (
            <>
              <span aria-hidden="true">·</span>
              {meta}
            </>
          )}
        </span>
      </div>
    </header>
  )
}
