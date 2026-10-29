import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import App from './App'
import { ADMIN_SECTIONS, ADMIN_TABS, type AdminSection, type AdminTab } from './features/admin/models/admin'
import { Loader } from './components/ui/Loader'
import { NotFoundPage, RouteErrorPage } from './components/errors/ErrorPages'
import { useLanguage } from './i18n/LanguageContext'
import AdminPage from './pages/AdminPage'
import CommunitiesPage from './pages/CommunitiesPage'
import CommunityDetailPage from './pages/CommunityDetailPage'
import CommunityModerationPage from './pages/CommunityModerationPage'
import DiscoverCommunitiesPage from './pages/DiscoverCommunitiesPage'
import MyCommunitiesPage from './pages/MyCommunitiesPage'
import PostDetailPage from './pages/PostDetailPage'
import ExplorePage from './pages/ExplorePage'
import FavoritesPage from './pages/FavoritesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import CookiesPolicyPage from './pages/CookiesPolicyPage'
import MessagesPage from './pages/MessagesPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ProCheckoutPage from './pages/ProCheckoutPage'
import ProPage from './pages/ProPage'
import ProfilePage from './pages/ProfilePage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ConfirmEmailChangePage from './pages/ConfirmEmailChangePage'
import SettingsPage from './pages/SettingsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import MyPurchasesPage from './pages/MyPurchasesPage'
import ReceiptPage from './pages/ReceiptPage'
import MySalesPage from './pages/MySalesPage'
import MyProductsPage from './pages/MyProductsPage'
import CreateProductPage from './pages/CreateProductPage'
import EditProductPage from './pages/EditProductPage'
import SearchPage from './pages/SearchPage'
import StorePage from './pages/StorePage'
import TagProductsPage from './pages/TagProductsPage'
import UserProfilePage from './pages/UserProfilePage'
import { isSettingsTab, type SettingsTab } from './features/settings/models/settings'
import { SEARCH_MAX_LENGTH, SEARCH_TYPES, type SearchType } from './features/search/models/search'
import { isSubscriptionPeriod, type SubscriptionPeriod } from './features/pro/models/subscription'

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
  // Ruta inexistente: se dibuja dentro del <Outlet /> de App, con idioma y header.
  notFoundComponent: NotFoundPage,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

interface LoginSearch {
  /** "register" abre directo el formulario de crear cuenta (lo usa la landing /descubre). */
  mode?: 'interests' | 'register'
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    mode: search.mode === 'interests' || search.mode === 'register' ? search.mode : undefined,
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

/**
 * Explorar. La pestaña (Tienda / Talk) va en ?tab= para que sobreviva a salir
 * y volver: al abrir una publicación y pulsar atrás, el navegador restaura el
 * scroll de donde estabas, así que la pestaña tiene que ser la misma o te deja
 * mirando la tienda a la altura del feed de Talk. Un valor raro cae en 'shop'.
 */
const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExplorePage,
  // Opcional: así los enlaces a /explore no tienen que mandar ?tab= (sin él, Shop).
  validateSearch: (search: Record<string, unknown>): { tab?: 'shop' | 'talk' } => ({
    tab: search.tab === 'talk' ? 'talk' : undefined,
  }),
})

/** "Ver todo" de una sección de la tienda: todos los productos de un tag. */
const shopTagRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shop/tag/$tagId',
  component: TagProductsPage,
})

/** Resultados de la búsqueda global del header: /search?q=texto&type=products|communities|users|posts. */
const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): { q: string; type: SearchType | undefined } => ({
    q: typeof search.q === 'string' ? search.q.trim().slice(0, SEARCH_MAX_LENGTH) : '',
    type: (SEARCH_TYPES as readonly unknown[]).includes(search.type) ? (search.type as SearchType) : undefined,
  }),
})

/**
 * Detalle de un producto (Marketplace — Item Detail). `?chat=<id>` deja abierto
 * el chat con el vendedor (botón "Contactar vendedor"): sobrevive a recargar y
 * el botón "atrás" del navegador lo cierra.
 */
const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/$productId',
  component: ProductDetailPage,
  validateSearch: (search: Record<string, unknown>): { chat?: number } => {
    const chat = Number(search.chat)
    return { chat: Number.isInteger(chat) && chat > 0 && chat <= 2147483647 ? chat : undefined }
  },
})

/**
 * Publicar un producto (solo vendedores). Con ?community=<slug> la comunidad
 * queda fija (viene del botón "Publicar en esta comunidad").
 */
const createProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/new',
  component: CreateProductPage,
  validateSearch: (search: Record<string, unknown>): { community?: string } => ({
    community: typeof search.community === 'string' && search.community ? search.community : undefined,
  }),
})

/** Editar un producto propio (misma pantalla que publicar, con los datos cargados). */
const editProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/$productId/edit',
  component: EditProductPage,
})

