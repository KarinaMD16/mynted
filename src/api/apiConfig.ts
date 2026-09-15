import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * URL del backend. Se usa de dos formas distintas:
 * - como baseURL de axios, para las llamadas XHR normales;
 * - con window.location, para los flujos OAuth: son redirecciones de página
 *   completa hacia Google/Facebook, así que no pueden pasar por axios.
 */
const rawBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

const myntedAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// -----------------------------------------------------------------------------
// Refresh de sesión
// -----------------------------------------------------------------------------
//
// El access_token dura 15 minutos (JWT_EXPIRES_IN_SECONDS en el backend); el
// refresh_token, 7 días (JWT_REFRESH_EXPIRES_IN_SECONDS). Los dos viajan en
// cookies httpOnly, así que el frontend no puede leerlos ni enterarse de
// antemano de que uno venció — se entera cuando una petición autenticada
// responde 401. Este interceptor:
//
//   1. detecta ese 401 en cualquier petición hecha con `myntedAPI`,
//   2. pide un access_token nuevo con POST /auth/refresh (usa la cookie
//      refresh_token, que el navegador manda solo — no hace falta leerla),
//   3. si el refresh funciona, reintenta la petición original UNA sola vez,
//   4. si el refresh también falla (refresh_token vencido/inválido), deja
//      pasar el error original tal cual, para que quien preguntó "¿hay
//      sesión?" (ver useCurrentUserQuery) lo interprete como "no hay sesión".
//
// `refreshPromise` evita que, si varias peticiones disparan un 401 al mismo
// tiempo (por ejemplo el header pidiendo el usuario actual y una pantalla
// pidiendo sus datos a la vez), se disparen varios POST /auth/refresh en
// paralelo: todas esperan la misma promesa en curso.

let refreshPromise: Promise<void> | null = null

function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    // Axios "pelado" (no myntedAPI) a propósito: así esta llamada nunca pasa
    // por este mismo interceptor.
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, undefined, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean
}

// Endpoints donde un 401 nunca significa "el access_token venció, hay que
// refrescar": login/register/social devuelven 401 por credenciales
// inválidas, y refresh no debe reintentarse a sí mismo.
const SKIP_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/google', '/auth/facebook']

myntedAPI.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableRequestConfig | undefined
    const isUnauthorized = error.response?.status === 401
    const alreadyRetried = config?._retriedAfterRefresh === true
    const isExemptEndpoint = SKIP_REFRESH_PATHS.some((path) => config?.url?.includes(path))

    if (!config || !isUnauthorized || alreadyRetried || isExemptEndpoint) {
      throw error
    }

    config._retriedAfterRefresh = true

    try {
      await refreshSession()
    } catch {
      // El refresh_token también venció (o no existe): la sesión murió de
      // verdad, no hay nada más que intentar.
      throw error
    }

    return myntedAPI(config)
  },
)

export default myntedAPI
