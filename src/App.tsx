import { Outlet } from '@tanstack/react-router'

/**
 * Layout raíz de la aplicación.
 *
 * Acá es donde en el futuro iría cualquier elemento global (navbar,
 * banner de notificaciones, etc.) que deba mostrarse en todas las
 * pantallas. Por ahora solo delega en la ruta activa.
 */
function App() {
  return <Outlet />
}

export default App
