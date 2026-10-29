import { useMemo, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Package, ShieldAlert, Store } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import { Avatar, FilterSelect, IdentityCell, LoadErrorPanel, Panel, StatCard, StatusPill } from '../components/AdminUi'
import { UserReviewDrawer } from '../components/UserReviewDrawer'
import { useAdminStats, useAdminUsers } from '../hooks/useAdminQueries'
import type { AdminTab, AdminUser } from '../models/admin'
import { ManageLink, OverviewSkeleton } from './UsersSection'

/**
 * Pestaña "Vendedores": los que ya están aprobados, con lo que importa para
 * moderarlos (productos, ventas, reportes recibidos) y la hoja lateral para
 * actuar sobre su tienda.
 *
 * Las solicitudes PENDIENTES no están acá: siguen en su propia sección, que es
 * un flujo distinto (aprobar o rechazar una solicitud, con los datos de cobro
 * a la vista).
 */
export function SellersSection({ tab, currentUserId }: { tab: AdminTab; currentUserId: string }) {
  return tab === 'overview' ? (
    <SellersOverview currentUserId={currentUserId} />
  ) : (
    <SellersManage currentUserId={currentUserId} />
  )
}

/** Un vendedor es quien tiene ficha de tienda, esté el rol activo o revocado. */
function isSeller(user: AdminUser) {
  return user.seller != null
}

function SellersOverview({ currentUserId }: { currentUserId: string }) {
  const { t } = useLanguage()
  const stats = useAdminStats()
  const users = useAdminUsers()

  const [reviewUserId, setReviewUserId] = useState<string | null>(null)

  const sellers = useMemo(() => (users.data ?? []).filter(isSeller), [users.data])
  const mostProducts = useMemo(() => topSellers(sellers, (seller) => seller.productCount), [sellers])
  const mostSales = useMemo(() => topSellers(sellers, (seller) => seller.salesCount), [sellers])

  if (stats.isError) return <LoadErrorPanel error={stats.error} onRetry={() => void stats.refetch()} />
  if (stats.isLoading || users.isLoading) return <OverviewSkeleton />

  // Los reportes recibidos no están en /users/stats: se suman de las fichas.
  const reports = sellers.reduce((total, user) => total + (user.seller?.reportsReceivedCount ?? 0), 0)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Store} label={t('admin.sellersTab.stats.approved')} value={stats.data?.approvedSellers} tone="teal" />
        <StatCard icon={Package} label={t('admin.sellersTab.stats.products')} value={stats.data?.activeProducts} tone="violet" />
        <StatCard
          icon={ShieldAlert}
          label={t('admin.sellersTab.stats.reports')}
          value={reports}
          tone={reports > 0 ? 'red' : 'gray'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SellerRanking
          title={t('admin.sellersTab.mostProducts')}
          rows={mostProducts}
          value={(seller) => seller.productCount}
          action={<ManageLink section="sellers" />}
          onOpen={setReviewUserId}
        />
        <SellerRanking
          title={t('admin.sellersTab.mostSales')}
          rows={mostSales}
          value={(seller) => seller.salesCount}
          onOpen={setReviewUserId}
        />
      </div>

      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}

type SellerMetrics = NonNullable<AdminUser['seller']>

/** Los cinco con más de algo; los que tienen 0 no son un "top". */
function topSellers(sellers: AdminUser[], metric: (seller: SellerMetrics) => number) {
  return sellers
    .filter((user) => user.seller && metric(user.seller) > 0)
    .sort((a, b) => metric(b.seller!) - metric(a.seller!))
    .slice(0, 5)
}

