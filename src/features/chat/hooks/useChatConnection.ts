import { useSyncExternalStore } from 'react'
import { chatSocket } from '../socket/chatSocket'

function subscribe(onChange: () => void) {
  chatSocket.on('connect', onChange)
  chatSocket.on('disconnect', onChange)
  chatSocket.on('connect_error', onChange)
  return () => {
    chatSocket.off('connect', onChange)
    chatSocket.off('disconnect', onChange)
    chatSocket.off('connect_error', onChange)
  }
}

/**
 * `true` mientras el socket está conectado. Con el socket caído el chat sigue
 * funcionando por REST (enviar, historial, leído); solo se pierde lo "en
 * vivo", así que alcanza con un aviso discreto en la pantalla.
 */
export function useIsChatConnected() {
  return useSyncExternalStore(subscribe, () => chatSocket.connected)
}
