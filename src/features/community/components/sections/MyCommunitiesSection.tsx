import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import {
  EXPLORE_DOT_COLORS,
  MY_COMMUNITIES_BENTO_LIMIT,
  MY_COMMUNITIES_QUERY,
} from '@/features/community/types/DEFAULT_VALUES'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
import { ExploreCommunityCard } from '@/features/community/components/cards/ExploreCommunityCard'
import { MyCommunityCard } from '@/features/community/components/cards/MyCommunityCard'

export function MyCommunitiesSection({ onCreateCommunity }: { onCreateCommunity: () => void }) {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const myCommunitiesQuery = useMyCommunities(MY_COMMUNITIES_QUERY, isLoggedIn)
  const [showAll, setShowAll] = useState(false)
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
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="flex items-center gap-1 text-sm font-semibold text-mynted-blue hover:cursor-pointer hover:underline"
            >
              {showAll ? t('communities.list.showLess') : t('communities.list.showAll')}
              {showAll ? (
                <ChevronUp className="size-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-4" aria-hidden="true" />
              )}
            </button>
          )}

          {showHeaderCreateButton && (
            <button
              type="button"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:cursor-pointer hover:bg-mynted-orange/80"
              onClick={onCreateCommunity}
            >
              {t('communities.createCommunity')}
            </button>
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

        {isLoggedIn && myCommunitiesQuery.isError && (
          <CommunityNotice
            title={t('communities.list.loadError')}
            description={getApiErrorMessage(myCommunitiesQuery.error)}
          >
            <button
              type="button"
              onClick={() => void myCommunitiesQuery.refetch()}
              className="rounded-lg border border-mynted-border bg-white px-4 py-2 text-sm font-semibold text-mynted-ink hover:cursor-pointer hover:bg-mynted-bg"
            >
              {t('communities.list.retry')}
            </button>
          </CommunityNotice>
        )}

        {isLoggedIn && myCommunitiesQuery.isSuccess && communities.length === 0 && (
          <CommunityNotice
            title={t('communities.list.emptyTitle')}
            description={t('communities.list.emptyDescription')}
          >
            <button
              type="button"
              onClick={onCreateCommunity}
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:cursor-pointer hover:bg-mynted-orange/80"
            >
              {t('communities.createCommunity')}
            </button>
          </CommunityNotice>
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

        {showAll && restCommunities.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {restCommunities.map((community, index) => (
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
