import { useEffect } from 'react'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useInboxSync } from '../hooks/useInboxSync'
import { connectChatSocket, disconnectChatSocket } from '../socket/chatSocket'

/**
 * Conecta el socket del chat mientras haya sesión y lo desconecta al cerrarla
 * (o al cambiar de cuenta: cambia el userId). Al cerrar sesión, el cache del
 * usuario actual pasa a null (useLogoutMutation) y este efecto desconecta; así
 * un socket abierto no sigue recibiendo eventos de la cuenta anterior.
 *
 * Si el socket se cae y no se recupera solo, vuelve a intentarlo al recuperar
 * la red o al volver a la pestaña.
 *
 * Va una sola vez en App. No pinta nada.
 */
export function ChatRealtime() {
  const { userId } = useCurrentUser()

  useEffect(() => {
    if (!userId) return
    connectChatSocket()

    // Si quedó desconectado (sin red, backend reiniciado, sesión renovada a destiempo),
    // reintentar en cuanto haya chances de que funcione. connectChatSocket no hace nada
    // si ya está conectado o reconectándose solo.
    const retry = () => {
      if (document.visibilityState === 'visible') connectChatSocket()
    }
    window.addEventListener('online', retry)
    window.addEventListener('focus', retry)
    document.addEventListener('visibilitychange', retry)
    return () => {
      window.removeEventListener('online', retry)
      window.removeEventListener('focus', retry)
      document.removeEventListener('visibilitychange', retry)
      disconnectChatSocket()
    }
  }, [userId])

  useInboxSync(userId)

  return null
}
