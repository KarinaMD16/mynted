import { Outlet } from '@tanstack/react-router'
import { CookieBanner } from './components/ui/CookieBanner'
import { LanguageProvider } from './i18n/LanguageContext'

/**
 * Layout raíz de la aplicación.
 *
 * Acá es donde va cualquier elemento global (banner de cookies, y ahora el
 * proveedor de idioma) que deba envolver o mostrarse en todas las pantallas.
 * LanguageProvider tiene que estar por encima de <Outlet /> porque cualquier
 * página (y el propio CookieBanner) puede llamar a useLanguage().
 */
function App() {
  return (
    <LanguageProvider>
      <Outlet />
      <CookieBanner />
    </LanguageProvider>
  )
}

export default App
