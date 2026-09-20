import { ArrowDown, ArrowUp, Star } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatRelativeTime } from '@/utils/relativeTime'
import type { ForumPostCardProps } from '@/features/community/types/CommunityTypes'
import { AVATAR_COLORS } from '@/features/community/types/DEFAULT_VALUES'


export function ForumPostCard({ post, index }: ForumPostCardProps) {
  const { t, language } = useLanguage()
  const displayName = post.author?.displayName ?? t('community.detail.deletedAuthor')
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5">
      <header className="flex items-center gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            AVATAR_COLORS[index % AVATAR_COLORS.length]
          }`}
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-mynted-ink">{displayName}</span>
          <time dateTime={post.postedAt} className="text-xs text-mynted-gray">
            {formatRelativeTime(post.postedAt, language)}
          </time>
        </div>
      </header>

      <h3 className="font-heading text-base font-semibold text-mynted-ink">{post.title}</h3>
      <p className="text-sm text-mynted-gray">{post.body}</p>

      <footer className="flex items-center gap-4 text-xs text-mynted-gray">
        <span className="flex items-center gap-1" title={t('community.detail.upVotes')}>
          <ArrowUp className="size-3.5" aria-hidden="true" />
          {post.upVotes}
        </span>
        <span className="flex items-center gap-1" title={t('community.detail.downVotes')}>
          <ArrowDown className="size-3.5" aria-hidden="true" />
          {post.downVotes}
        </span>
        <span className="flex items-center gap-1" title={t('community.detail.timesSaved')}>
          <Star className="size-3.5" aria-hidden="true" />
          {post.timesSaved}
        </span>
      </footer>
    </article>
  )
}
