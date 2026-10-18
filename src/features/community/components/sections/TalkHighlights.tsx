import { Link } from '@tanstack/react-router'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { flattenUniquePosts, useHomePosts } from '@/features/community/hooks/useForum'
import { GlobalPostCard } from '@/features/community/components/cards/GlobalPostCard'

/** Cuantas publicaciones entran en el home antes de mandar a /explore. */
const HIGHLIGHT_LIMIT = 3

/**
 * Lo ultimo de "Talk" en el home (GET /home/posts): con sesion, lo mas reciente
 * de las comunidades a las que pertenece el usuario; sin sesion, o si todavia no
 * esta en ninguna, lo mas reciente de comunidades publicas (meta.source = "public").
 * Es un adelanto: el feed completo "para ti" vive en la pestana Foro de /explore.
 */
export function TalkHighlights() {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const posts = useHomePosts()

  const items = flattenUniquePosts(posts.data?.pages).slice(0, HIGHLIGHT_LIMIT)
  const source = posts.data?.pages[0]?.meta.source

  if (posts.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {Array.from({ length: HIGHLIGHT_LIMIT }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    )
  }

  if (posts.isError) {
    return (
      <QueryErrorState
        error={posts.error}
        onRetry={() => void posts.refetch()}
        variant="compact"
        texts={{ error: { description: t('talk.loadError') } }}
      />
    )
  }

  if (items.length === 0) {
    return <ErrorState kind="empty" variant="compact" title={t('talk.empty.title')} description={t('talk.empty.body')} />
  }

  return (
    <div className="flex flex-col gap-4">
      {source === 'public' && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-mynted-border bg-mynted-white px-4 py-3 text-sm text-mynted-gray">
          {t(isLoggedIn ? 'home.talk.publicNote' : 'home.talk.publicNoteSignedOut')}
          {isLoggedIn ? (
            <Link to="/discover-communities" className="font-semibold text-mynted-blue hover:underline">
              {t('home.talk.joinCommunities')}
            </Link>
          ) : (
            <Link to="/login" search={{ mode: 'register' }} className="font-semibold text-mynted-blue hover:underline">
              {t('home.talk.createAccount')}
            </Link>
          )}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {items.map((post, index) => (
          <StaggerItem key={post.id} index={index}>
            <GlobalPostCard post={post} index={index} />
          </StaggerItem>
        ))}
      </ul>
    </div>
  )
}
