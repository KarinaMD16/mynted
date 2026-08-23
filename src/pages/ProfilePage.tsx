import { PlaceholderPage } from '../components/layout/PlaceholderPage'

/**
 * Pantalla base de "/profile". Todavía sin datos reales: falta un contexto/estado
 * global de sesión que guarde el id del usuario logueado para poder pedir su
 * perfil con GET /users/{id} (ver src/features/auth/services/authServices.ts).
 */
export default function ProfilePage() {
  return (
    <PlaceholderPage
      title="My profile"
      description="Here you'll be able to view and edit your profile. This section is still under construction."
    />
  )
}
