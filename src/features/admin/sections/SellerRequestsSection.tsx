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
import { useAdminUsers, usePendingSellerRequests } from '../hooks/useAdminQueries'
import type { AdminTab, AdminUser } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'
import { Button } from '@/components/ui/Button'

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
 * Las pendientes salen de GET /users/seller-requests (ya vienen de la más
 * antigua a la más nueva). Las ya aprobadas o rechazadas no están en ese
 * listado, así que salen de GET /users: son las cuentas cuyo
 * sellerRequestStatus no es "none". Los datos de la tienda y del cobro de una
 * pendiente se piden aparte al abrirla (ver SellerRequestDialog).
 */
function toRequests(users: AdminUser[] | undefined) {
  return users?.filter((user) => user.sellerRequestStatus !== 'none')
}

function requestedAt(user: AdminUser) {
  return new Date(user.sellerRequestedAt ?? user.updatedAt).getTime()
}

export function SellerRequestsSection({ tab, currentUserId }: { tab: AdminTab; currentUserId: string }) {
  const usersQuery = useAdminUsers()
  const pendingQuery = usePendingSellerRequests()
  if (tab === 'overview') {
    const failed = usersQuery.isError ? usersQuery : pendingQuery.isError ? pendingQuery : null
    if (failed) {
      return (
        <LoadErrorPanel
          error={failed.error}
          onRetry={() => {
            void usersQuery.refetch()
            void pendingQuery.refetch()
          }}
        />
      )
    }
  }
  return tab === 'overview' ? (
    <SellerRequestsOverview
      requests={toRequests(usersQuery.data)}
      pending={pendingQuery.data?.map((request) => request.user)}
      isLoading={usersQuery.isPending || pendingQuery.isPending}
      currentUserId={currentUserId}
    />
  ) : (
    <SellerRequestsManage usersQuery={usersQuery} pendingQuery={pendingQuery} currentUserId={currentUserId} />
  )
}

function SellerRequestsOverview({
  requests,
  pending,
  isLoading,
  currentUserId,
}: {
  /** Cuentas con alguna solicitud (GET /users): sirven para los totales por estado. */
  requests: AdminUser[] | undefined
  /** Solo las pendientes, más antiguas primero (GET /users/seller-requests). */
  pending: AdminUser[] | undefined
  isLoading: boolean
  currentUserId: string
}) {
  const { t, language } = useLanguage()
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [requestUserId, setRequestUserId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const list = requests ?? []
    const pendingList = pending ?? []
    return {
      pending: pendingList.length,
      approved: list.filter((user) => user.sellerRequestStatus === 'approved').length,
      rejected: list.filter((user) => user.sellerRequestStatus === 'rejected').length,
      // El total cuenta cada solicitud una vez: las revisadas (de /users) más las pendientes.
      total: list.filter((user) => user.sellerRequestStatus !== 'pending').length + pendingList.length,
      // El backend ya las manda de la más antigua a la más nueva: las que llevan más tiempo esperando.
      oldestPending: pendingList.slice(0, 6),
    }
  }, [requests, pending])

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
                  <Button
                    type="button"
                    onClick={() => setRequestUserId(user.id)}
                    variant="secondary"
                    size="sm"
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    {t('admin.sellerRequest.open')}
                  </Button>
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
  pendingQuery,
  currentUserId,
}: {
  usersQuery: ReturnType<typeof useAdminUsers>
  pendingQuery: ReturnType<typeof usePendingSellerRequests>
  currentUserId: string
}) {
  const { t, language } = useLanguage()
  // Por defecto se ven las pendientes, que son las que requieren acción.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [requestUserId, setRequestUserId] = useState<string | null>(null)

  // "Pendientes" usa su listado propio; los demás filtros, la lista de cuentas.
  const source = statusFilter === 'pending' ? pendingQuery : usersQuery
  const rows = useMemo(() => {
    if (statusFilter === 'pending') return pendingQuery.data?.map((request) => request.user)
    return toRequests(usersQuery.data)?.filter((user) => statusFilter === 'all' || user.sellerRequestStatus === statusFilter)
  }, [usersQuery.data, pendingQuery.data, statusFilter])

  const columns: AdminColumn<AdminUser>[] = [
    {
      id: 'requester',
      header: t('admin.sellers.columns.requester'),
      sortValue: (user) => user.username,
      render: (user) => (
        <IdentityCell
          avatar={<Avatar src={user.photoUrl} name={user.username} />}
          title={<UserHoverName user={user} onOpen={() => setReviewUserId(user.id)} />}
          subtitle={user.email}
        />
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
        isLoading={source.isPending}
        error={source.error}
        onRetry={() => void source.refetch()}
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
