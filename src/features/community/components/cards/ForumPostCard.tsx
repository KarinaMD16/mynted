import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { useForumActions } from '@/features/community/hooks/useForum'
import type { ForumPost } from '@/features/community/models/forumDTOs'
import { ForumAuthorLine } from '@/features/community/components/ui/ForumAuthorLine'
import { ForumMetricsBar } from '@/features/community/components/ui/ForumMetricsBar'
import { formatRelativeTime } from '@/utils/relativeTime'

interface ForumPostCardProps {
  post: ForumPost
  /** Para enlazar al detalle de la publicacion. */
  communitySlug: string
  index: number
}

/**
 * Publicacion del foro dentro de la lista de la comunidad. Toda la tarjeta
 * abre la publicacion: el enlace del titulo se estira sobre ella con un
 * pseudo-elemento, y lo que se pueda tocar aparte va en una capa por encima.
 */
export function ForumPostCard({ post, communitySlug, index }: ForumPostCardProps) {
  const { t, language } = useLanguage()
  const { voteOnPost, favoritePost } = useForumActions()

  return (
    <article className="relative flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5 transition-colors hover:border-mynted-orange/50">
      <ForumAuthorLine
        displayName={post.author?.displayName ?? t('community.detail.deletedAuthor')}
        photoUrl={post.author?.photoUrl}
        role={post.author?.role}
        postedAt={post.postedAt}
        relativeTime={formatRelativeTime(post.postedAt, language)}
        index={index}
      />

      <Link
        to="/communities/$slug/posts/$postId"
        params={{ slug: communitySlug, postId: String(post.id) }}
        className="font-heading text-base font-semibold text-mynted-ink hover:underline after:absolute after:inset-0 after:rounded-2xl after:content-['']"
      >
        {post.title}
      </Link>

      <p className="text-sm whitespace-pre-line text-mynted-gray">{post.body}</p>

      {post.images.length > 0 && (
        <div className={`grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt=""
              className="max-h-80 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag.tagId} className="rounded-lg bg-mynted-bg px-2 py-1 text-xs text-mynted-gray">
              #{tag.name}
            </li>
          ))}
        </ul>
      )}

      <ForumMetricsBar
        className="relative z-10"
        metrics={post}
        replyCount={post.replyCount}
        disabled={voteOnPost.isPending || favoritePost.isPending}
        onVote={(voteType) => voteOnPost.mutate({ postId: post.id, voteType })}
        onToggleFavorite={() => favoritePost.mutate({ postId: post.id, isSaved: !post.isSaved })}
      />
    </article>
  )
}
