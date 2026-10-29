import { useSearch } from '@tanstack/react-router'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { useAdminUsers } from '@/features/admin/hooks/useAdminQueries'
import { CategoriesSection } from '@/features/admin/sections/CategoriesSection'
import { CommissionsSection } from '@/features/admin/sections/CommissionsSection'
import { ModerationLogSection } from '@/features/admin/sections/ModerationLogSection'
import { ReportsSection } from '@/features/admin/sections/ReportsSection'
import { SellersSection } from '@/features/admin/sections/SellersSection'
import { CommunitiesSection } from '@/features/admin/sections/CommunitiesSection'
import { SellerRequestsSection } from '@/features/admin/sections/SellerRequestsSection'
import { UsersSection } from '@/features/admin/sections/UsersSection'
import { ForbiddenPage } from '@/components/errors/ErrorPages'
import { SignedOutState } from '@/components/errors/QueryErrorState'
import { Loader } from '@/components/ui/Loader'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Panel de superadmin (/admin). Se entra desde el menú de cuenta del header,
 * que para un superadmin solo muestra esta opción (ver AccountMenu). La
 * sección y la pestaña vienen de la URL (ver adminRoute en router.tsx).
 *
 * El control de acceso de verdad lo hace el backend (SuperAdminGuard en cada
 * endpoint); esto solo evita mostrar un panel vacío a quien no puede usarlo.
 */
export default function AdminPage() {
  const { t } = useLanguage()
  const { section, tab } = useSearch({ from: '/admin' })
  const { data: user, isLoggedIn, isLoading } = useCurrentUser()
  const isSuperAdmin = user?.role === 'superadmin'

  // Para el contador de solicitudes pendientes en la barra lateral.
  const usersQuery = useAdminUsers(isSuperAdmin)
  const pendingSellerCount = usersQuery.data?.filter((u) => u.sellerRequestStatus === 'pending').length ?? 0

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-mynted-bg">
        <Loader label={t('loader.default')} size={120} />
      </div>
    )
  }

  if (isLoggedIn && !isSuperAdmin) {
    return <ForbiddenPage title={t('admin.access.forbiddenTitle')} description={t('admin.access.forbiddenDescription')} />
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-mynted-bg px-4">
        <div className="w-full max-w-lg">
          <SignedOutState description={t('admin.access.signedOutDescription')} />
        </div>
      </div>
    )
  }

  return (
    <AdminLayout section={section} tab={tab} userName={user.username} pendingSellerCount={pendingSellerCount}>
      {section === 'reports' && <ReportsSection tab={tab} />}
      {section === 'sellers' && <SellersSection tab={tab} currentUserId={user.id} />}
      {section === 'communities' && <CommunitiesSection tab={tab} />}
      {section === 'categories' && <CategoriesSection tab={tab} />}
      {section === 'users' && <UsersSection tab={tab} currentUserId={user.id} />}
      {section === 'sellerRequests' && <SellerRequestsSection tab={tab} currentUserId={user.id} />}
      {section === 'commissions' && <CommissionsSection tab={tab} />}
      {section === 'moderationLog' && <ModerationLogSection tab={tab} />}
    </AdminLayout>
  )
}
