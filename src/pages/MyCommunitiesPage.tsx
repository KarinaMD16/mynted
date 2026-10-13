import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/api/apiError'
import { CommunityGridPage } from '@/features/community/components/sections/CommunityGridPage'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
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
            <CommunityNotice
              title={t('communities.list.signedOutTitle')}
              description={t('communities.list.signedOutDescription')}
            >
              <Link
                to="/login"
                className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
              >
                {t('communities.list.signIn')}
              </Link>
            </CommunityNotice>
          )}

          {isLoggedIn && query.isError && (
            <CommunityNotice
              title={t('communities.list.loadError')}
              description={getApiErrorMessage(query.error)}
            >
              <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
                {t('communities.list.retry')}
              </Button>
            </CommunityNotice>
          )}

          {isLoggedIn && query.isSuccess && communities.length === 0 && (
            <CommunityNotice
              title={t('communities.list.emptyTitle')}
              description={t('communities.list.emptyDescription')}
            />
          )}
        </>
      }
    />
  )
}
