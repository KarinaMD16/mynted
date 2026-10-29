import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Ban, ExternalLink, Globe, Lock, Plus, RotateCcw, ShieldAlert, Trash2, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import { CreateCommunityForm } from '@/features/community/components/create/CreateCommunityForm'
import { useCategories } from '@/features/community/hooks/useCommunitiesQueries'
import { formatShortDate } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  Avatar,
  ConfirmDialog,
  ConfirmWithReasonDialog,
  DistributionList,
  FilterSelect,
  IconAction,
  IdentityCell,
  LoadErrorPanel,
  Panel,
  StatCard,
  StatusPill,
} from '../components/AdminUi'
import { CommunityHoverName } from '../components/HoverSummary'
import {
  adminKeys,
  useAdminCommunities,
  useAdminUsers,
  useCommunityActiveMutation,
  useDeleteCommunityMutation,
} from '../hooks/useAdminQueries'
import type { AdminCommunity, AdminTab } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'

/**
 * Pestaña "Comunidades" (tarea 1156). Se apoya en GET /communities/all, que es
 * el listado de administración: a diferencia del público trae también las
 * desactivadas y las eliminadas, que son las que hay que poder encontrar.
 *
 * Lo que no está acá es porque el backend no lo manda en ese listado: dueño,
 * etiquetas e imagen. Pedirlos sería una consulta por fila; para verlos se
 * entra a la comunidad desde la misma tabla.
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

/** Una comunidad eliminada sigue en el listado, pero ya no se puede tocar. */
function isDeleted(community: AdminCommunity) {
  return community.deletedAt !== null
}

