import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Shield } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CommunityDetailHeader } from '@/features/community/components/detail/CommunityDetailHeader'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
import { CommunitySidebar } from '@/features/community/components/detail/CommunitySidebar'
import { ForumPostCard } from '@/features/community/components/cards/ForumPostCard'
import { useCommunityDetailBySlug } from '@/features/community/hooks/useCommunitiesQueries'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'

type CommunityTab = 'talk' | 'shop'

export default function CommunityDetailPage() {
  const { t } = useLanguage()
  const { slug } = useParams({ from: '/communities/$slug' })
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<CommunityTab>('talk')

  const communityQuery = useCommunityDetailBySlug(slug, isLoggedIn)
  // Sin sesion no se usa lo que haya quedado en cache (trae rol y datos privados)
  const community = isLoggedIn ? communityQuery.data : undefined

  return (
    <section className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/communities"
            className="flex items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('community.detail.back')}
          </Link>

          <div className="flex items-center gap-3">
            {(community?.membershipRole === 'owner' || community?.membershipRole === 'moderator') && (
              <Link
                to="/communities/$slug/moderacion"
                params={{ slug }}
                className="flex items-center gap-1.5 rounded-lg border border-mynted-border bg-white px-3 py-1.5 text-sm font-semibold text-mynted-ink hover:bg-mynted-bg"
              >
                <Shield className="size-4" aria-hidden="true" />
                {t('moderation.openPanel')}
              </Link>
            )}

            <div className="flex gap-2" role="tablist" aria-label={t('community.detail.tabsLabel')}>
            {(['shop', 'talk'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors hover:cursor-pointer ${
                  activeTab === tab
                    ? 'bg-mynted-orange/15 text-mynted-orange'
                    : 'bg-white text-mynted-gray hover:text-mynted-ink'
                }`}
              >
                {tab === 'shop' ? t('community.detail.tabShop') : t('community.detail.tabTalk')}
              </button>
            ))}
            </div>
          </div>
        </div>

        {!isLoadingSession && !isLoggedIn && (
          <CommunityNotice title={t('community.detail.signedOutTitle')} description={t('community.detail.signedOutDescription')}>
            <Link
              to="/login"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
            >
              {t('communities.list.signIn')}
            </Link>
          </CommunityNotice>
        )}

        {(isLoadingSession || (isLoggedIn && communityQuery.isPending)) && (
          <div className="flex flex-col gap-6">
            <div className="h-56 animate-pulse rounded-2xl bg-white" />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        )}

        {isLoggedIn && communityQuery.isError && (
          <CommunityNotice
            title={t('community.detail.loadError')}
            description={getApiErrorMessage(communityQuery.error)}
          >
            <button
              type="button"
              onClick={() => void communityQuery.refetch()}
              className="rounded-lg border border-mynted-border bg-white px-4 py-2 text-sm font-semibold text-mynted-ink hover:cursor-pointer hover:bg-mynted-bg"
            >
              {t('communities.list.retry')}
            </button>
          </CommunityNotice>
        )}

        {community && (
          <>
            <CommunityDetailHeader community={community} />

            {activeTab === 'talk' ? (
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="flex flex-col gap-4">
                  {community.forumPosts.length > 0 ? (
                    community.forumPosts.map((post, index) => (
                      <ForumPostCard key={post.id} post={post} index={index} />
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-mynted-border bg-white px-6 py-14 text-center text-sm text-mynted-gray">
                      {t('community.detail.noPosts')}
                    </p>
                  )}
                </div>

                <CommunitySidebar community={community} />
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-mynted-border bg-white px-6 py-14 text-center text-sm text-mynted-gray">
                {t('community.detail.shopComingSoon')}
              </p>
            )}
          </>
        )}
      </main>
    </section>
  )
}
