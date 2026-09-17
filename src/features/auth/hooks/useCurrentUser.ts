import { useCurrentUserQuery } from './useAuthMutations'

/**
 * Sesión actual, para cualquier componente que necesite saber "¿hay alguien
 * logueado, y quién?" (el header, /profile, etc.).
 *
 * Antes esto se resolvía guardando el id del usuario en localStorage al
 * iniciar sesión y confiando en él después — el problema es que eso nunca
 * verificaba que la sesión siguiera siendo válida (ni se enteraba de un
 * access_token vencido). Ahora la fuente de verdad es GET /users/me, que el
 * backend sí valida contra la cookie de sesión; ver useCurrentUserQuery en
 * useAuthMutations.ts y el interceptor de refresh en api/apiConfig.ts.
 *
 * `isLoggedIn` queda en `false` tanto si la query todavía no resolvió como
 * si ya resolvió y no hay sesión — quien lo use debe mirar también
 * `isLoading` para no mostrar "no hay sesión" antes de tiempo (ver
 * AccountControl.tsx).
 */
export function useCurrentUser() {
  const query = useCurrentUserQuery()

  return {
    ...query,
    userId: query.data?.id ?? null,
    isLoggedIn: Boolean(query.data),
  }
}
