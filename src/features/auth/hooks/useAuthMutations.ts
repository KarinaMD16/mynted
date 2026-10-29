import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { AuthUser } from '../models/auth'
import {
  changePasswordRequest,
  confirmEmailChangeRequest,
  forgotPasswordRequest,
  getCurrentUserRequest,
  getUserByIdRequest,
  getUserByUsernameRequest,
  loginRequest,
  loginWithFacebookRequest,
  loginWithGoogleRequest,
  logoutRequest,
  registerRequest,
  requestEmailChangeRequest,
  resetPasswordRequest,
  updateProfileRequest,
} from '../services/authServices'
import { requestSellerRequest } from '../services/sellersService'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/**
 * Al cambiar de sesion se vacia todo el cache de React Query. React Query
 * conserva el ultimo resultado aunque la consulta quede desactivada, y sin
 * esto la cuenta siguiente veia un momento los datos de la anterior (sus
 * comunidades, su rol, sus intereses...). Se borra todo en vez de una lista de
 * claves para que ninguna consulta nueva se quede afuera por olvido; lo
 * publico (categorias, tags) simplemente se vuelve a pedir.
 */
async function clearSessionCache(queryClient: QueryClient) {
  // Primero se cancela lo que haya en vuelo. clear() vacia el cache, pero no
  // detiene las peticiones ya salidas: una respuesta de la cuenta anterior que
  // llegara despues se escribiria en el cache recien vaciado y esa pantalla
  // quedaria con datos ajenos hasta que algo la volviera a pedir. Pasa al
  // cerrar sesion desde una pantalla que estaba cargando (el perfil o el panel
  // del vendedor piden varias cosas a la vez).
  await queryClient.cancelQueries()
  queryClient.clear()
}

/**
 * Al entrar con una cuenta: fuera lo de la sesion anterior y guardar el
 * usuario nuevo.
 *
 * POST /auth/login devuelve un usuario RECORTADO: solo id, username, email,
 * photoUrl y las fechas. No trae `role`, ni la moneda, ni el idioma, ni el
 * estado de vendedor. Escribirlo tal cual dejaba la sesion a medias —sin
 * `role` el menu no ofrece el panel de admin ni el perfil muestra las
 * pestanas de vendedor— y, como la consulta de sesion se considera fresca
 * durante SESSION_STALE_TIME, eso duraba hasta recargar la pagina.
 *
 * Asi que se escribe lo que vino (el header muestra la sesion al instante) y
 * acto seguido se pide /users/me completo, con staleTime 0 para que no
 * devuelva lo que acabamos de escribir.
 */
async function startSession(queryClient: QueryClient, user: AuthUser) {
  await clearSessionCache(queryClient)
  queryClient.setQueryData<AuthUser>(authKeys.me, user)

  try {
    await queryClient.fetchQuery({ queryKey: authKeys.me, queryFn: getCurrentUserRequest, staleTime: 0 })
  } catch {
    // La sesion ya esta abierta; solo fallo traer el resto del usuario. Se
    // marca como vencida para que el proximo montaje la vuelva a pedir en vez
    // de quedarse cinco minutos con los datos a medias.
    await queryClient.invalidateQueries({ queryKey: authKeys.me })
  }
}

/**
 * "¿Hay sesión, y de quién?" — la fuente de verdad es GET /users/me, que el
 * backend valida contra la cookie de sesión (ver el interceptor de refresh
 * en api/apiConfig.ts). Un 401 acá significa "no hay sesión", no un error
 * de la app, así que no tiene sentido reintentar (ver useCurrentUser).
 */
