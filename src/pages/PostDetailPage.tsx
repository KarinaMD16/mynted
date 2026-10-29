import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { Link, useNavigate, useParams, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CommunitySidebar } from '@/features/community/components/detail/CommunitySidebar'
import { ForumReplyTree, ReplyForm } from '@/features/community/components/detail/ForumReplyTree'
import { ForumAuthorLine } from '@/features/community/components/ui/ForumAuthorLine'
import { ForumMetricsBar } from '@/features/community/components/ui/ForumMetricsBar'
import { useCommunityDetailBySlug } from '@/features/community/hooks/useCommunitiesQueries'
import { useForumActions, usePost, usePostReplies } from '@/features/community/hooks/useForum'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useScrollToHash } from '@/hooks/useScrollToHash'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatRelativeTime } from '@/utils/relativeTime'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

/** Publicacion del foro con sus respuestas (ver forum.controller.ts) */
export default function PostDetailPage() {
  const { t, language } = useLanguage()
  const { slug, postId } = useParams({ from: '/communities/$slug/posts/$postId' })
  const router = useRouter()
  const { isLoggedIn } = useCurrentUser()
  const { voteOnPost, favoritePost } = useForumActions()
  const navigate = useNavigate()

  // Leer no pide sesion (OptionalJwtAuthGuard). Si la comunidad es privada y no
  // sos miembro, el backend responde 403 y eso se muestra como "es privada":
  // quien decide es el servidor, no una cuenta que el frontend saque del detalle.
  const communityQuery = useCommunityDetailBySlug(slug)
  const postQuery = usePost(Number(postId))
  const repliesQuery = usePostReplies(Number(postId))

  const community = communityQuery.data
  const post = postQuery.data
  const replies = repliesQuery.data ?? []
  // Desde una notificación de respuesta se llega con #reply-<id>.
  useScrollToHash(Boolean(post) && repliesQuery.isSuccess)

  /** Votar, guardar y responder si piden sesion: sin ella se invita a entrar. */
  const goToLogin = () => void navigate({ to: '/login' })

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 py-8')}>
        {/*
          A la publicacion se llega desde la comunidad, desde el home o desde
          Explorar, asi que volver sigue el historial. Solo cuando no hay nada
          atras (se entro por la URL directa) se cae a la comunidad.
        */}
        {router.history.canGoBack() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.history.back()}
            className="w-fit px-0 text-sm text-mynted-gray hover:text-mynted-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('forum.back')}
          </Button>
        ) : (
          <Link
            to="/communities/$slug"
            params={{ slug }}
            className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
          >
            {t('forum.backToCommunity', { slug })}
          </Link>
        )}

        {postQuery.isPending && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="h-72 animate-pulse rounded-2xl bg-white" />
            <div className="h-72 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {postQuery.isError && (
          <QueryErrorState
            error={postQuery.error}
            onRetry={() => void postQuery.refetch()}
            texts={{
              notFound: { description: t('errors.notFound.post') },
              // 403 = la comunidad es privada y no sos miembro.
              forbidden: {
                title: t('community.detail.privateTitle'),
                description: t('community.detail.privateForum'),
              },
              error: { description: t('forum.loadError') },
            }}
          >
            <Link to="/communities/$slug" params={{ slug }} className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80">
              {t('forum.backToCommunity', { slug })}
            </Link>
          </QueryErrorState>
        )}

        {post && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-6">
              <article className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5">
                <ForumAuthorLine
                  displayName={post.author?.displayName ?? t('community.detail.deletedAuthor')}
                  photoUrl={post.author?.photoUrl}
                  role={post.author?.role}
                  postedAt={post.postedAt}
                  relativeTime={formatRelativeTime(post.postedAt, language)}
                  index={0}
                />

                <h1 className="font-heading text-xl font-semibold text-mynted-ink">{post.title}</h1>
                <p className="text-sm whitespace-pre-line text-mynted-gray">{post.body}</p>

                {post.images.length > 0 && (
                  <div className={`grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {post.images.map((image) => (
                      <img key={image.id} src={image.url} alt="" className="w-full rounded-xl object-cover" />
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
                  metrics={post}
                  replyCount={post.replyCount}
                  disabled={voteOnPost.isPending || favoritePost.isPending}
                  onVote={(voteType) =>
                    isLoggedIn ? voteOnPost.mutate({ postId: post.id, voteType }) : goToLogin()
                  }
                  onToggleFavorite={() =>
                    isLoggedIn ? favoritePost.mutate({ postId: post.id, isSaved: !post.isSaved }) : goToLogin()
                  }
                />
              </article>

              <section className="flex flex-col gap-3">
                <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('forum.replies.title')}</h2>

                {/* Leer es libre; responder exige ser miembro (el backend devuelve 403). */}
                {!isLoggedIn ? (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-dashed border-mynted-border bg-white px-4 py-3 text-sm text-mynted-gray">
                    {t('forum.replies.signedOut')}
                    <Link to="/login" className="font-semibold text-mynted-blue hover:underline">
                      {t('errors.actions.signIn')}
                    </Link>
                  </p>
                ) : community?.isMember ? (
                  <ReplyForm postId={post.id} />
                ) : (
                  community && (
                    <p className="rounded-2xl border border-dashed border-mynted-border bg-white px-4 py-3 text-sm text-mynted-gray">
                      {t('forum.replies.membersOnly')}
                    </p>
                  )
                )}

                {repliesQuery.isPending ? (
                  <div className="h-24 animate-pulse rounded-2xl bg-white" />
                ) : (
                  <ForumReplyTree
                    canReply={isLoggedIn && Boolean(community?.isMember)}
                    postId={post.id}
                    replies={replies}
                    authorProfileId={post.communityProfileId}
                    communityId={community?.id}
                    canModerate={community?.membershipRole === 'owner' || community?.membershipRole === 'moderator'}
                  />
                )}
              </section>
            </div>

            {community && <CommunitySidebar community={community} />}
          </div>
        )}
      </main>
    </section>
  )
}
