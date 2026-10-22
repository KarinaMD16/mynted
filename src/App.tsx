import { Outlet } from '@tanstack/react-router'
import { CookieBanner } from './components/ui/CookieBanner'
import { ChatLauncher } from './features/chat/components/ChatLauncher'
import { ChatRealtime } from './features/chat/components/ChatRealtime'
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
      {/* Socket del chat: conecta con sesión, desconecta al cerrarla (ver ChatRealtime). */}
      <ChatRealtime />
      {/* Botón flotante de mensajes, en todas las pantallas menos /messages (ver ChatLauncher). */}
      <ChatLauncher />
      <Outlet />
      <CookieBanner />
      <ShipToDialog />
    </LanguageProvider>
  )
}

export default App
