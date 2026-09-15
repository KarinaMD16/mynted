import { useNavigate } from '@tanstack/react-router'
import { clearCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLogoutMutation } from '@/features/auth/hooks/useAuthMutations'

/**
 * Acciones compartidas del menú de cuenta (header de escritorio y drawer mobile):
 * cerrar sesión contra el backend y navegar al perfil.
 */
export function useAccountActions() {
  const navigate = useNavigate()
  const logoutMutation = useLogoutMutation()

  async function logout() {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      console.error('[auth] No se pudo cerrar sesión:', error)
    } finally {
      clearCurrentUser()
      await navigate({ to: '/login' })
    }
  }

  function goToProfile() {
    void navigate({ to: '/profile' })
  }

  return { logout, goToProfile, isLoggingOut: logoutMutation.isPending }
}
