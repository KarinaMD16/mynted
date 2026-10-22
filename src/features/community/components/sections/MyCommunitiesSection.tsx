import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import {
  MY_COMMUNITIES_BENTO_LIMIT,
  MY_COMMUNITIES_QUERY,
} from '@/features/community/types/DEFAULT_VALUES'
import { MyCommunityCard } from '@/features/community/components/cards/MyCommunityCard'
import { Button } from '@/components/ui/Button'

export function MyCommunitiesSection({ onCreateCommunity }: { onCreateCommunity: () => void }) {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const myCommunitiesQuery = useMyCommunities(MY_COMMUNITIES_QUERY, isLoggedIn)
  // Sin sesion no se usa lo que haya quedado en cache de la cuenta anterior
  const communities = isLoggedIn ? (myCommunitiesQuery.data?.data ?? []) : []
  const bentoCommunities = communities.slice(0, MY_COMMUNITIES_BENTO_LIMIT)
  const restCommunities = communities.slice(MY_COMMUNITIES_BENTO_LIMIT)
  const isLoading = isLoadingSession || (isLoggedIn && myCommunitiesQuery.isPending)
  const showHeaderCreateButton = isLoggedIn && communities.length > 0

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('communities.myCommunities')}</h1>

        <div className="flex items-center gap-4">
          {restCommunities.length > 0 && (
            <Link
              to="/my-communities"
              className="flex items-center gap-1 text-sm font-semibold text-mynted-blue hover:underline"
            >
              {t('communities.list.showAll')}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}

          {showHeaderCreateButton && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onCreateCommunity}
            >
              {t('communities.createCommunity')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:grid-rows-2">
            <div className="h-56 animate-pulse rounded-2xl bg-white lg:row-span-2 lg:h-full" />
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
            <div className="h-40 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {!isLoadingSession && !isLoggedIn && (
          <SignedOutState description={t('communities.list.signedOutDescription')} />
        )}

        {isLoggedIn && myCommunitiesQuery.isError && (
          <QueryErrorState error={myCommunitiesQuery.error} onRetry={() => void myCommunitiesQuery.refetch()} texts={{ error: { description: t('communities.list.loadError') } }} />
        )}

        {isLoggedIn && myCommunitiesQuery.isSuccess && communities.length === 0 && (
          <ErrorState
            kind="empty"
            variant="compact"
            title={t('communities.list.emptyTitle')}
            description={t('communities.list.emptyDescription')}
          >
            <Button
              type="button"
              onClick={onCreateCommunity}
              variant="primary"
              size="md"
            >
              {t('communities.createCommunity')}
            </Button>
          </ErrorState>
        )}

        {bentoCommunities.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:grid-rows-2">
            {bentoCommunities.map((community, index) => (
              <div key={community.id} className={index === 0 ? 'lg:row-span-2' : undefined}>
                <MyCommunityCard
                  community={community}
                  featured={index === 0}
                  variant={index === 0 ? 'blue' : 'yellow'}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
