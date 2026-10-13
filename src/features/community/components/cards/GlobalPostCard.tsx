import { Link, useNavigate } from '@tanstack/react-router'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useForumActions } from '@/features/community/hooks/useForum'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { ForumAuthorLine } from '@/features/community/components/ui/ForumAuthorLine'
import { ForumMetricsBar } from '@/features/community/components/ui/ForumMetricsBar'
import { formatRelativeTime } from '@/utils/relativeTime'

interface GlobalPostCardProps {
  post: FeedPost
  index: number
}

/**
 * Publicacion dentro del feed de "Talk". Es la misma tarjeta del foro, pero
 * aca se agrega la comunidad de donde salio: el feed mezcla varias, asi que
 * sin eso no se sabe de cual es cada publicacion ni a donde lleva el titulo.
 *
 * Toda la tarjeta abre la publicacion: el enlace del titulo se estira sobre
 * ella con un pseudo-elemento, asi sigue habiendo un solo enlace de verdad
 * (el teclado y el "abrir en pestana nueva" siguen funcionando). Lo que se
 * pueda tocar aparte —la comunidad, votar, guardar— va en una capa por encima.
 */
export function GlobalPostCard({ post, index }: GlobalPostCardProps) {
  const { t, language } = useLanguage()
  const { voteOnPost, favoritePost } = useForumActions()
  const { isLoggedIn } = useCurrentUser()
  const navigate = useNavigate()
  // Votar y guardar piden sesión: sin ella se manda a iniciar sesión en vez de dejar que la petición falle.
  const goToLogin = () => void navigate({ to: '/login' })
  const community = post.community

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5 transition-colors ${
        community ? 'hover:border-mynted-orange/50' : ''
      }`}
    >
      <ForumAuthorLine
        displayName={post.author?.displayName ?? t('community.detail.deletedAuthor')}
        photoUrl={post.author?.photoUrl}
        role={post.author?.role}
        postedAt={post.postedAt}
        relativeTime={formatRelativeTime(post.postedAt, language)}
        index={index}
        meta={
          community && (
            <Link
              to="/communities/$slug"
              params={{ slug: community.slug }}
              className="relative z-10 truncate font-medium text-mynted-blue hover:underline"
            >
              @{community.slug}
            </Link>
          )
        }
      />

      {community ? (
        <Link
          to="/communities/$slug/posts/$postId"
          params={{ slug: community.slug, postId: String(post.id) }}
          className="font-heading text-base font-semibold text-mynted-ink hover:underline after:absolute after:inset-0 after:rounded-2xl after:content-['']"
        >
          {post.title}
        </Link>
      ) : (
        // Sin comunidad no hay ruta al detalle (la ruta del post cuelga del slug).
        <h3 className="font-heading text-base font-semibold text-mynted-ink">{post.title}</h3>
      )}

      <p className="text-sm whitespace-pre-line text-mynted-gray">{post.body}</p>

      {post.images.length > 0 && (
        <div className={`grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((image) => (
            <img key={image.id} src={image.url} alt="" className="max-h-96 w-full rounded-xl object-contain" />
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
        onVote={(voteType) => (isLoggedIn ? voteOnPost.mutate({ postId: post.id, voteType }) : goToLogin())}
        onToggleFavorite={() =>
          isLoggedIn ? favoritePost.mutate({ postId: post.id, isSaved: !post.isSaved }) : goToLogin()
        }
      />
    </article>
  )
}
