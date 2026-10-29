import { useId, useMemo, useState, type FormEvent } from 'react'
import { Ban, FolderCheck, FolderOpen, FolderTree, Plus, RotateCcw, Trophy } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { useCategories } from '@/features/community/hooks/useCommunitiesQueries'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  ConfirmDialog,
  DistributionList,
  FilterSelect,
  IconAction,
  LoadErrorPanel,
  Panel,
  StatCard,
  StatusPill,
} from '../components/AdminUi'
import {
  useAdminCommunities,
  useCategoryActiveMutation,
  useCreateCategoryMutation,
  useInactiveCategories,
} from '../hooks/useAdminQueries'
import type { AdminTab } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'

interface CategoryRow {
  categoryId: number
  name: string
  isActive: boolean
  communityCount: number
}

const NAME_MAX_LENGTH = 100

/**
 * Activas (GET /categories, la pública) e inactivas (GET /categories/inactive)
 * en una sola lista. La cantidad de comunidades sale del listado del panel y
 * cuenta solo las activas: las desactivadas o eliminadas no aparecen en el sitio.
 */
function useCategoryRows() {
  const activeQuery = useCategories()
  const inactiveQuery = useInactiveCategories()
  const communitiesQuery = useAdminCommunities()

  const rows = useMemo<CategoryRow[] | undefined>(() => {
    if (!activeQuery.data || !inactiveQuery.data) return undefined
    const counts = new Map<number, number>()
    communitiesQuery.data?.forEach((community) => {
      const id = community.category?.categoryId
      if (id === undefined || !community.isActive || community.deletedAt !== null) return
      counts.set(id, (counts.get(id) ?? 0) + 1)
    })
    const toRow = (category: { categoryId: number; name: string }, isActive: boolean): CategoryRow => ({
      categoryId: category.categoryId,
      name: category.name,
      isActive,
      communityCount: counts.get(category.categoryId) ?? 0,
    })
    return [
      ...activeQuery.data.map((category) => toRow(category, true)),
      ...inactiveQuery.data.map((category) => toRow(category, false)),
    ]
  }, [activeQuery.data, inactiveQuery.data, communitiesQuery.data])

  return {
    rows,
    isLoading: activeQuery.isPending || inactiveQuery.isPending || communitiesQuery.isPending,
    error: activeQuery.error ?? inactiveQuery.error ?? communitiesQuery.error,
    refetch: () => {
      void activeQuery.refetch()
      void inactiveQuery.refetch()
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
    // El resumen habla de las que se pueden usar; las desactivadas se ven en Gestionar.
    const list = (rows ?? []).filter((row) => row.isActive)
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

type StatusFilter = '' | 'active' | 'inactive'

function CategoriesManage({ rows, isLoading, error, refetch }: ReturnType<typeof useCategoryRows>) {
  const { t, language } = useLanguage()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [isCreating, setCreating] = useState(false)
  const [pending, setPending] = useState<CategoryRow | null>(null)
  const activeMutation = useCategoryActiveMutation()

  const filtered = useMemo(
    () =>
      rows?.filter((row) => {
        if (statusFilter === 'active') return row.isActive
        if (statusFilter === 'inactive') return !row.isActive
        return true
      }),
    [rows, statusFilter],
  )

  const columns: AdminColumn<CategoryRow>[] = [
    {
      id: 'name',
      header: t('admin.categories.columns.category'),
      sortValue: (row) => row.name,
      render: (row) => row.name,
    },

    {
      id: 'status',
      header: t('admin.categories.columns.status'),
      sortValue: (row) => (row.isActive ? 0 : 1),
      render: (row) =>
        row.isActive ? (
          <StatusPill tone="teal">{t('admin.categories.status.active')}</StatusPill>
        ) : (
          <StatusPill tone="red">{t('admin.categories.status.inactive')}</StatusPill>
        ),
    },
  ]

  return (
    <>
      <AdminDataTable
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.categoryId}
        getSearchText={(row) => `${row.name} ${row.categoryId}`}
        searchPlaceholder={t('admin.categories.searchPlaceholder')}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        initialSort={{ id: 'name', direction: 'asc' }}
        primaryAction={
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {t('admin.categories.add')}
          </Button>
        }
        toolbar={
          <FilterSelect<StatusFilter>
            label={t('admin.categories.columns.status')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: t('admin.categories.filterAll') },
              { value: 'active', label: t('admin.categories.status.active') },
              { value: 'inactive', label: t('admin.categories.status.inactive') },
            ]}
          />
        }
        renderActions={(row) => (
          // El backend no permite renombrar ni borrar: desactivar es la forma de retirarla.
          <IconAction
            icon={row.isActive ? Ban : RotateCcw}
            label={t(row.isActive ? 'admin.categories.deactivate' : 'admin.categories.activate')}
            tone={row.isActive ? 'danger' : 'success'}
            onPress={() => {
              activeMutation.reset()
              setPending(row)
            }}
          />
        )}
      />

      <CreateCategoryDialog open={isCreating} onClose={() => setCreating(false)} />

      {pending && (
        <ConfirmDialog
          open
          title={t(pending.isActive ? 'admin.categories.deactivateTitle' : 'admin.categories.activateTitle', {
            name: pending.name,
          })}
          description={
            !pending.isActive
              ? t('admin.categories.activateDescription')
              : pending.communityCount === 0
                ? t('admin.categories.deactivateDescriptionNone')
                : t('admin.categories.deactivateDescription', { count: pending.communityCount.toLocaleString(language) })
          }
          confirmLabel={t(pending.isActive ? 'admin.categories.deactivate' : 'admin.categories.activate')}
          tone={pending.isActive ? 'danger' : 'primary'}
          isPending={activeMutation.isPending}
          error={activeMutation.error}
          onClose={() => setPending(null)}
          onConfirm={() =>
            activeMutation.mutate(
              { categoryId: pending.categoryId, active: !pending.isActive },
              { onSuccess: () => setPending(null) },
            )
          }
        />
      )}
    </>
  )
}

