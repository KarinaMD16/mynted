import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { CommunityGridPage } from '@/features/community/components/sections/CommunityGridPage'
import { useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import { MY_COMMUNITIES_QUERY } from '@/features/community/types/DEFAULT_VALUES'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'

/** Todas las comunidades del usuario, desde el "Ver todas" de /communities. */
export default function MyCommunitiesPage() {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const query = useMyCommunities(MY_COMMUNITIES_QUERY, isLoggedIn)

  const communities = isLoggedIn ? (query.data?.data ?? []) : []

  return (
    <CommunityGridPage
      title={t('communities.myCommunities')}
      subtitle={t('communities.grid.mineSubtitle')}
      communities={communities}
      isLoading={isLoadingSession || (isLoggedIn && query.isPending)}
      notice={
        <>
          {!isLoadingSession && !isLoggedIn && (
            <SignedOutState description={t('communities.list.signedOutDescription')} />
          )}

          {isLoggedIn && query.isError && (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} texts={{ error: { description: t('communities.list.loadError') } }} />
          )}

          {isLoggedIn && query.isSuccess && communities.length === 0 && (
            <ErrorState kind="empty" variant="compact" title={t('communities.list.emptyTitle')} description={t('communities.list.emptyDescription')} />
          )}
        </>
      }
    />
  )
}
