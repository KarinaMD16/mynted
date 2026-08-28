import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import App from './App'
import { Loader } from './components/ui/Loader'
import type { AuthCallbackSearch, OAuthProvider } from './features/auth/models/auth'
import AuthCallbackPage from './pages/AuthCallbackPage'
import CommunitiesPage from './pages/CommunitiesPage'
import ExplorePage from './pages/ExplorePage'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'

/**
 * Configuración de rutas del frontend.
 *
 * - "/"            -> pantalla base vacía (home), lista para irse llenando
 *                     a medida que avancen los demás módulos.
 * - "/login"       -> tarjeta de autenticación (login / crear cuenta).
 *                     Acepta "?mode=interests" para abrir directo el paso de
 *                     intereses después de un registro con proveedor.
 * - "/auth/callback" -> aterrizaje de los flujos de Google/Facebook. Es la URL
 *                     que el backend tiene configurada en FRONTEND_REDIRECT_URL.
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

function asProvider(value: unknown): OAuthProvider | undefined {
  return value === 'google' || value === 'facebook' ? value : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
  // El backend solo manda banderas por query string; el token de sesión llega
  // aparte, en una cookie httpOnly que el navegador no expone a este código.
  validateSearch: (search: Record<string, unknown>): AuthCallbackSearch => ({
    newUser: search.newUser === 'true' ? 'true' : undefined,
    linked: search.linked === 'true' ? 'true' : undefined,
    error: asString(search.error),
    message: asString(search.message),
    email: asString(search.email),
    provider: asProvider(search.provider),
  }),
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

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  authCallbackRoute,
  exploreRoute,
  communitiesRoute,
  favoritesRoute,
  messagesRoute,
  profileRoute,
])

export const router = createRouter({
  routeTree,
  // Loader oficial de la app (el gansito) mientras se resuelve la
  // navegación entre rutas o la carga de datos de una ruta.
  defaultPendingComponent: () => (
    <div className="flex min-h-svh items-center justify-center bg-mynted-bg">
      <Loader label="Loading…" size={120} />
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
