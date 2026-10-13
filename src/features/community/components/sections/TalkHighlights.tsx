import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
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
      <div
        className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-10 text-center"
        role="alert"
      >
        <p className="text-sm font-semibold text-mynted-ink">{t('talk.loadError')}</p>
        <p className="text-sm text-mynted-gray">{getApiErrorMessage(posts.error)}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => void posts.refetch()}>
          {t('communities.list.retry')}
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-10 text-center">
        <p className="text-sm font-semibold text-mynted-ink">{t('talk.empty.title')}</p>
        <p className="max-w-sm text-sm text-mynted-gray">{t('talk.empty.interests')}</p>
      </div>
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
