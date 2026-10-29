import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarPlus, UserCheck, UserSearch, UserX, Users } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { UserRole } from '@/features/auth/models/auth'
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
  StatCardSkeleton,
  StatusPill,
  type PillTone,
} from '../components/AdminUi'
import { UserHoverName } from '../components/HoverSummary'
import { UserReviewDrawer } from '../components/UserReviewDrawer'
import { useAdminUsers, useSetUserActiveMutation } from '../hooks/useAdminQueries'
import type { AdminSection, AdminTab, AdminUser } from '../models/admin'

const ROLE_LABEL: Record<UserRole, TranslationKey> = {
  user: 'admin.users.role.user',
  seller: 'admin.users.role.seller',
  superadmin: 'admin.users.role.superadmin',
}

const ROLE_TONE: Record<UserRole, PillTone> = {
  user: 'gray',
  seller: 'blue',
  superadmin: 'orange',
}

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30

export function UsersSection({ tab, currentUserId }: { tab: AdminTab; currentUserId: string }) {
  const usersQuery = useAdminUsers()
  if (tab === 'overview' && usersQuery.isError) {
    return <LoadErrorPanel error={usersQuery.error} onRetry={() => void usersQuery.refetch()} />
  }
  return tab === 'overview' ? (
    <UsersOverview users={usersQuery.data} isLoading={usersQuery.isPending} currentUserId={currentUserId} />
  ) : (
    <UsersManage usersQuery={usersQuery} currentUserId={currentUserId} />
  )
}

