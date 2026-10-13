import { useLanguage } from '@/i18n/LanguageContext'
import { formatRelativeTime } from '@/utils/relativeTime'
import { PostStats } from '@/features/community/components/cards/PostStats'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { AVATAR_COLORS } from '@/features/community/types/DEFAULT_VALUES'

/** Post guardado (wireframe "Bento Post Card"): autor, título, tags y métricas. */
export function FavoritePostCard({ post }: { post: FeedPost }) {
  const { language } = useLanguage()
  const name = post.author?.displayName ?? '—'

  return (
    <article className="flex w-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-mynted-border bg-white p-5">
      <header className="flex items-center gap-2.5">
        {post.author?.photoUrl ? (
          <img src={post.author.photoUrl} alt="" loading="lazy" className="size-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              AVATAR_COLORS[post.id % AVATAR_COLORS.length]
            }`}
          >
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-heading text-[13px] font-semibold text-mynted-ink">{name}</span>
          <time dateTime={post.postedAt} className="text-[11px] text-mynted-gray">
            {formatRelativeTime(post.postedAt, language)}
          </time>
        </div>
      </header>

      <h3 className="line-clamp-2 font-heading text-sm font-semibold text-mynted-ink">{post.title}</h3>

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <li key={tag.tagId} className="rounded-full bg-mynted-bg px-2.5 py-1 text-[11px] text-mynted-gray">
              #{tag.name}
            </li>
          ))}
        </ul>
      )}

      <PostStats post={post} accent className="mt-auto" />
    </article>
  )
}