/** Cinco minutos: lo justo para que los montajes de una misma pantalla compartan la respuesta. */
const SESSION_STALE_TIME = 5 * 60 * 1000

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getCurrentUserRequest,
    retry: false,
    // Sin sesión la consulta queda en error y sin datos. Por defecto React Query la vuelve
    // a pedir cada vez que se monta un componente nuevo que la usa, y mientras la pide
    // `isLoading` vuelve a true: las pantallas que esconden secciones "mientras carga la
    // sesión" (el home) las desmontan, al terminar las montan otra vez y eso dispara otro
    // GET /users/me + POST /auth/refresh... en bucle, con el botón de cuenta pegado en
    // "cargando". Con retryOnMount: false un 401 se respeta hasta que algo cambie la
    // sesión (login/logout escriben este cache directo).
    retryOnMount: false,
    // Por lo mismo, sin sesión no se re-pide al volver a la pestaña (haría parpadear el
    // home); con sesión sí, para enterarse si venció.
    refetchOnWindowFocus: (query) => query.state.status !== 'error',
    // Lo de arriba cubre el caso sin sesión (la consulta queda en error). Con sesión el
    // problema es otro: los datos nacen vencidos, así que cada componente que se monta y
    // se suscribe —el header, la pantalla, cada botón de favorito— dispara su propio GET
    // /users/me. Se medían tres por carga de /explore. La sesión no cambia sola, y cuando
    // cambia se avisa a mano: login y logout hacen clear() y setQueryData, y un 401 lo
    // atrapa el interceptor de apiConfig.
    staleTime: SESSION_STALE_TIME,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => startSession(queryClient, user),
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerRequest,
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutRequest,
    // clear() tambien borra authKeys.me, asi que el header pasa a "sin sesion"
    onSuccess: () => clearSessionCache(queryClient),
  })
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginWithGoogleRequest,
    onSuccess: (user) => startSession(queryClient, user),
  })
}

export function useFacebookLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loginWithFacebookRequest,
    onSuccess: (user) => startSession(queryClient, user),
  })
}

/** Perfil público de otra persona, por id (la clave empieza con 'users' para invalidarlo junto con sus datos). */
export function useUserByIdQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['users', 'by-id', id],
    queryFn: () => getUserByIdRequest(id as string),
    enabled: Boolean(id),
  })
}

/** Perfil público de otra persona, por username (/users/keishi). */
export function useUserByUsernameQuery(username: string | undefined) {
  return useQuery({
    queryKey: ['users', 'by-username', username],
    queryFn: () => getUserByUsernameRequest(username as string),
    enabled: Boolean(username),
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPasswordRequest,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPasswordRequest,
  })
}

/**
 * Cambiar contraseña estando logueado (distinto del flujo de "olvidé mi
 * contraseña"). No toca el cache de authKeys.me: la respuesta es solo un
 * mensaje, no el usuario actualizado.
 */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: changePasswordRequest,
  })
}

/** Pide el enlace para cambiar el correo (ver AccountSettingsSection). */
export function useRequestEmailChangeMutation() {
  return useMutation({
    mutationFn: requestEmailChangeRequest,
  })
}

/**
 * Confirma el cambio de correo con el token del enlace (ver
 * ConfirmEmailChangePage). La respuesta es solo un mensaje, así que se
 * invalida authKeys.me para que el header y /settings muestren el correo nuevo.
 */
export function useConfirmEmailChangeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: confirmEmailChangeRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me }),
  })
}

/**
 * Actualiza el perfil (ver /settings). useCurrentUser/ProfilePage leen
 * de useCurrentUserQuery (clave authKeys.me), así que ahí hay que refrescar
 * el cache — ya tenemos el usuario actualizado en la respuesta, así que se
 * puede hacer setQueryData directo sin esperar a un refetch.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authKeys.me, user)
    },
  })
}

/**
 * Solicitar convertirse en vendedor (ver BecomeSellerForm). Igual que
 * useUpdateProfileMutation: la respuesta ya trae el User con
 * sellerRequestStatus al día, así que se escribe directo en el cache.
 */
export function useRequestSellerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: requestSellerRequest,
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authKeys.me, user)
    },
  })
}
