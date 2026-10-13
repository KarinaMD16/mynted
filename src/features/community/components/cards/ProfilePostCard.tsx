import { Link } from '@tanstack/react-router'
import { UsersRound } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatRelativeTime } from '@/utils/relativeTime'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { PostStats } from './PostStats'

/** Post propio dentro del perfil (pestañas "Hilos" y "Publicaciones"): portada, comunidad, texto, tags y métricas. */
export function ProfilePostCard({ post }: { post: FeedPost }) {
  const { t, language } = useLanguage()
  const cover = post.images[0]
  const extraImages = post.images.length - 1

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-mynted-border bg-white">
      {cover && (
        <div className="relative aspect-[16/9] overflow-hidden bg-mynted-bg">
          <img src={cover.url} alt={post.title} loading="lazy" className="size-full object-cover" />
          {extraImages > 0 && (
            <span
              className="absolute right-3 bottom-3 rounded-full bg-mynted-ink/80 px-2.5 py-1 text-xs font-semibold text-white"
              aria-label={t('forum.post.moreImages', { count: extraImages })}
            >
              +{extraImages}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <header className="flex items-center justify-between gap-3 text-xs text-mynted-gray">
          {post.community ? (
            <Link
              to="/communities/$slug"
              params={{ slug: post.community.slug }}
              className="flex min-w-0 items-center gap-1 rounded-full bg-mynted-bg px-2.5 py-1 font-semibold text-mynted-ink hover:text-mynted-orange"
            >
              <UsersRound className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{post.community.name}</span>
            </Link>
          ) : (
            <span />
          )}
          <time dateTime={post.postedAt} className="shrink-0">
            {formatRelativeTime(post.postedAt, language)}
          </time>
        </header>

        <h3 className="line-clamp-2 font-heading text-base font-semibold text-mynted-ink">{post.title}</h3>
        <p className="line-clamp-3 text-sm text-mynted-gray">{post.body}</p>

        {post.tags.length > 0 && (
          <p className="line-clamp-1 text-xs text-mynted-gray">{post.tags.map((tag) => `#${tag.name}`).join(' ')}</p>
        )}

        <PostStats post={post} className="mt-auto pt-2" />
      </div>
    </article>
  )
}
