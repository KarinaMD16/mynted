import { Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { CookieBanner } from './components/ui/CookieBanner'
import { ChatLauncher } from './features/chat/components/ChatLauncher'
import { ChatRealtime } from './features/chat/components/ChatRealtime'
import { NotificationsRealtime } from './features/notifications/components/NotificationsRealtime'
import { ShipToDialog } from './features/region/components/ShipToDialog'
import { useAdoptAccountLanguage } from './features/auth/hooks/useAccountLanguage'
import { DisplayCurrencySync } from './features/auth/hooks/useDisplayCurrency'
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
      {/* Moneda de los precios: header X-Display-Currency y refresco al cambiarla (ver useDisplayCurrency). */}
      <DisplayCurrencySync />
      {/* Socket del chat: conecta con sesión, desconecta al cerrarla (ver ChatRealtime). */}
      <ChatRealtime />
      {/* Notificaciones en vivo por el mismo socket: campana, contador y avisos emergentes. */}
      <NotificationsRealtime />
      {/* Botón flotante de mensajes, en todas las pantallas menos /messages (ver ChatLauncher). */}
      <ChatLauncher />
      <Outlet />
      <CookieBanner />
      <ShipToDialog />
      {/* Avisos emergentes (sonner). Abajo a la izquierda: abajo a la derecha está el botón del chat. */}
      <Toaster position="bottom-left" closeButton />
    </LanguageProvider>
  )
}

export default App
