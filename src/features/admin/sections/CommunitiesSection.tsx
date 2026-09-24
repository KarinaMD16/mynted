import { useMemo, useState } from 'react'
import { Ban, ExternalLink, Globe, Lock, UsersRound, UserRoundPlus } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { CommunityListItem } from '@/features/community/models/communityDTOs'
import { useCategories } from '@/features/community/hooks/useCommunitiesQueries'
import { formatShortDate } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  Avatar,
  DistributionList,
  FilterSelect,
  IconAction,
  IdentityCell,
  LoadErrorPanel,
  Panel,
  ReadOnlyNotice,
  StatCard,
  StatusPill,
} from '../components/AdminUi'
import { CommunityHoverName } from '../components/HoverSummary'
import { useAdminCommunities } from '../hooks/useAdminQueries'
import type { AdminTab } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'

/**
 * Solo lectura: el backend todavía no tiene un listado de administración
 * (GET /communities devuelve solo las activas) y activar/desactivar exige
 * ser dueño de la comunidad, no superadmin. Las acciones quedan visibles
 * pero deshabilitadas, con el motivo en el tooltip.
 */
export function CommunitiesSection({ tab }: { tab: AdminTab }) {
  const communitiesQuery = useAdminCommunities()
  if (tab === 'overview' && communitiesQuery.isError) {
    return <LoadErrorPanel error={communitiesQuery.error} onRetry={() => void communitiesQuery.refetch()} />
  }
  return tab === 'overview' ? (
    <CommunitiesOverview communities={communitiesQuery.data} isLoading={communitiesQuery.isPending} />
  ) : (
    <CommunitiesManage communitiesQuery={communitiesQuery} />
  )
}

function CommunitiesOverview({
  communities,
  isLoading,
}: {
  communities: CommunityListItem[] | undefined
  isLoading: boolean
}) {
  const { t, language } = useLanguage()

  const stats = useMemo(() => {
    const list = communities ?? []
    const byCategory = new Map<string, number>()
    list.forEach((community) => {
      const label = community.category?.name ?? t('admin.communities.noCategory')
      byCategory.set(label, (byCategory.get(label) ?? 0) + 1)
    })
    return {
      total: list.length,
      public: list.filter((community) => !community.isPrivate).length,
      private: list.filter((community) => community.isPrivate).length,
      members: list.reduce((sum, community) => sum + community.memberCount, 0),
      top: [...list].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 5),
      byCategory: [...byCategory.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    }
  }, [communities, t])

  if (isLoading) return <OverviewSkeleton />

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UsersRound} label={t('admin.communities.stats.total')} value={stats.total} tone="violet" />
        <StatCard icon={Globe} label={t('admin.communities.stats.public')} value={stats.public} tone="teal" />
        <StatCard icon={Lock} label={t('admin.communities.stats.private')} value={stats.private} tone="amber" />
        <StatCard icon={UserRoundPlus} label={t('admin.communities.stats.members')} value={stats.members} tone="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={t('admin.communities.topTitle')} action={<ManageLink section="communities" />}>
          {stats.top.length === 0 ? (
            <p className="py-6 text-center text-sm text-mynted-gray">{t('admin.table.empty')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mynted-border">
              {stats.top.map((community) => (
                <li key={community.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <IdentityCell
                    avatar={<Avatar src={community.imageUrl} name={community.name} square />}
                    title={<CommunityHoverName community={community} />}
                    subtitle={`@${community.slug}`}
                  />
                  <span className="shrink-0 text-sm text-mynted-gray">
                    {t('communities.card.members', { count: community.memberCount.toLocaleString(language) })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('admin.communities.byCategoryTitle')}>
          <DistributionList items={stats.byCategory} emptyLabel={t('admin.table.empty')} />
        </Panel>
      </div>
    </>
  )
}

function CommunitiesManage({ communitiesQuery }: { communitiesQuery: ReturnType<typeof useAdminCommunities> }) {
  const { t, language } = useLanguage()
  const categoriesQuery = useCategories()
  const [categoryFilter, setCategoryFilter] = useState('all')

  const rows = useMemo(
    () =>
      communitiesQuery.data?.filter(
        (community) => categoryFilter === 'all' || String(community.category?.categoryId) === categoryFilter,
      ),
    [communitiesQuery.data, categoryFilter],
  )

  const columns: AdminColumn<CommunityListItem>[] = [
    {
      id: 'community',
      header: t('admin.communities.columns.community'),
      sortValue: (community) => community.name,
      render: (community) => (
        <IdentityCell
          avatar={<Avatar src={community.imageUrl} name={community.name} square />}
          title={community.name}
          subtitle={`@${community.slug}`}
        />
      ),
    },
    {
      id: 'category',
      header: t('admin.communities.columns.category'),
      sortValue: (community) => community.category?.name ?? '',
      render: (community) => community.category?.name ?? t('admin.communities.noCategory'),
    },
    {
      id: 'privacy',
      header: t('admin.communities.columns.privacy'),
      sortValue: (community) => (community.isPrivate ? 1 : 0),
      render: (community) =>
        community.isPrivate ? (
          <StatusPill tone="amber">{t('communities.card.private')}</StatusPill>
        ) : (
          <StatusPill tone="teal">{t('communities.card.public')}</StatusPill>
        ),
    },
    {
      id: 'members',
      header: t('admin.communities.columns.members'),
      sortValue: (community) => community.memberCount,
      render: (community) => community.memberCount.toLocaleString(language),
    },
    {
      id: 'created',
      header: t('admin.communities.columns.created'),
      sortValue: (community) => new Date(community.createdAt).getTime(),
      render: (community) => formatShortDate(community.createdAt, language),
    },
  ]

  return (
    <>
      <ReadOnlyNotice title={t('admin.readOnly.title')} description={t('admin.readOnly.communities')} />

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(community) => community.id}
        getSearchText={(community) =>
          `${community.name} ${community.slug} ${community.description} ${community.category?.name ?? ''}`
        }
        isLoading={communitiesQuery.isPending}
        error={communitiesQuery.error}
        onRetry={() => void communitiesQuery.refetch()}
        initialSort={{ id: 'members', direction: 'desc' }}
        toolbar={
          <FilterSelect
            label={t('admin.communities.columns.category')}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: t('admin.communities.filterAllCategories') },
              ...(categoriesQuery.data ?? []).map((category) => ({
                value: String(category.categoryId),
                label: category.name,
              })),
            ]}
          />
        }
        renderActions={(community) => (
          <>
            {/* Se abre en otra pestaña para no perder el lugar en el panel. */}
            <a
              href={`/communities/${community.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title={t('admin.communities.view')}
              aria-label={t('admin.communities.view')}
              className="flex size-8 items-center justify-center rounded-lg text-mynted-gray transition-colors outline-none hover:bg-mynted-bg hover:text-mynted-ink focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
            <IconAction
              icon={Ban}
              label={t('admin.communities.deactivate')}
              disabled
              disabledReason={t('admin.readOnly.actionUnavailable')}
            />
          </>
        )}
      />
    </>
  )
}