/**
 * Checkout de un producto (pasarela simulada). Pide sesión: el botón
 * "Comprar" del detalle manda antes a /login, pero acá también se controla
 * porque se puede llegar escribiendo la ruta.
 */
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout/$productId',
  component: CheckoutPage,
})

/** Ventas del vendedor con su comisión y el resumen del periodo. */
const salesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ventas',
  component: MySalesPage,
})

/** Historial de compras de la persona (la misma lista que la pestaña del perfil). */
const purchasesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compras',
  component: MyPurchasesPage,
})

/**
 * Recibo de una transacción. El id es el UUID de la transacción, no el del
 * producto: lo pueden abrir el comprador y el vendedor (403 para el resto).
 */
const receiptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compras/$transactionId',
  component: ReceiptPage,
})

/** Panel del vendedor: sus productos publicados, con edición y cambio de estado. */
const myProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-products',
  component: MyProductsPage,
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

// Rutas propias (no /communities/...) para no chocar con el slug de una comunidad
const myCommunitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-communities',
  component: MyCommunitiesPage,
})

const discoverCommunitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/discover-communities',
  component: DiscoverCommunitiesPage,
})

const postDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities/$slug/posts/$postId',
  component: PostDetailPage,
})

const communityModerationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/communities/$slug/moderacion',
  component: CommunityModerationPage,
  // ?tab=requests abre directo las solicitudes (lo usa la notificación community_join_requested).
  validateSearch: (search: Record<string, unknown>): { tab?: 'requests' } => ({
    tab: search.tab === 'requests' ? 'requests' : undefined,
  }),
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

/** Un chat abierto: en escritorio junto a la bandeja; en móvil a pantalla completa. */
const conversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages/$conversationId',
  component: MessagesPage,
})

/**
 * Perfil público de otra persona. Por ahora solo se llega escribiendo la ruta
 * (/users/<id>); cuando haya buscador de personas se enlazará desde ahí.
 */
const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserProfilePage,
})

/** Tienda pública de un vendedor (id numérico de la tienda, no el User.id). Ver pages/StorePage.tsx. */
const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sellers/$sellerId',
  component: StorePage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

/**
 * Ajustes de la cuenta. La pestaña va en ?tab= (account | profile | privacy
 * | notifications); un valor desconocido cae en "account".
 */
/** Mynted Pro: planes y estado de la suscripción. Público (sin sesión muestra los precios). */
const proRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pro',
  component: ProPage,
})

/** Pago (o renovación) de Pro. `?period=` elige el plan; uno raro cae en el recomendado (anual). */
const proCheckoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pro/checkout',
  component: ProCheckoutPage,
  validateSearch: (search: Record<string, unknown>): { period?: SubscriptionPeriod } => ({
    period: isSubscriptionPeriod(search.period) ? search.period : undefined,
  }),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>): { tab: SettingsTab } => ({
    tab: isSettingsTab(search.tab) ? search.tab : 'account',
  }),
})

/**
 * Destino del enlace de cambio de correo: `${FRONTEND_URL}/confirm-email-change?token=...`
 * (ver AuthService.requestEmailChange en el backend).
 */
const confirmEmailChangeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/confirm-email-change',
  validateSearch: (search: Record<string, unknown>): { token: string | undefined } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ConfirmEmailChangePage,
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
      : 'reports',
    tab: (ADMIN_TABS as readonly unknown[]).includes(search.tab) ? (search.tab as AdminTab) : 'overview',
  }),
})

/**
 * Landing promocional ("anuncio") para compartir en campañas y links
 * externos. Usa el mismo header que el resto del sitio y lleva a "/" (los
 * productos destacados) o a crear una cuenta. Ver pages/LandingPage.tsx.
 */
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mynted',
  component: LandingPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  exploreRoute,
  shopTagRoute,
  createProductRoute,
  editProductRoute,
  searchRoute,
  productDetailRoute,
  myProductsRoute,
  checkoutRoute,
  purchasesRoute,
  salesRoute,
  receiptRoute,
  communitiesRoute,
  communityDetailRoute,
  communityModerationRoute,
  postDetailRoute,
  myCommunitiesRoute,
  discoverCommunitiesRoute,
  favoritesRoute,
  messagesRoute,
  conversationRoute,
  profileRoute,
  userProfileRoute,
  storeRoute,
  proRoute,
  proCheckoutRoute,
  settingsRoute,
  confirmEmailChangeRoute,
  privacyPolicyRoute,
  cookiesPolicyRoute,
  adminRoute,
  landingRoute,
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
  // Pantallas de error por defecto (ver components/errors/ErrorPages.tsx):
  // 404 "not quaound" para rutas que no existen y "honk" si una ruta revienta.
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: RouteErrorPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
