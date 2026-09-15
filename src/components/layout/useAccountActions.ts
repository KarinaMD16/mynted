import { useNavigate } from '@tanstack/react-router'
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

  return { logout, goToProfile, isLoggingOut: logoutMutation.isPending }
}
