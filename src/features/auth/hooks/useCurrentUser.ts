import { useSyncExternalStore } from 'react'
import { clearStoredUserId, getStoredUserId, setStoredUserId } from '../session'
import { useUserByIdQuery } from './useAuthMutations'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  listeners.forEach((listener) => listener())
}

/** Llamar apenas login/registro devuelven un usuario válido (ver LoginForm/RegisterForm). */
export function setCurrentUserId(id: string): void {
  setStoredUserId(id)
  notify()
}

/** Llamar al cerrar sesión, para que el header y /profile dejen de mostrar al usuario anterior. */
export function clearCurrentUser(): void {
  clearStoredUserId()
  notify()
}

/**
 * Id del usuario logueado (guardado en localStorage al iniciar sesión) +
 * su perfil siempre fresco vía GET /users/{id}. `useSyncExternalStore`
 * mantiene sincronizados todos los componentes que usan este hook (header,
 * /profile, etc.) apenas cambia la sesión, sin necesidad de un store global.
 */
export function useCurrentUser() {
  const userId = useSyncExternalStore(subscribe, getStoredUserId, () => null)
  const userQuery = useUserByIdQuery(userId ?? undefined)

  return {
    userId,
    isLoggedIn: Boolean(userId),
    ...userQuery,
  }
}
