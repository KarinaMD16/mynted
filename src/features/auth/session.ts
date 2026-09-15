const CURRENT_USER_ID_KEY = 'mynted:currentUserId'

/**
 * El backend no expone un "quién soy" (no hay GET /auth/me): lo único que
 * devuelve el id del usuario que acaba de iniciar sesión es la respuesta de
 * POST /auth/login (ver authServices.ts). Por eso guardamos ese id acá apenas
 * se abre sesión, y de ahí en adelante el perfil se vuelve a pedir siempre
 * fresco vía GET /users/{id} (ver hooks/useCurrentUser.ts) en vez de confiar
 * en datos guardados.
 */
export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(CURRENT_USER_ID_KEY)
  } catch {
    return null
  }
}

export function setStoredUserId(id: string): void {
  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, id)
  } catch {
    // localStorage puede fallar (modo privado, storage lleno, etc.); no es crítico.
  }
}

export function clearStoredUserId(): void {
  try {
    localStorage.removeItem(CURRENT_USER_ID_KEY)
  } catch {
    // no-op
  }
}
