import { Link, useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/api/apiError'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
import { CommunitySidebar } from '@/features/community/components/detail/CommunitySidebar'
import { ForumReplyTree, ReplyForm } from '@/features/community/components/detail/ForumReplyTree'
import { ForumAuthorLine } from '@/features/community/components/ui/ForumAuthorLine'
import { ForumMetricsBar } from '@/features/community/components/ui/ForumMetricsBar'
import { useCommunityDetailBySlug } from '@/features/community/hooks/useCommunitiesQueries'
import { useForumActions, usePost, usePostReplies } from '@/features/community/hooks/useForum'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatRelativeTime } from '@/utils/relativeTime'

/** Publicacion del foro con sus respuestas (ver forum.controller.ts) */
export default function PostDetailPage() {
  const { t, language } = useLanguage()
  const { slug, postId } = useParams({ from: '/communities/$slug/posts/$postId' })
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const { voteOnPost, favoritePost } = useForumActions()

  const communityQuery = useCommunityDetailBySlug(slug, isLoggedIn)
  const postQuery = usePost(Number(postId), isLoggedIn)
  const repliesQuery = usePostReplies(Number(postId), isLoggedIn)

  // Sin sesion no se usa lo que haya quedado en cache de otra cuenta
  const community = isLoggedIn ? communityQuery.data : undefined
  const post = isLoggedIn ? postQuery.data : undefined
  const replies = isLoggedIn ? (repliesQuery.data ?? []) : []

  return (
    <section className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10">
        <Link
          to="/communities/$slug"
          params={{ slug }}
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
        >
          {t('forum.backToCommunity', { slug })}
        </Link>

        {!isLoadingSession && !isLoggedIn && (
          <CommunityNotice
            title={t('community.detail.signedOutTitle')}
            description={t('community.detail.signedOutDescription')}
          >
            <Link
              to="/login"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
            >
              {t('communities.list.signIn')}
            </Link>
          </CommunityNotice>
        )}

        {(isLoadingSession || (isLoggedIn && postQuery.isPending)) && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="h-72 animate-pulse rounded-2xl bg-white" />
            <div className="h-72 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {isLoggedIn && postQuery.isError && (
          <CommunityNotice title={t('forum.loadError')} description={getApiErrorMessage(postQuery.error)}>
            <Button variant="secondary" size="sm" onClick={() => void postQuery.refetch()}>
              {t('communities.list.retry')}
            </Button>
          </CommunityNotice>
        )}

        {post && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-6">
              <article className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5">
                <ForumAuthorLine
                  displayName={post.author?.displayName ?? t('community.detail.deletedAuthor')}
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
                  onVote={(voteType) => voteOnPost.mutate({ postId: post.id, voteType })}
                  onToggleFavorite={() => favoritePost.mutate({ postId: post.id, isSaved: !post.isSaved })}
                />
              </article>

              <section className="flex flex-col gap-3">
                <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('forum.replies.title')}</h2>
                
                {replies.length === 0 && (
                  <ReplyForm postId={post.id} />
                )}


                {repliesQuery.isPending ? (
                  <div className="h-24 animate-pulse rounded-2xl bg-white" />
                ) : (
                  <ForumReplyTree
                    postId={post.id}
                    replies={replies}
                    authorProfileId={post.communityProfileId}
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
