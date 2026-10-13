import { Outlet } from '@tanstack/react-router'
import { CookieBanner } from './components/ui/CookieBanner'
import { ShipToDialog } from './features/region/components/ShipToDialog'
import { useAdoptAccountLanguage } from './features/auth/hooks/useAccountLanguage'
import { LanguageProvider } from './i18n/LanguageContext'

/**
 * Layout raíz de la aplicación.
 *
 * Acá es donde va cualquier elemento global (banner de cookies, y ahora el
 * proveedor de idioma) que deba envolver o mostrarse en todas las pantallas.
 * LanguageProvider tiene que estar por encima de <Outlet /> porque cualquier
 * página (y el propio CookieBanner) puede llamar a useLanguage().
 */
/** Vive dentro del LanguageProvider: adopta el idioma guardado en la cuenta (ver useAdoptAccountLanguage). */
function AccountLanguageSync() {
  useAdoptAccountLanguage()
  return null
}

function App() {
  return (
    <LanguageProvider>
      <AccountLanguageSync />
      <Outlet />
      <CookieBanner />
      <ShipToDialog />
    </LanguageProvider>
  )
}

export default App
