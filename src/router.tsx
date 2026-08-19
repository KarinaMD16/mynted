import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import App from './App'
import { Loader } from './components/ui/Loader'
import CommunitiesPage from './pages/CommunitiesPage'
import ExplorePage from './pages/ExplorePage'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'

/**
 * Configuración de rutas del frontend.
 *
 * - "/"            -> pantalla base vacía (home), lista para irse llenando
 *                     a medida que avancen los demás módulos.
 * - "/login"       -> tarjeta de autenticación (login / crear cuenta),
 *                     ya conectada del lado del frontend y esperando los
 *                     endpoints reales del backend (ver src/features/auth/api.ts).
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

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
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

const routeTree = rootRoute.addChildren([homeRoute, loginRoute, exploreRoute, communitiesRoute, favoritesRoute, messagesRoute])

export const router = createRouter({
  routeTree,
  // Loader oficial de la app (el gansito) mientras se resuelve la
  // navegación entre rutas o la carga de datos de una ruta.
  defaultPendingComponent: () => (
    <div className="flex min-h-svh items-center justify-center bg-mynted-bg">
      <Loader label="Cargando…" size={120} />
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
