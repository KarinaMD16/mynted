import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { StaggerItem } from '@/components/ui/ScrollReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { useRecommendedPosts } from '@/features/community/hooks/useForum'
import { GlobalPostCard } from '@/features/community/components/cards/GlobalPostCard'

/** Cuantas publicaciones entran en el home antes de mandar a /explore. */
const HIGHLIGHT_LIMIT = 3

/**
 * Lo ultimo de "Talk" en el home: unas pocas publicaciones que coinciden con
 * los intereses del usuario. Es un adelanto, no el feed: para leerlo completo,
 * filtrarlo o publicar esta la pestana Talk de /explore.
 */
export function TalkHighlights() {
  const { t } = useLanguage()
  const posts = useRecommendedPosts()

  const items = (posts.data?.pages[0]?.data ?? []).slice(0, HIGHLIGHT_LIMIT)

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
      <QueryErrorState error={posts.error} onRetry={() => void posts.refetch()} variant="compact" texts={{ error: { description: t('talk.loadError') } }} />
    )
  }

  if (items.length === 0) {
    return (
      <ErrorState kind="empty" variant="compact" title={t('talk.empty.title')} description={t('talk.empty.interests')} />
    )
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((post, index) => (
        <StaggerItem key={post.id} index={index}>
          <GlobalPostCard post={post} index={index} />
        </StaggerItem>
      ))}
    </ul>
  )
}