/** Nombre de la categoría nueva. El backend rechaza un nombre repetido (409) y su mensaje se muestra tal cual. */
function CreateCategoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  const fieldId = useId()
  const create = useCreateCategoryMutation()
  const [name, setName] = useState('')
  const [attempted, setAttempted] = useState(false)

  // Al abrir arranca limpio (como ConfirmWithReasonDialog: se ajusta en el render, no en un efecto).
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    if (open) {
      setName('')
      setAttempted(false)
      create.reset()
    }
  }

  const trimmed = name.trim()
  const isEmpty = trimmed === ''

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setAttempted(true)
    if (isEmpty || create.isPending) return
    create.mutate(trimmed, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !create.isPending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.categories.add')}</DialogTitle>
          <DialogDescription>{t('admin.categories.createDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-1.5">
          <label htmlFor={fieldId} className="text-[13px] font-medium text-mynted-ink">
            {t('admin.categories.nameLabel')}
          </label>
          <input
            id={fieldId}
            value={name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('admin.categories.namePlaceholder')}
            aria-invalid={attempted && isEmpty}
            className={`h-10 w-full rounded-[10px] border bg-white px-3.5 text-sm text-mynted-ink outline-none transition-shadow placeholder:text-mynted-gray-light focus:ring-2 focus:ring-mynted-orange/20 ${
              attempted && isEmpty ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange'
            }`}
          />
          {attempted && isEmpty && <span className="text-xs text-red-500">{t('admin.categories.nameRequired')}</span>}

          <DialogFooter className="mt-4">
            <Button type="button" onClick={onClose} disabled={create.isPending} variant="secondary" size="md">
              {t('profile.edit.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={create.isPending}>
              {t('admin.categories.create')}
            </Button>
          </DialogFooter>

          {create.isError && (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {getApiErrorMessage(create.error)}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
