import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { useState } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { ArrowLeft, Flag, ScrollText, Settings, UserPlus, Users } from 'lucide-react'
import { ErrorState } from '@/components/errors/ErrorState'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { ModerationJoinRequestsSection } from '@/features/community/components/moderation/ModerationJoinRequestsSection'
import { ModerationMembersSection } from '@/features/community/components/moderation/ModerationMembersSection'
import { ModerationReportsSection } from '@/features/community/components/moderation/ModerationReportsSection'
import { ModerationRulesSection } from '@/features/community/components/moderation/ModerationRulesSection'
import { ModerationSettingsSection } from '@/features/community/components/moderation/ModerationSettingsSection'
import {
  useCommunityDetailBySlug,
  useCommunityJoinRequests,
  useCommunityStats,
} from '@/features/community/hooks/useCommunitiesQueries'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useModerationStats } from '@/features/reports/hooks/useReports'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

type ModerationTab = 'reports' | 'requests' | 'members' | 'rules' | 'settings'

const TABS: { id: ModerationTab; labelKey: TranslationKey; icon: typeof Flag; available: boolean }[] = [
  { id: 'reports', labelKey: 'moderation.tabs.reports', icon: Flag, available: true },
  { id: 'requests', labelKey: 'moderation.tabs.requests', icon: UserPlus, available: true },
  { id: 'members', labelKey: 'moderation.tabs.members', icon: Users, available: true },
  { id: 'rules', labelKey: 'moderation.tabs.rules', icon: ScrollText, available: true },
  { id: 'settings', labelKey: 'moderation.tabs.settings', icon: Settings, available: true },
]

export default function CommunityModerationPage() {
  const { t } = useLanguage()
  const { slug } = useParams({ from: '/communities/$slug/moderacion' })
  const { tab: initialTab } = useSearch({ from: '/communities/$slug/moderacion' })
  const { data: currentUser, isLoggedIn, isLoading: isLoadingSession } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<ModerationTab>(initialTab ?? 'reports')

  const communityQuery = useCommunityDetailBySlug(slug, isLoggedIn)

  const community = isLoggedIn ? communityQuery.data : undefined

  // El detalle no trae el total de publicaciones; eso viene de /communities/:id/stats
  const statsQuery = useCommunityStats(community?.id, isLoggedIn)
  const stats = isLoggedIn ? statsQuery.data : undefined

  // Para el contador del menu lateral; la seccion vuelve a usar la misma query
  const joinRequestsQuery = useCommunityJoinRequests(community?.id ?? 0, isLoggedIn)
  const pendingRequestCount = isLoggedIn ? (joinRequestsQuery.data?.length ?? 0) : 0

  // Para la insignia de "Reportes"; la seccion vuelve a usar la misma query.
  const moderationStatsQuery = useModerationStats(community?.id, isLoggedIn)
  const pendingReportCount = isLoggedIn ? (moderationStatsQuery.data?.pendingReports ?? 0) : 0

  const isOwner = community?.membershipRole === 'owner'
  // El superadmin entra a cualquier comunidad: el backend ya lo deja pasar
  // (CommunityRoleGuard), así que negarle la pantalla solo lo mandaría a usar
  // la API a mano. No es dueño, así que los ajustes siguen cerrados.
  const canModerate = isOwner || community?.membershipRole === 'moderator' || currentUser?.role === 'superadmin'

  return (
    <section className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 py-8')}>
        <Link
          to="/communities/$slug"
          params={{ slug }}
          className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-gray hover:text-mynted-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('moderation.backToCommunity')}
        </Link>

        {!isLoadingSession && !isLoggedIn && (
          <SignedOutState description={t('moderation.signedOutDescription')} />
        )}

        {(isLoadingSession || (isLoggedIn && communityQuery.isPending)) && (
          <div className="flex flex-col gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        )}

        {isLoggedIn && communityQuery.isError && (
          <QueryErrorState
            error={communityQuery.error}
            onRetry={() => void communityQuery.refetch()}
            texts={{ notFound: { description: t('errors.notFound.community') }, error: { description: t('community.detail.loadError') } }}
          />
        )}

        {community && !canModerate && (
          <ErrorState
            kind="forbidden"
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
          </ErrorState>
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
              <StatCard
                value={stats?.memberCount ?? community.memberCount}
                label={t('moderation.stats.members')}
                color="text-mynted-blue"
              />
              <StatCard value={stats?.postCount} label={t('moderation.stats.posts')} color="text-mynted-blue" />
              <StatCard
                value={stats?.recentPostCount ?? community.recentPostCount}
                label={t('moderation.stats.recentPosts')}
                color="text-emerald-600"
              />
              <StatCard value={community.rules.length} label={t('moderation.stats.rules')} color="text-mynted-orange" />
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
                      {tab.id === 'reports' && pendingReportCount > 0 && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-mynted-orange text-white'
                          }`}
                        >
                          {pendingReportCount}
                        </span>
                      )}
                      {tab.id === 'requests' && pendingRequestCount > 0 && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-mynted-orange text-white'
                          }`}
                        >
                          {pendingRequestCount}
                        </span>
                      )}
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
                {activeTab === 'reports' && <ModerationReportsSection community={community} />}
                {activeTab === 'requests' && <ModerationJoinRequestsSection community={community} />}
                {activeTab === 'rules' && <ModerationRulesSection community={community} />}
                {activeTab === 'settings' && (
                  <ModerationSettingsSection community={community} isOwner={isOwner} />
                )}
                {activeTab === 'members' && (
                  <ModerationMembersSection
                    community={community}
                    // El rol en la comunidad manda: un superadmin que además es dueño actúa como dueño.
                    viewerRole={isOwner ? 'owner' : community.membershipRole === 'moderator' ? 'moderator' : 'superadmin'}
                    currentUserId={currentUser?.id}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </section>
  )
}

function StatCard({ value, label, color }: { value: number | undefined; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-mynted-border bg-white px-5 py-4">
      <p className={`font-heading text-2xl font-semibold ${color}`}>{value?.toLocaleString() ?? '—'}</p>
      <p className="mt-0.5 text-sm text-mynted-gray">{label}</p>
    </div>
  )
}
