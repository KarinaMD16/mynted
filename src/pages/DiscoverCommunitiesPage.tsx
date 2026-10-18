import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { CommunityGridPage } from '@/features/community/components/sections/CommunityGridPage'
import {
  useCommunities,
  useMyCommunities,
  useRecommendedCommunities,
} from '@/features/community/hooks/useCommunitiesQueries'
import {
  EXPLORE_COMMUNITIES_QUERY,
  MY_COMMUNITIES_QUERY,
} from '@/features/community/types/DEFAULT_VALUES'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Todas las comunidades para descubrir, desde el "Ver todas" de /communities.
 * Con sesion son las recomendadas (que ya excluyen las propias); sin sesion,
 * el catalogo publico por popularidad.
 */
export default function DiscoverCommunitiesPage() {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()

  const recommendedQuery = useRecommendedCommunities(EXPLORE_COMMUNITIES_QUERY, isLoggedIn)
  const publicQuery = useCommunities(EXPLORE_COMMUNITIES_QUERY, !isLoggedIn)
  const query = isLoggedIn ? recommendedQuery : publicQuery
  const myCommunitiesQuery = useMyCommunities(MY_COMMUNITIES_QUERY, isLoggedIn)

  const myCommunityIds = new Set(
    (isLoggedIn ? (myCommunitiesQuery.data?.data ?? []) : []).map((community) => community.id),
  )
  const communities = (query.data?.data ?? []).filter(
    (community) => isLoggedIn || !myCommunityIds.has(community.id),
  )

  return (
    <CommunityGridPage
      title={t('communities.explore.title')}
      subtitle={t('communities.grid.exploreSubtitle')}
      communities={communities}
      isLoading={query.isPending}
      notice={
        <>
          {query.isError && (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} texts={{ error: { description: t('communities.explore.loadError') } }} />
          )}

          {query.isSuccess && communities.length === 0 && (
            <ErrorState kind="empty" variant="compact" description={t('communities.explore.empty')} />
          )}
        </>
      }
    />
  )
}
