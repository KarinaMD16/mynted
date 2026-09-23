import { useMemo, useState } from 'react'
import { CircleCheck, CircleX, Clock, FileText, Store, UserSearch } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { SellerRequestStatus } from '@/features/auth/models/auth'
import { formatShortDate } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  Avatar,
  FilterSelect,
  IconAction,
  IdentityCell,
  LoadErrorPanel,
  Panel,
  StatCard,
  StatusPill,
  type PillTone,
} from '../components/AdminUi'
import { UserHoverName } from '../components/HoverSummary'
import { SellerRequestDialog } from '../components/SellerRequestDialog'
import { UserReviewDrawer } from '../components/UserReviewDrawer'
import { useAdminUsers } from '../hooks/useAdminQueries'
import type { AdminTab, AdminUser } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'

type RequestStatus = Exclude<SellerRequestStatus, 'none'>

const STATUS_LABEL: Record<RequestStatus, TranslationKey> = {
  pending: 'admin.sellers.status.pending',
  approved: 'admin.sellers.status.approved',
  rejected: 'admin.sellers.status.rejected',
}

const STATUS_TONE: Record<RequestStatus, PillTone> = {
  pending: 'amber',
  approved: 'teal',
  rejected: 'red',
}

/**
 * Las solicitudes salen de GET /users: son las cuentas cuyo
 * sellerRequestStatus no es "none" (así también se ven las ya aprobadas o
 * rechazadas). Los datos de la tienda y del cobro de una pendiente se piden
 * aparte al abrirla (ver SellerRequestDialog).
 */
function toRequests(users: AdminUser[] | undefined) {
  return users?.filter((user) => user.sellerRequestStatus !== 'none')
}

function requestedAt(user: AdminUser) {
  return new Date(user.sellerRequestedAt ?? user.updatedAt).getTime()
}

export function SellerRequestsSection({ tab, currentUserId }: { tab: AdminTab; currentUserId: string }) {
  const usersQuery = useAdminUsers()
  if (tab === 'overview' && usersQuery.isError) {
    return <LoadErrorPanel error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
  }
  return tab === 'overview' ? (
    <SellerRequestsOverview
      requests={toRequests(usersQuery.data)}
      isLoading={usersQuery.isPending}
      currentUserId={currentUserId}
    />
  ) : (
    <SellerRequestsManage usersQuery={usersQuery} currentUserId={currentUserId} />
  )
}

