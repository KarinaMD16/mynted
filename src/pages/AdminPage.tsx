import { Link, useSearch } from '@tanstack/react-router'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { useAdminUsers } from '@/features/admin/hooks/useAdminQueries'
import { CategoriesSection } from '@/features/admin/sections/CategoriesSection'
import { CommunitiesSection } from '@/features/admin/sections/CommunitiesSection'
import { SellerRequestsSection } from '@/features/admin/sections/SellerRequestsSection'
import { UsersSection } from '@/features/admin/sections/UsersSection'
import { CommunityNotice } from '@/features/community/components/ui/CommunityNotice'
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

  if (!isLoggedIn || !isSuperAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-mynted-bg px-4">
        <div className="w-full max-w-lg">
          <CommunityNotice
            title={isLoggedIn ? t('admin.access.forbiddenTitle') : t('admin.access.signedOutTitle')}
            description={isLoggedIn ? t('admin.access.forbiddenDescription') : t('admin.access.signedOutDescription')}
          >
            <Link
              to={isLoggedIn ? '/' : '/login'}
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
            >
              {isLoggedIn ? t('admin.access.backHome') : t('communities.list.signIn')}
            </Link>
          </CommunityNotice>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout section={section} tab={tab} userName={user.username} pendingSellerCount={pendingSellerCount}>
      {section === 'communities' && <CommunitiesSection tab={tab} />}
      {section === 'categories' && <CategoriesSection tab={tab} />}
      {section === 'users' && <UsersSection tab={tab} currentUserId={user.id} />}
      {section === 'sellerRequests' && <SellerRequestsSection tab={tab} currentUserId={user.id} />}
    </AdminLayout>
  )
}
