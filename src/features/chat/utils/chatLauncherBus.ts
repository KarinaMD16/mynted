/**
 * Pedido de "abrí esta conversación en la hoja de mensajes" desde cualquier
 * parte de la app (p. ej. el botón "Contactar" de una tarjeta de producto).
 * La escucha ChatLauncher mientras está visible. Es un comando, no estado:
 * por eso un simple suscriptor y no un store.
 */
type OpenConversationListener = (conversationId: number) => void

const listeners = new Set<OpenConversationListener>()

/** Devuelve false si no hay hoja que lo pueda abrir (ChatLauncher oculto en esa pantalla). */
export function openConversationInLauncher(conversationId: number): boolean {
  if (listeners.size === 0) return false
  listeners.forEach((listener) => listener(conversationId))
  return true
}

export function subscribeToLauncherOpen(listener: OpenConversationListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
