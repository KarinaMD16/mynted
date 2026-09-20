import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCommunities, useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import {
  EXPLORE_COMMUNITIES_QUERY,
  EXPLORE_DOT_COLORS,
  EXPLORE_LIMIT,
  MY_COMMUNITIES_QUERY,
} from '@/features/community/types/DEFAULT_VALUES'
import { ExploreCommunityCard } from '@/features/community/components/cards/ExploreCommunityCard'


export function ExploreCommunitiesSection() {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const [showAll, setShowAll] = useState(false)

  const exploreQuery = useCommunities(EXPLORE_COMMUNITIES_QUERY)
  const myCommunitiesQuery = useMyCommunities(MY_COMMUNITIES_QUERY, isLoggedIn)

  const myCommunityIds = new Set((myCommunitiesQuery.data?.data ?? []).map((community) => community.id))
  const otherCommunities = (exploreQuery.data?.data ?? []).filter(
    (community) => !myCommunityIds.has(community.id),
  )
  const visibleCommunities = showAll ? otherCommunities : otherCommunities.slice(0, EXPLORE_LIMIT)
  const canToggle = otherCommunities.length > EXPLORE_LIMIT

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-mynted-ink">{t('communities.explore.title')}</h2>

        {canToggle && (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="flex items-center gap-1 text-sm font-semibold text-mynted-blue hover:cursor-pointer hover:underline"
          >
            {showAll ? t('communities.explore.showLess') : t('communities.explore.showAll')}
            {showAll ? (
              <ChevronUp className="size-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <div className="mt-4">
        {exploreQuery.isPending && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: EXPLORE_LIMIT }, (_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        )}

        {exploreQuery.isError && (
          <p className="text-sm text-red-500" role="alert">
            {t('communities.explore.loadError')} {getApiErrorMessage(exploreQuery.error)}
          </p>
        )}

        {exploreQuery.isSuccess && visibleCommunities.length === 0 && (
          <p className="text-sm text-mynted-gray">{t('communities.explore.empty')}</p>
        )}

        {visibleCommunities.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {visibleCommunities.map((community, index) => (
              <ExploreCommunityCard
                key={community.id}
                community={community}
                dotClassName={EXPLORE_DOT_COLORS[index % EXPLORE_DOT_COLORS.length]}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