function CommunitiesOverview({
  communities,
  isLoading,
}: {
  communities: AdminCommunity[] | undefined
  isLoading: boolean
}) {
  const { t, language } = useLanguage()

  const stats = useMemo(() => {
    // Las eliminadas no cuentan para el resumen: ya no existen para nadie.
    const list = (communities ?? []).filter((community) => !isDeleted(community))
    const byCategory = new Map<string, number>()
    list.forEach((community) => {
      const label = community.category?.name ?? t('admin.communities.noCategory')
      byCategory.set(label, (byCategory.get(label) ?? 0) + 1)
    })
    return {
      active: list.filter((community) => community.isActive).length,
      public: list.filter((community) => !community.isPrivate).length,
      private: list.filter((community) => community.isPrivate).length,
      reports: list.reduce((sum, community) => sum + community.pendingReportsCount, 0),
      top: [...list].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5),
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
        <StatCard icon={UsersRound} label={t('admin.communities.stats.total')} value={stats.active} tone="violet" />
        <StatCard icon={Globe} label={t('admin.communities.stats.public')} value={stats.public} tone="teal" />
        <StatCard icon={Lock} label={t('admin.communities.stats.private')} value={stats.private} tone="amber" />
        <StatCard
          icon={ShieldAlert}
          label={t('admin.communities.stats.reports')}
          value={stats.reports}
          tone={stats.reports > 0 ? 'red' : 'gray'}
        />
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
                    avatar={<Avatar src={null} name={community.name} square />}
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

/** La acción que está esperando confirmación. */
type PendingAction =
  | { kind: 'active'; community: AdminCommunity; active: boolean }
  | { kind: 'delete'; community: AdminCommunity }

function CommunitiesManage({ communitiesQuery }: { communitiesQuery: ReturnType<typeof useAdminCommunities> }) {
  const { t, language } = useLanguage()
  const categoriesQuery = useCategories()
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive' | 'deleted'>('')
  const [isCreating, setCreating] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const activeMutation = useCommunityActiveMutation()
  const deleteMutation = useDeleteCommunityMutation()
  const queryClient = useQueryClient()
  // Solo cuentas activas: el backend rechaza poner como dueña a una inactiva.
  const usersQuery = useAdminUsers()
  const ownerOptions = useMemo(
    () => (usersQuery.data ?? []).filter((user) => user.isActive).map(({ id, username }) => ({ id, username })),
    [usersQuery.data],
  )

  const rows = useMemo(
    () =>
      communitiesQuery.data?.filter((community) => {
        if (categoryFilter !== 'all' && String(community.category?.categoryId) !== categoryFilter) return false
        if (statusFilter === 'deleted') return isDeleted(community)
        if (statusFilter === 'active') return !isDeleted(community) && community.isActive
        if (statusFilter === 'inactive') return !isDeleted(community) && !community.isActive
        return true
      }),
    [communitiesQuery.data, categoryFilter, statusFilter],
  )

  const number = (value: number) => value.toLocaleString(language)

  const columns: AdminColumn<AdminCommunity>[] = [
    {
      id: 'community',
      header: t('admin.communities.columns.community'),
      sortValue: (community) => community.name,
      render: (community) => (
        <IdentityCell
          avatar={<Avatar src={null} name={community.name} square />}
          title={<CommunityHoverName community={community} />}
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
      id: 'members',
      header: t('admin.communities.columns.members'),
      sortValue: (community) => community.memberCount,
      render: (community) => <span className="tabular-nums">{number(community.memberCount)}</span>,
    },
    {
      id: 'products',
      header: t('admin.communities.columns.products'),
      sortValue: (community) => community.productCount,
      render: (community) => <span className="tabular-nums">{number(community.productCount)}</span>,
    },
    {
      id: 'reports',
      header: t('admin.communities.columns.reports'),
      sortValue: (community) => community.pendingReportsCount,
      render: (community) => (
        <span className={`tabular-nums ${community.pendingReportsCount > 0 ? 'font-semibold text-red-600' : ''}`}>
          {number(community.pendingReportsCount)}
        </span>
      ),
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
      id: 'status',
      header: t('admin.communities.columns.status'),
      sortValue: (community) => (isDeleted(community) ? 2 : community.isActive ? 0 : 1),
      render: (community) =>
        isDeleted(community) ? (
          <StatusPill tone="gray">{t('admin.communities.status.deleted')}</StatusPill>
        ) : community.isActive ? (
          <StatusPill tone="teal">{t('admin.communities.status.active')}</StatusPill>
        ) : (
          <StatusPill tone="red">{t('admin.communities.status.inactive')}</StatusPill>
        ),
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
      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(community) => community.id}
        getSearchText={(community) =>
          `${community.name} ${community.slug} ${community.description} ${community.category?.name ?? ''}`
        }
        searchPlaceholder={t('admin.communities.searchPlaceholder')}
        isLoading={communitiesQuery.isPending}
        error={communitiesQuery.error}
        onRetry={() => void communitiesQuery.refetch()}
        initialSort={{ id: 'reports', direction: 'desc' }}
        primaryAction={
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {t('admin.communities.create')}
          </Button>
        }
        toolbar={
          <>
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
            <FilterSelect
              label={t('admin.communities.columns.status')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: t('admin.communities.filterAllStatuses') },
                { value: 'active', label: t('admin.communities.status.active') },
                { value: 'inactive', label: t('admin.communities.status.inactive') },
                { value: 'deleted', label: t('admin.communities.status.deleted') },
              ]}
            />
          </>
        }
        renderActions={(community) => {
          const deleted = isDeleted(community)
          const reason = deleted ? t('admin.communities.deletedHint') : undefined
          return (
            <>
              {/* Se abren en otra pestaña para no perder el lugar en el panel. */}
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
              <a
                href={`/communities/${community.slug}/moderacion`}
                target="_blank"
                rel="noopener noreferrer"
                title={t('admin.communities.moderate')}
                aria-label={t('admin.communities.moderate')}
                className="flex size-8 items-center justify-center rounded-lg text-mynted-gray transition-colors outline-none hover:bg-mynted-bg hover:text-mynted-ink focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
              >
                <ShieldAlert className="size-4" aria-hidden="true" />
              </a>
              <IconAction
                icon={community.isActive ? Ban : RotateCcw}
                label={t(community.isActive ? 'admin.communities.deactivate' : 'admin.communities.activate')}
                tone={community.isActive ? 'danger' : 'success'}
                disabled={deleted}
                disabledReason={reason}
                onPress={() => {
                  activeMutation.reset()
                  setPending({ kind: 'active', community, active: !community.isActive })
                }}
              />
              <IconAction
                icon={Trash2}
                label={t('admin.communities.delete')}
                tone="danger"
                disabled={deleted}
                disabledReason={reason}
                onPress={() => {
                  deleteMutation.reset()
                  setPending({ kind: 'delete', community })
                }}
              />
            </>
          )
        }}
      />

      {/* El mismo formulario que usa cualquiera para crear una comunidad, más
          el selector de dueño, que el backend solo acepta de un superadmin. Sin
          elegir ninguno la comunidad queda sin dueño, que también es válido.

          Al cerrarlo se recarga el listado: el formulario solo invalida la
          clave pública ['communities'], que no es la de esta tabla. */}
      <CreateCommunityForm
        isOpen={isCreating}
        ownerOptions={ownerOptions}
        onClose={() => {
          setCreating(false)
          void queryClient.invalidateQueries({ queryKey: adminKeys.communities })
        }}
      />

      {pending?.kind === 'active' && (
        <ConfirmDialog
          open
          title={t(pending.active ? 'admin.communities.activateTitle' : 'admin.communities.deactivateTitle', {
            name: pending.community.name,
          })}
          description={t(
            pending.active ? 'admin.communities.activateDescription' : 'admin.communities.deactivateDescription',
          )}
          confirmLabel={t(pending.active ? 'admin.communities.activate' : 'admin.communities.deactivate')}
          tone={pending.active ? 'primary' : 'danger'}
          isPending={activeMutation.isPending}
          error={activeMutation.error}
          onClose={() => setPending(null)}
          onConfirm={() =>
            activeMutation.mutate(
              { communityId: pending.community.id, active: pending.active },
              { onSuccess: () => setPending(null) },
            )
          }
        />
      )}

      {pending?.kind === 'delete' && (
        <ConfirmWithReasonDialog
          open
          title={t('admin.communities.deleteTitle', { name: pending.community.name })}
          description={t('admin.communities.deleteDescription', {
            members: number(pending.community.memberCount),
            products: number(pending.community.productCount),
          })}
          confirmLabel={t('admin.communities.delete')}
          isPending={deleteMutation.isPending}
          error={deleteMutation.error}
          onClose={() => setPending(null)}
          onConfirm={(reason) =>
            deleteMutation.mutate({ communityId: pending.community.id, reason }, { onSuccess: () => setPending(null) })
          }
        />
      )}
    </>
  )
}
