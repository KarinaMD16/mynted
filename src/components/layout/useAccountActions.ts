import { useNavigate } from '@tanstack/react-router'
import { useLogoutMutation } from '@/features/auth/hooks/useAuthMutations'

/**
 * Acciones compartidas del menú de cuenta (header de escritorio y drawer mobile):
 * cerrar sesión contra el backend y navegar al perfil (o al panel, si es superadmin).
 */
export function useAccountActions() {
  const navigate = useNavigate()
  const logoutMutation = useLogoutMutation()

  async function logout() {
    try {
      // onSuccess de useLogoutMutation ya deja el cache de "usuario actual"
      // en null, así que el header pasa a "Login" apenas esto resuelve.
      await logoutMutation.mutateAsync()
    } catch (error) {
      console.error('[auth] No se pudo cerrar sesión:', error)
    } finally {
      await navigate({ to: '/login' })
    }
  }

  function goToProfile() {
    void navigate({ to: '/profile' })
  }

  function goToSettings() {
    void navigate({ to: '/settings', search: { tab: 'account' } })
  }

  function goToAdmin() {
    void navigate({ to: '/admin', search: { section: 'communities', tab: 'overview' } })
  }

  return { logout, goToProfile, goToSettings, goToAdmin, isLoggingOut: logoutMutation.isPending }
}
