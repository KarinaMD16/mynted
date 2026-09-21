import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Flag, ScrollText, Settings, Users } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
import { ModerationRulesSection } from '@/features/community/components/moderation/ModerationRulesSection'
import { ModerationSettingsSection } from '@/features/community/components/moderation/ModerationSettingsSection'
import { useCommunityDetailBySlug } from '@/features/community/hooks/useCommunitiesQueries'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'

type ModerationTab = 'reports' | 'members' | 'rules' | 'settings'

const TABS: { id: ModerationTab; labelKey: TranslationKey; icon: typeof Flag; available: boolean }[] = [
  { id: 'reports', labelKey: 'moderation.tabs.reports', icon: Flag, available: false },
  { id: 'members', labelKey: 'moderation.tabs.members', icon: Users, available: false },
  { id: 'rules', labelKey: 'moderation.tabs.rules', icon: ScrollText, available: true },
  { id: 'settings', labelKey: 'moderation.tabs.settings', icon: Settings, available: true },
]

export default function CommunityModerationPage() {
  const { t } = useLanguage()
  const { slug } = useParams({ from: '/communities/$slug/moderacion' })
  const { isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<ModerationTab>('rules')

  const communityQuery = useCommunityDetailBySlug(slug, isLoggedIn)
  // Sin sesion no se usa lo que haya quedado en cache (trae rol y datos privados)
  const community = isLoggedIn ? communityQuery.data : undefined

  const isOwner = community?.membershipRole === 'owner'
  const canModerate = isOwner || community?.membershipRole === 'moderator'

  return (
    <section className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10">
        <Link
          to="/communities/$slug"
          params={{ slug }}
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('moderation.backToCommunity')}
        </Link>

        {!isLoadingSession && !isLoggedIn && (
          <CommunityNotice
            title={t('community.detail.signedOutTitle')}
            description={t('community.detail.signedOutDescription')}
          >
            <Link
              to="/login"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
            >
              {t('communities.list.signIn')}
            </Link>
          </CommunityNotice>
        )}

        {(isLoadingSession || (isLoggedIn && communityQuery.isPending)) && (
          <div className="flex flex-col gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
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

        {community && !canModerate && (
          <CommunityNotice
            title={t('moderation.forbiddenTitle')}
            description={t('moderation.forbiddenDescription')}
          >
            <Link
              to="/communities/$slug"
              params={{ slug }}
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
            >
              {t('moderation.backToCommunity')}
            </Link>
          </CommunityNotice>
        )}

        {community && canModerate && (
          <>
            <header className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mynted-orange font-heading text-xl font-semibold text-white">
                {community.imageUrl ? (
                  <img src={community.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  community.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('moderation.title')}</h1>
                <p className="text-sm text-mynted-gray">
                  @{community.slug} · {t('moderation.subtitle')}
                </p>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard value={community.memberCount} label={t('moderation.stats.members')} color="text-mynted-blue" />
              <StatCard
                value={community.recentPostCount}
                label={t('moderation.stats.recentPosts')}
                color="text-emerald-600"
              />
              <StatCard value={community.rules.length} label={t('moderation.stats.rules')} color="text-mynted-orange" />
              <StatCard value={community.tags.length} label={t('moderation.stats.tags')} color="text-violet-500" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <nav className="flex flex-col gap-1.5" aria-label={t('moderation.title')}>
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:cursor-pointer ${
                        isActive
                          ? 'bg-mynted-orange text-white'
                          : 'bg-white text-mynted-ink hover:bg-mynted-bg'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {t(tab.labelKey)}
                      {!tab.available && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isActive ? 'bg-white/20 text-white' : 'bg-mynted-bg text-mynted-gray'
                          }`}
                        >
                          {t('moderation.soonBadge')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>

              <div className="rounded-2xl border border-mynted-border bg-white p-5 sm:p-6">
                {activeTab === 'rules' && <ModerationRulesSection community={community} />}
                {activeTab === 'settings' && (
                  <ModerationSettingsSection community={community} isOwner={isOwner} />
                )}
                {(activeTab === 'reports' || activeTab === 'members') && (
                  <div className="flex flex-col items-center gap-2 py-14 text-center">
                    <h2 className="font-heading text-lg font-semibold text-mynted-ink">
                      {t(activeTab === 'reports' ? 'moderation.tabs.reports' : 'moderation.tabs.members')}
                    </h2>
                    <p className="max-w-md text-sm text-mynted-gray">
                      {t(activeTab === 'reports' ? 'moderation.reports.soon' : 'moderation.members.soon')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </section>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-mynted-border bg-white px-5 py-4">
      <p className={`font-heading text-2xl font-semibold ${color}`}>{value.toLocaleString()}</p>
      <p className="mt-0.5 text-sm text-mynted-gray">{label}</p>
    </div>
  )
}