function SellerRequestsOverview({
  requests,
  isLoading,
  currentUserId,
}: {
  requests: AdminUser[] | undefined
  isLoading: boolean
  currentUserId: string
}) {
  const { t, language } = useLanguage()
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [requestUserId, setRequestUserId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const list = requests ?? []
    const pending = list.filter((user) => user.sellerRequestStatus === 'pending')
    return {
      pending: pending.length,
      approved: list.filter((user) => user.sellerRequestStatus === 'approved').length,
      rejected: list.filter((user) => user.sellerRequestStatus === 'rejected').length,
      total: list.length,
      // Las más viejas primero: son las que llevan más tiempo esperando.
      oldestPending: [...pending].sort((a, b) => requestedAt(a) - requestedAt(b)).slice(0, 6),
    }
  }, [requests])

  if (isLoading) return <OverviewSkeleton />

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label={t('admin.sellers.stats.pending')} value={stats.pending} tone="amber" />
        <StatCard icon={CircleCheck} label={t('admin.sellers.stats.approved')} value={stats.approved} tone="teal" />
        <StatCard icon={CircleX} label={t('admin.sellers.stats.rejected')} value={stats.rejected} tone="red" />
        <StatCard icon={Store} label={t('admin.sellers.stats.total')} value={stats.total} tone="violet" />
      </div>

      <Panel title={t('admin.sellers.pendingTitle')} action={<ManageLink section="sellerRequests" />}>
        {stats.oldestPending.length === 0 ? (
          <p className="py-8 text-center text-sm text-mynted-gray">{t('admin.sellers.noPending')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mynted-border">
            {stats.oldestPending.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <IdentityCell
                  avatar={<Avatar src={user.photoUrl} name={user.username} />}
                  title={<UserHoverName user={user} onOpen={() => setReviewUserId(user.id)} />}
                  subtitle={user.email}
                />
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-sm text-mynted-gray sm:inline">
                    {formatShortDate(user.sellerRequestedAt ?? user.updatedAt, language)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRequestUserId(user.id)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-mynted-border bg-white px-3 py-1.5 text-sm font-semibold text-mynted-ink transition-colors hover:bg-mynted-bg"
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    {t('admin.sellerRequest.open')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
      <SellerRequestDialog userId={requestUserId} onClose={() => setRequestUserId(null)} />
    </>
  )
}

type StatusFilter = 'all' | RequestStatus

function SellerRequestsManage({
  usersQuery,
  currentUserId,
}: {
  usersQuery: ReturnType<typeof useAdminUsers>
  currentUserId: string
}) {
  const { t, language } = useLanguage()
  // Por defecto se ven las pendientes, que son las que requieren acción.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [requestUserId, setRequestUserId] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      toRequests(usersQuery.data)?.filter(
        (user) => statusFilter === 'all' || user.sellerRequestStatus === statusFilter,
      ),
    [usersQuery.data, statusFilter],
  )

  const columns: AdminColumn<AdminUser>[] = [
    {
      id: 'requester',
      header: t('admin.sellers.columns.requester'),
      sortValue: (user) => user.username,
      render: (user) => (
        <IdentityCell avatar={<Avatar src={user.photoUrl} name={user.username} />} title={user.username} subtitle={user.email} />
      ),
    },
    {
      id: 'location',
      header: t('admin.sellers.columns.location'),
      sortValue: (user) => user.location ?? '',
      render: (user) => user.location || '—',
    },
    {
      id: 'status',
      header: t('admin.sellers.columns.status'),
      sortValue: (user) => user.sellerRequestStatus,
      render: (user) => {
        const status = user.sellerRequestStatus as RequestStatus
        return <StatusPill tone={STATUS_TONE[status]}>{t(STATUS_LABEL[status])}</StatusPill>
      },
    },
    {
      id: 'requestedAt',
      header: t('admin.sellers.columns.requestedAt'),
      sortValue: requestedAt,
      render: (user) => formatShortDate(user.sellerRequestedAt ?? user.updatedAt, language),
    },
  ]

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(user) => user.id}
        getSearchText={(user) => `${user.username} ${user.email} ${user.location ?? ''}`}
        isLoading={usersQuery.isPending}
        error={usersQuery.error}
        onRetry={() => void usersQuery.refetch()}
        initialSort={{ id: 'requestedAt', direction: 'asc' }}
        toolbar={
          <FilterSelect<StatusFilter>
            label={t('admin.sellers.columns.status')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('admin.sellers.filterAll') },
              ...(Object.keys(STATUS_LABEL) as RequestStatus[]).map((status) => ({
                value: status,
                label: t(STATUS_LABEL[status]),
              })),
            ]}
          />
        }
        renderActions={(user) => (
          <>
            {user.sellerRequestStatus === 'pending' ? (
              // Aprobar y rechazar viven en el diálogo, para decidir con los datos a la vista.
              <IconAction icon={FileText} label={t('admin.sellerRequest.open')} onPress={() => setRequestUserId(user.id)} />
            ) : (
              <span className="px-2 text-xs text-mynted-gray-light">{t('admin.sellers.alreadyReviewed')}</span>
            )}
            <IconAction icon={UserSearch} label={t('admin.review.open')} onPress={() => setReviewUserId(user.id)} />
          </>
        )}
      />

      <SellerRequestDialog userId={requestUserId} onClose={() => setRequestUserId(null)} />
      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}
