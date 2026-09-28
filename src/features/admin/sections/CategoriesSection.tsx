import { useMemo } from 'react'
import { FolderCheck, FolderOpen, FolderTree, Pencil, Plus, Trash2, Trophy } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCategories } from '@/features/community/hooks/useCommunitiesQueries'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  DistributionList,
  IconAction,
  LoadErrorPanel,
  Panel,
  ReadOnlyNotice,
  StatCard,
} from '../components/AdminUi'
import { useAdminCommunities } from '../hooks/useAdminQueries'
import type { AdminTab } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'
import { Button } from '@/components/ui/Button'

interface CategoryRow {
  categoryId: number
  name: string
  communityCount: number
}

/**
 * Solo lectura: el backend solo expone GET /categories. La cantidad de
 * comunidades por categoría se calcula con el listado de comunidades
 * activas (ver useAdminCommunities), así que no cuenta las inactivas.
 */
function useCategoryRows() {
  const categoriesQuery = useCategories()
  const communitiesQuery = useAdminCommunities()

  const rows = useMemo<CategoryRow[] | undefined>(() => {
    if (!categoriesQuery.data) return undefined
    const counts = new Map<number, number>()
    communitiesQuery.data?.forEach((community) => {
      const id = community.category?.categoryId
      if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1)
    })
    return categoriesQuery.data.map((category) => ({
      ...category,
      communityCount: counts.get(category.categoryId) ?? 0,
    }))
  }, [categoriesQuery.data, communitiesQuery.data])

  return {
    rows,
    isLoading: categoriesQuery.isPending || communitiesQuery.isPending,
    error: categoriesQuery.error ?? communitiesQuery.error,
    refetch: () => {
      void categoriesQuery.refetch()
      void communitiesQuery.refetch()
    },
  }
}

export function CategoriesSection({ tab }: { tab: AdminTab }) {
  const data = useCategoryRows()
  if (tab === 'overview' && data.error) return <LoadErrorPanel error={data.error} onRetry={data.refetch} />
  return tab === 'overview' ? <CategoriesOverview {...data} /> : <CategoriesManage {...data} />
}

function CategoriesOverview({ rows, isLoading }: ReturnType<typeof useCategoryRows>) {
  const { t } = useLanguage()

  const stats = useMemo(() => {
    const list = rows ?? []
    const sorted = [...list].sort((a, b) => b.communityCount - a.communityCount)
    return {
      total: list.length,
      withCommunities: list.filter((row) => row.communityCount > 0).length,
      empty: list.filter((row) => row.communityCount === 0).length,
      top: sorted[0]?.communityCount ? sorted[0].name : undefined,
      distribution: sorted.slice(0, 10).map((row) => ({ label: row.name, value: row.communityCount })),
    }
  }, [rows])

  if (isLoading) return <OverviewSkeleton />

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderTree} label={t('admin.categories.stats.total')} value={stats.total} tone="violet" />
        <StatCard icon={FolderCheck} label={t('admin.categories.stats.withCommunities')} value={stats.withCommunities} tone="teal" />
        <StatCard icon={FolderOpen} label={t('admin.categories.stats.empty')} value={stats.empty} tone="gray" />
        <StatCard icon={Trophy} label={t('admin.categories.stats.top')} value={stats.top} tone="orange" />
      </div>

      <Panel title={t('admin.communities.byCategoryTitle')} action={<ManageLink section="categories" />}>
        <DistributionList items={stats.distribution} emptyLabel={t('admin.table.empty')} />
      </Panel>
    </>
  )
}

function CategoriesManage({ rows, isLoading, error, refetch }: ReturnType<typeof useCategoryRows>) {
  const { t, language } = useLanguage()
  const unavailable = t('admin.readOnly.actionUnavailable')

  const columns: AdminColumn<CategoryRow>[] = [
    {
      id: 'name',
      header: t('admin.categories.columns.category'),
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-mynted-ink">{row.name}</span>,
    },
    {
      id: 'id',
      header: t('admin.categories.columns.id'),
      sortValue: (row) => row.categoryId,
      render: (row) => <span className="tabular-nums">#{row.categoryId}</span>,
    },
    {
      id: 'communities',
      header: t('admin.categories.columns.communities'),
      sortValue: (row) => row.communityCount,
      render: (row) => row.communityCount.toLocaleString(language),
    },
  ]

  return (
    <>
      <ReadOnlyNotice title={t('admin.readOnly.title')} description={t('admin.readOnly.categories')} />

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(row) => row.categoryId}
        getSearchText={(row) => `${row.name} ${row.categoryId}`}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        initialSort={{ id: 'name', direction: 'asc' }}
        primaryAction={
          <Button
            type="button"
            disabled
            title={`${t('admin.categories.add')} · ${unavailable}`}
            variant="primary"
            size="md"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('admin.categories.add')}
          </Button>
        }
        renderActions={() => (
          <>
            <IconAction icon={Pencil} label={t('admin.categories.edit')} disabled disabledReason={unavailable} />
            <IconAction icon={Trash2} label={t('admin.categories.delete')} disabled disabledReason={unavailable} />
          </>
        )}
      />
    </>
  )
}