/** Un ranking corto de vendedores; el nombre abre la hoja de revisión. */
function SellerRanking({
  title,
  rows,
  value,
  action,
  onOpen,
}: {
  title: string
  rows: AdminUser[]
  value: (seller: SellerMetrics) => number
  action?: ReactNode
  onOpen: (userId: string) => void
}) {
  const { t, language } = useLanguage()
  return (
    <Panel title={title} action={action}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-mynted-gray">{t('admin.table.empty')}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-mynted-border">
          {rows.map((user, index) => (
            <li key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-4 shrink-0 text-sm font-semibold text-mynted-gray-light tabular-nums">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <StoreIdentity user={user} onOpen={() => onOpen(user.id)} />
              </div>
              <span className="shrink-0 text-sm font-semibold text-mynted-ink tabular-nums">
                {value(user.seller!).toLocaleString(language)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

function SellersManage({ currentUserId }: { currentUserId: string }) {
  const { t, language } = useLanguage()
  const query = useAdminUsers()
  const [status, setStatus] = useState<'' | 'approved' | 'revoked'>('')
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const sellers = (query.data ?? []).filter(isSeller)
    if (!status) return sellers
    if (status === 'revoked') return sellers.filter((user) => user.sellerRequestStatus === 'revoked')
    return sellers.filter((user) => user.role === 'seller' && user.sellerRequestStatus !== 'revoked')
  }, [query.data, status])

  const number = (value: number) => value.toLocaleString(language)

  const columns: AdminColumn<AdminUser>[] = [
    {
      // La fila es la tienda: los productos, las ventas y los reportes son
      // suyos. Quién la maneja va debajo.
      id: 'seller',
      header: t('admin.sellers.columns.store'),
      sortValue: (user) => user.seller?.displayName ?? user.username,
      render: (user) => <StoreIdentity user={user} />,
    },
    {
      id: 'products',
      header: t('admin.sellersTab.columns.products'),
      sortValue: (user) => user.seller?.productCount ?? 0,
      render: (user) => <span className="tabular-nums">{number(user.seller?.productCount ?? 0)}</span>,
    },
    {
      id: 'sales',
      header: t('admin.sellersTab.columns.sales'),
      sortValue: (user) => user.seller?.salesCount ?? 0,
      render: (user) => <span className="tabular-nums">{number(user.seller?.salesCount ?? 0)}</span>,
    },
    {
      id: 'reports',
      header: t('admin.sellersTab.columns.reports'),
      sortValue: (user) => user.seller?.reportsReceivedCount ?? 0,
      render: (user) => {
        const count = user.seller?.reportsReceivedCount ?? 0
        return <span className={`tabular-nums ${count > 0 ? 'font-semibold text-red-600' : ''}`}>{number(count)}</span>
      },
    },
    {
      id: 'status',
      header: t('admin.sellersTab.columns.status'),
      sortValue: (user) => user.sellerRequestStatus ?? '',
      render: (user) => (
        <span className="flex flex-wrap items-center gap-1.5">
          {/* Vale el rol, no el estado de la solicitud: una tienda creada a
              mano deja ese estado en 'none' y seguiría pudiendo vender. */}
          {user.sellerRequestStatus === 'revoked' ? (
            <StatusPill tone="red">{t('admin.sellers.status.revoked')}</StatusPill>
          ) : user.role === 'seller' ? (
            <StatusPill tone="teal">{t('admin.sellers.status.approved')}</StatusPill>
          ) : (
            <StatusPill tone="gray">{t('admin.sellersTab.noRole')}</StatusPill>
          )}
          {user.seller?.isVerified && <StatusPill tone="blue">{t('admin.sellersTab.verified')}</StatusPill>}
        </span>
      ),
    },
  ]

  return (
    <>
      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(user) => user.id}
        getSearchText={(user) => `${user.seller?.displayName ?? ''} ${user.username} ${user.email}`}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        initialSort={{ id: 'reports', direction: 'desc' }}
        toolbar={
          <FilterSelect
            label={t('admin.sellersTab.filter.status')}
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: t('admin.sellersTab.filter.all') },
              { value: 'approved', label: t('admin.sellers.status.approved') },
              { value: 'revoked', label: t('admin.sellers.status.revoked') },
            ]}
          />
        }
        renderActions={(user) => (
          <Button type="button" size="sm" variant="secondary" onClick={() => setReviewUserId(user.id)}>
            {t('admin.review.title')}
          </Button>
        )}
      />

      {/* La misma hoja lateral que Usuarios: ya lista los productos con su
          estado y trae las acciones de rol y de cada producto. */}
      <UserReviewDrawer userId={reviewUserId} currentUserId={currentUserId} onClose={() => setReviewUserId(null)} />
    </>
  )
}

/**
 * La tienda y, debajo, la cuenta que la maneja. Con `onOpen` el nombre abre la
 * hoja de revisión; sin él lleva a la tienda pública.
 */
function StoreIdentity({ user, onOpen }: { user: AdminUser; onOpen?: () => void }) {
  const name = user.seller?.displayName || user.username
  const nameClass = 'font-semibold text-mynted-ink hover:text-mynted-blue hover:underline'
  return (
    <IdentityCell
      avatar={<Avatar src={user.photoUrl} name={name} />}
      title={
        onOpen ? (
          <button type="button" onClick={onOpen} className={`cursor-pointer ${nameClass}`}>
            {name}
          </button>
        ) : user.seller ? (
          <Link to="/sellers/$sellerId" params={{ sellerId: String(user.seller.sellerId) }} className={nameClass}>
            {name}
          </Link>
        ) : (
          name
        )
      }
      subtitle={`@${user.username} · ${user.email}`}
    />
  )
}