function UsersOverview({
  users,
  isLoading,
  currentUserId,
}: {
  users: AdminUser[] | undefined
  isLoading: boolean
  currentUserId: string
}) {
  const { t, language } = useLanguage()
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  // Se fija al montar para que "últimos 30 días" no cambie entre renders.
  const [now] = useState(() => Date.now())

  const stats = useMemo(() => {
    const list = users ?? []
    return {
      total: list.length,
      active: list.filter((user) => user.isActive).length,
      inactive: list.filter((user) => !user.isActive).length,
      sellers: list.filter((user) => user.role === 'seller').length,
      newThisMonth: list.filter((user) => now - new Date(user.createdAt).getTime() <= THIRTY_DAYS_MS).length,
      byRole: (Object.keys(ROLE_LABEL) as UserRole[]).map((role) => ({
        label: t(ROLE_LABEL[role]),
        value: list.filter((user) => user.role === role).length,
      })),
      // GET /users ya viene ordenado del más nuevo al más viejo.
      recent: list.slice(0, 5),
    }
  }, [users, t, now])

  if (isLoading) return <OverviewSkeleton />

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t('admin.users.stats.total')} value={stats.total} tone="violet" />
        <StatCard icon={UserCheck} label={t('admin.users.stats.active')} value={stats.active} tone="teal" />
        <StatCard icon={UserX} label={t('admin.users.stats.inactive')} value={stats.inactive} tone="red" />
        <StatCard icon={CalendarPlus} label={t('admin.users.stats.newThisMonth')} value={stats.newThisMonth} tone="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title={t('admin.users.recentTitle')}
          action={<ManageLink section="users" />}
        >
          {stats.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-mynted-gray">{t('admin.table.empty')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mynted-border">
              {stats.recent.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <IdentityCell
                    avatar={<Avatar src={user.photoUrl} name={user.username} />}
                    title={<UserHoverName user={user} onOpen={() => setReviewUserId(user.id)} />}
                    subtitle={user.email}
                  />
                  <span className="shrink-0 text-sm text-mynted-gray">{formatShortDate(user.createdAt, language)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('admin.users.rolesTitle')}>
          <DistributionList items={stats.byRole} emptyLabel={t('admin.table.empty')} />
        </Panel>
      </div>

      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}

type RoleFilter = 'all' | UserRole

function UsersManage({
  usersQuery,
  currentUserId,
}: {
  usersQuery: ReturnType<typeof useAdminUsers>
  currentUserId: string
}) {
  const { t, language } = useLanguage()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [pending, setPending] = useState<{ user: AdminUser; active: boolean } | null>(null)
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const mutation = useSetUserActiveMutation()

  const rows = useMemo(
    () => usersQuery.data?.filter((user) => roleFilter === 'all' || user.role === roleFilter),
    [usersQuery.data, roleFilter],
  )

  const columns: AdminColumn<AdminUser>[] = [
    {
      id: 'user',
      header: t('admin.users.columns.user'),
      sortValue: (user) => user.username,
      render: (user) => (
        <IdentityCell
          avatar={<Avatar src={user.photoUrl} name={user.username} />}
          // Mismo nombre clicable que en el resumen: abre el panel de revisión de la cuenta.
          title={<UserHoverName user={user} onOpen={() => setReviewUserId(user.id)} />}
          subtitle={user.email}
          badge={
            user.id === currentUserId && (
              <span className="rounded-full bg-mynted-bg px-2 py-0.5 text-[11px] font-semibold text-mynted-gray">
                {t('admin.users.youBadge')}
              </span>
            )
          }
        />
      ),
    },
    {
      id: 'role',
      header: t('admin.users.columns.role'),
      sortValue: (user) => t(ROLE_LABEL[user.role]),
      render: (user) => <StatusPill tone={ROLE_TONE[user.role]}>{t(ROLE_LABEL[user.role])}</StatusPill>,
    },
    {
      id: 'status',
      header: t('admin.users.columns.status'),
      sortValue: (user) => (user.isActive ? 1 : 0),
      render: (user) =>
        user.isActive ? (
          <StatusPill tone="violet">{t('admin.users.status.active')}</StatusPill>
        ) : (
          <StatusPill tone="teal">{t('admin.users.status.inactive')}</StatusPill>
        ),
    },
    {
      id: 'joined',
      header: t('admin.users.columns.joined'),
      sortValue: (user) => new Date(user.createdAt).getTime(),
      render: (user) => formatShortDate(user.createdAt, language),
    },
  ]

  const target = pending?.user

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
        initialSort={{ id: 'joined', direction: 'desc' }}
        toolbar={
          <FilterSelect<RoleFilter>
            label={t('admin.users.columns.role')}
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'all', label: t('admin.users.filterAllRoles') },
              ...(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => ({ value: role, label: t(ROLE_LABEL[role]) })),
            ]}
          />
        }
        renderActions={(user) => {
          const review = (
            <IconAction icon={UserSearch} label={t('admin.review.open')} onPress={() => setReviewUserId(user.id)} />
          )
          return review
        }}
      />

      {/*
        Desactivar exige motivo (el backend lo registra y se lo avisa a la
        persona), así que usa el diálogo con motivo. Activar no: no hay nada
        que justificar al devolver el acceso, y el backend tampoco lo pide.
      */}
      {pending?.active === false && (
        <ConfirmWithReasonDialog
          open
          title={t('admin.users.deactivateTitle', { name: target?.username ?? '' })}
          description={t('admin.users.deactivateDescription')}
          confirmLabel={t('admin.users.deactivate')}
          isPending={mutation.isPending}
          error={mutation.error}
          onClose={() => setPending(null)}
          onConfirm={(reason) =>
            mutation.mutate({ userId: pending.user.id, active: false, reason }, { onSuccess: () => setPending(null) })
          }
        />
      )}

      {pending?.active === true && (
        <ConfirmDialog
          open
          title={t('admin.users.activateTitle', { name: target?.username ?? '' })}
          description={t('admin.users.activateDescription')}
          confirmLabel={t('admin.users.activate')}
          tone="primary"
          isPending={mutation.isPending}
          error={mutation.error}
          onClose={() => setPending(null)}
          onConfirm={() =>
            mutation.mutate({ userId: pending.user.id, active: true }, { onSuccess: () => setPending(null) })
          }
        />
      )}

      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}

/** Enlace a la pestaña "Gestionar" de una sección, desde su resumen. */
export function ManageLink({ section }: { section: AdminSection }) {
  const { t } = useLanguage()
  return (
    <Link
      to="/admin"
      search={{ section, tab: 'manage' }}
      className="text-sm font-semibold text-mynted-orange hover:underline"
    >
      {t('admin.common.goToManage')}
    </Link>
  )
}

export function OverviewSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-mynted-border bg-white" />
        <div className="h-72 animate-pulse rounded-2xl border border-mynted-border bg-white" />
      </div>
    </>
  )
}

