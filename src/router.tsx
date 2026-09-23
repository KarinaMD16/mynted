import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import App from './App'
import { ADMIN_SECTIONS, ADMIN_TABS, type AdminSection, type AdminTab } from './features/admin/models/admin'
import { Loader } from './components/ui/Loader'
import { useLanguage } from './i18n/LanguageContext'
import AdminPage from './pages/AdminPage'
import CommunitiesPage from './pages/CommunitiesPage'
import CommunityDetailPage from './pages/CommunityDetailPage'
import CommunityModerationPage from './pages/CommunityModerationPage'
import ExplorePage from './pages/ExplorePage'
import FavoritesPage from './pages/FavoritesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import CookiesPolicyPage from './pages/CookiesPolicyPage'
import MessagesPage from './pages/MessagesPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ProfilePage from './pages/ProfilePage'
import ResetPasswordPage from './pages/ResetPasswordPage'

/**
 * Configuración de rutas del frontend.
 *
 * - "/"            -> pantalla base vacía (home), lista para irse llenando
 *                     a medida que avancen los demás módulos.
 * - "/login"       -> tarjeta de autenticación (login / crear cuenta).
 *                     Acepta "?mode=interests" para abrir directo el paso de
 *                     intereses después de un registro con proveedor.
 * - "/explore", "/communities", "/favorites", "/messages" -> pantallas base
 *                     vacías a las que ya redirigen los ítems del nav del
 *                     header (ver SiteHeader.tsx), listas para irse llenando.
 *
 * Cuando se agreguen más pantallas (marketplace, foro, etc.) solo hace
 * falta crear su página en src/pages y registrar una nueva createRoute() aquí.
 */
const rootRoute = createRootRoute({
  component: App,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

interface LoginSearch {
  mode?: 'interests'
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    mode: search.mode === 'interests' ? 'interests' : undefined,
  }),
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  // El link de recuperación llega como `${FRONTEND_URL}/reset-password?token=...`
  // (ver AuthService.forgotPassword en el backend), así que el token viaja
  // como query param, no como parte del path.
  validateSearch: (search: Record<string, unknown>): { token: string | undefined } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
})

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExplorePage,
})

const communitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities',
  component: CommunitiesPage,
})

const communityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities/$slug',
  component: CommunityDetailPage,
})

const communityModerationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities/$slug/moderacion',
  component: CommunityModerationPage,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  component: FavoritesPage,
})

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagesPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

const privacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/privacidad',
  component: PrivacyPolicyPage,
})

const cookiesPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/cookies',
  component: CookiesPolicyPage,
})

interface AdminSearch {
  section: AdminSection
  tab: AdminTab
}

/**
 * Panel de superadmin. La sección (?section=) y la pestaña (?tab=) van en la
 * URL; un valor desconocido cae en Comunidades / Resumen.
 */
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
  validateSearch: (search: Record<string, unknown>): AdminSearch => ({
    section: (ADMIN_SECTIONS as readonly unknown[]).includes(search.section)
      ? (search.section as AdminSection)
      : 'communities',
    tab: (ADMIN_TABS as readonly unknown[]).includes(search.tab) ? (search.tab as AdminTab) : 'overview',
  }),
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  exploreRoute,
  communitiesRoute,
  communityDetailRoute,
  communityModerationRoute,
  favoritesRoute,
  messagesRoute,
  profileRoute,
  privacyPolicyRoute,
  cookiesPolicyRoute,
  adminRoute,
])

/**
 * Pending state por defecto entre rutas. Es un componente aparte (en vez de
 * JSX inline) solo para poder llamar useLanguage() — este loader vive dentro
 * de App/LanguageProvider igual que cualquier otra pantalla, así que el
 * texto también respeta el idioma elegido.
 */
function DefaultPending() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-svh items-center justify-center bg-mynted-bg">
      <Loader label={t('loader.default')} size={120} />
    </div>
  )
}

export const router = createRouter({
  routeTree,
  // Loader oficial de la app (el gansito) mientras se resuelve la
  // navegación entre rutas o la carga de datos de una ruta.
  defaultPendingComponent: DefaultPending,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
