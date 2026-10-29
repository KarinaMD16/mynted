import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleCheck, CircleX, Clock, FileText, Hourglass, UserSearch } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { SellerRequestStatus } from '@/features/auth/models/auth'
import { formatRelativeTime, formatShortDate } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  Avatar,
  DistributionList,
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
import { useAdminUsers, usePendingSellerRequests, useReviewedSellerRequests } from '../hooks/useAdminQueries'
import type { AdminTab, AdminUser } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'

type RequestStatus = Exclude<SellerRequestStatus, 'none'>

const STATUS_LABEL: Record<RequestStatus, TranslationKey> = {
  pending: 'admin.sellers.status.pending',
  approved: 'admin.sellers.status.approved',
  rejected: 'admin.sellers.status.rejected',
  revoked: 'admin.sellers.status.revoked',
}

const STATUS_TONE: Record<RequestStatus, PillTone> = {
  pending: 'amber',
  approved: 'teal',
  rejected: 'red',
  revoked: 'red',
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

/** Orden de la columna Estado: lo que pide acción primero. */
function statusRank(status: SellerRequestStatus) {
  return ['pending', 'approved', 'rejected', 'revoked'].indexOf(status)
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
  // Se fija una vez: la espera se mide contra "ahora" y no tiene que moverse en cada render.
  const [now] = useState(() => Date.now())

  const stats = useMemo(() => {
    const list = requests ?? []
    const pendingList = pending ?? []
    const count = (status: RequestStatus) => list.filter((user) => user.sellerRequestStatus === status).length
    const waits = pendingList.map((user) => now - requestedAt(user))
    return {
      pending: pendingList.length,
      approved: count('approved'),
      rejected: count('rejected'),
      // Días que lleva, en promedio, cada pendiente sin respuesta.
      averageWaitDays: waits.length ? Math.round(waits.reduce((sum, wait) => sum + wait, 0) / waits.length / DAY_MS) : 0,
      byStatus: (Object.keys(STATUS_LABEL) as RequestStatus[]).map((status) => ({
        label: t(STATUS_LABEL[status]),
        // Las pendientes salen de su listado propio; el resto, de las cuentas.
        value: status === 'pending' ? pendingList.length : count(status),
      })),
      // El backend ya las manda de la más antigua a la más nueva.
      oldestPending: pendingList.slice(0, 5),
    }
  }, [requests, pending, now, t])

  if (isLoading) return <OverviewSkeleton />

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label={t('admin.sellers.stats.pending')} value={stats.pending} tone="amber" />
        <StatCard
          icon={Hourglass}
          label={t('admin.sellers.stats.averageWait')}
          value={t('admin.sellers.days', { days: stats.averageWaitDays.toLocaleString(language) })}
          tone={stats.averageWaitDays > 7 ? 'red' : 'violet'}
        />
        <StatCard icon={CircleCheck} label={t('admin.sellers.stats.approved')} value={stats.approved} tone="teal" />
        <StatCard icon={CircleX} label={t('admin.sellers.stats.rejected')} value={stats.rejected} tone="red" />
      </div>

      {/*
        El resumen cuenta cómo va la cola (cuánto esperan y cómo se repartió
        lo decidido). Revisar y decidir es en "Gestionar", con la tabla
        completa y sus filtros.
      */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={t('admin.sellers.longestWaiting')} action={<ManageLink section="sellerRequests" />}>
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
                  <span className="shrink-0 text-sm text-mynted-gray">
                    {t('admin.sellers.requestedAgo', {
                      time: formatRelativeTime(user.sellerRequestedAt ?? user.updatedAt, language),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('admin.sellers.byStatus')}>
          <DistributionList items={stats.byStatus} emptyLabel={t('admin.table.empty')} />
        </Panel>
      </div>

      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

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
  /* Por defecto se ve todo el historial que el backend conserva: cada cuenta
     que alguna vez pidió ser vendedora, con el estado actual de su solicitud.
     Las pendientes quedan primero (ver `statusRank`) y se pueden filtrar. */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [requestUserId, setRequestUserId] = useState<string | null>(null)

  // "Pendientes" usa su listado propio; los demás filtros, la lista de cuentas.
  const source = statusFilter === 'pending' ? pendingQuery : usersQuery
  const rows = useMemo(() => {
    if (statusFilter === 'pending') return pendingQuery.data?.map((request) => request.user)
    return toRequests(usersQuery.data)?.filter((user) => statusFilter === 'all' || user.sellerRequestStatus === statusFilter)
  }, [usersQuery.data, pendingQuery.data, statusFilter])

  /* Lo que cada cuenta envió al pedir: las pendientes y las ya decididas
     (aprobadas y rechazadas). Las revocadas no se pueden listar así; de esas
     queda la tienda que trae la cuenta. */
  const reviewedQuery = useReviewedSellerRequests()
  const requests = useMemo(
    () =>
      new Map(
        [...(pendingQuery.data ?? []), ...(reviewedQuery.data ?? [])].map((request) => [request.user.id, request]),
      ),
    [pendingQuery.data, reviewedQuery.data],
  )
  // Una pendiente se pide fresca al abrirla; una decidida ya está acá.
  const reviewedRequest = (userId: string | null) => {
    const request = userId ? requests.get(userId) : undefined
    return request && request.user.sellerRequestStatus !== 'pending' ? request : undefined
  }
  const storeOf = (user: AdminUser) => requests.get(user.id) ?? user.seller ?? undefined

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
      /* Con qué tienda pidió entrar, según lo que envió. Una aprobada
         enlaza a su tienda. */
      id: 'store',
      header: t('admin.sellers.columns.store'),
      sortValue: (user) => storeOf(user)?.displayName ?? '',
      render: (user) => {
        const store = storeOf(user)
        if (!store) return '—'
        const name =
          user.seller && user.sellerRequestStatus === 'approved' ? (
            <Link
              to="/sellers/$sellerId"
              params={{ sellerId: String(user.seller.sellerId) }}
              className="font-medium text-mynted-blue hover:underline"
            >
              {store.displayName}
            </Link>
          ) : (
            <span className="font-medium text-mynted-ink">{store.displayName}</span>
          )
        return (
          <span className="flex flex-col">
            {name}
            {store.location && <span className="text-xs">{store.location}</span>}
          </span>
        )
      },
    },
    {
      id: 'status',
      header: t('admin.sellers.columns.status'),
      sortValue: (user) => statusRank(user.sellerRequestStatus),
      render: (user) => {
        const status = user.sellerRequestStatus as RequestStatus
        return <StatusPill tone={STATUS_TONE[status]}>{t(STATUS_LABEL[status])}</StatusPill>
      },
    },
    {
      id: 'requestedAt',
      header: t('admin.sellers.columns.requestedAt'),
      // Sin `sellerRequestedAt` (cuentas aprobadas antes de que existiera, o
      // tiendas creadas a mano) no se sabe cuándo pidió: `updatedAt` es el
      // último cambio de la cuenta, no la fecha de la solicitud.
      sortValue: (user) => (user.sellerRequestedAt ? new Date(user.sellerRequestedAt).getTime() : 0),
      render: (user) => (user.sellerRequestedAt ? formatShortDate(user.sellerRequestedAt, language) : '—'),
    },
  ]

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(user) => user.id}
        getSearchText={(user) => `${user.username} ${user.email} ${storeOf(user)?.displayName ?? ''}`}
        isLoading={source.isPending}
        error={source.error}
        onRetry={() => void source.refetch()}
        initialSort={{ id: 'status', direction: 'asc' }}
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
            {/* Aprobar y rechazar viven en el diálogo, para decidir con los
                datos a la vista. Una ya decidida se abre ahí mismo, solo para
                consultar lo que envió. */}
            {user.sellerRequestStatus === 'pending' || requests.has(user.id) ? (
              <IconAction icon={FileText} label={t('admin.sellerRequest.open')} onPress={() => setRequestUserId(user.id)} />
            ) : (
              <span className="px-2 text-xs text-mynted-gray-light">{t('admin.sellers.alreadyReviewed')}</span>
            )}
            <IconAction icon={UserSearch} label={t('admin.review.open')} onPress={() => setReviewUserId(user.id)} />
          </>
        )}
      />

      <SellerRequestDialog
        userId={requestUserId}
        reviewed={reviewedRequest(requestUserId)}
        onClose={() => setRequestUserId(null)}
      />
      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}
