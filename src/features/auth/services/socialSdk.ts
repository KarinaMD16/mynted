/**
 * Carga perezosa de los SDK de Google y Facebook.
 *
 * El backend no implementa el flujo de redirect (no existe GET /auth/google):
 * espera que el navegador consiga el token del proveedor y lo mande por POST.
 * Google entrega un ID token (Google Identity Services) y Facebook un access
 * token (JS SDK); el backend los verifica contra el proveedor y abre la sesión.
 */

const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_SDK_ID = 'google-identity-services'

const FACEBOOK_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js'
const FACEBOOK_SDK_ID = 'facebook-jssdk'
const FACEBOOK_API_VERSION = 'v21.0'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
export const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID ?? ''

export const isGoogleConfigured = GOOGLE_CLIENT_ID.length > 0
export const isFacebookConfigured = FACEBOOK_APP_ID.length > 0

// -----------------------------------------------------------------------------
// Tipos mínimos de los SDK (solo lo que usamos)
// -----------------------------------------------------------------------------

export interface GoogleCredentialResponse {
  /** JWT firmado por Google. Es el `idToken` que pide POST /auth/google. */
  credential?: string
}

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'small' | 'medium' | 'large'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void
  disableAutoSelect(): void
}

interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: { accessToken?: string } | null
}

export interface FacebookSdk {
  init(config: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }): void
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope?: string },
  ): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

// -----------------------------------------------------------------------------
// Carga de scripts
// -----------------------------------------------------------------------------

const scriptPromises = new Map<string, Promise<void>>()

function loadScript(id: string, src: string): Promise<void> {
  const cached = scriptPromises.get(id)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)))
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromises.delete(id)
      reject(new Error(`No se pudo cargar ${src}`))
    }
    document.head.appendChild(script)
  })

  scriptPromises.set(id, promise)
  return promise
}

// -----------------------------------------------------------------------------
// Google
// -----------------------------------------------------------------------------

export async function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (!isGoogleConfigured) {
    throw new Error('Falta VITE_GOOGLE_CLIENT_ID en el .env del frontend')
  }
  await loadScript(GOOGLE_SDK_ID, GOOGLE_SDK_SRC)
  const accounts = window.google?.accounts.id
  if (!accounts) throw new Error('Google Identity Services no quedó disponible')
  return accounts
}

/**
 * Prepara el botón oficial de Google dentro de `container`.
 *
 * Google solo entrega el ID token desde su propio botón (o One Tap), así que el
 * botón real se renderiza transparente encima del nuestro: el usuario ve el
 * diseño de Mynted y el click lo recibe Google.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onCredential: (idToken: string) => void,
  onError: (message: string) => void,
): Promise<void> {
  const accounts = await loadGoogleIdentity()

  accounts.initialize({
    client_id: GOOGLE_CLIENT_ID,
    ux_mode: 'popup',
    auto_select: false,
    cancel_on_tap_outside: true,
    callback: (response) => {
      if (!response.credential) {
        onError('Google no devolvió el token de acceso. Intenta de nuevo.')
        return
      }
      onCredential(response.credential)
    },
  })

  container.replaceChildren()
  accounts.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'center',
    // Google exige un ancho explícito entre 200 y 400 px.
    width: Math.min(400, Math.max(200, Math.round(container.clientWidth || 200))),
  })
}

// -----------------------------------------------------------------------------
// Facebook
// -----------------------------------------------------------------------------

let facebookSdkPromise: Promise<FacebookSdk> | null = null

/**
 * Mientras `sdk.js` termina de arrancar, `window.FB` es un stub que solo encola
 * las llamadas en `__buffer` y nunca las ejecuta. El SDK recién reemplaza
 * `window.FB` por el objeto real justo antes de llamar a `fbAsyncInit`, así que
 * ese es el único momento seguro para quedarse con la referencia.
 */
function isRealFacebookSdk(fb: FacebookSdk | undefined): fb is FacebookSdk {
  return !!fb && !('__buffer' in fb)
}

/**
 * Carga e inicializa el SDK una sola vez. Conviene llamarlo al montar la
 * pantalla: cuando llega el click el SDK ya está listo y `FB.login` puede
 * correr sin `await`, que es lo que evita que el navegador bloquee el popup.
 */
export function preloadFacebookSdk(): Promise<FacebookSdk> {
  if (facebookSdkPromise) return facebookSdkPromise
  if (!isFacebookConfigured) {
    return Promise.reject(new Error('Falta VITE_FACEBOOK_APP_ID en el .env del frontend'))
  }

  const init = (fb: FacebookSdk) => {
    fb.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: false,
      version: FACEBOOK_API_VERSION,
    })
    return fb
  }

  facebookSdkPromise = new Promise<FacebookSdk>((resolve, reject) => {
    // El script pudo quedar cargado de un render anterior (HMR): ahí
    // `fbAsyncInit` ya se disparó y no se vuelve a llamar.
    if (isRealFacebookSdk(window.FB)) {
      resolve(init(window.FB))
      return
    }

    window.fbAsyncInit = () => {
      const fb = window.FB
      if (!isRealFacebookSdk(fb)) {
        reject(new Error('El SDK de Facebook no quedó disponible'))
        return
      }
      resolve(init(fb))
    }

    loadScript(FACEBOOK_SDK_ID, FACEBOOK_SDK_SRC).catch(reject)
  })

  // Un fallo no puede dejar la promesa cacheada: el próximo intento debe cargar
  // el SDK de nuevo.
  facebookSdkPromise.catch(() => {
    facebookSdkPromise = null
  })

  return facebookSdkPromise
}

/**
 * Abre el popup de Facebook y devuelve el access token.
 *
 * Recibe el SDK ya cargado a propósito: llamarlo de forma síncrona dentro del
 * handler del click conserva el gesto del usuario.
 */
export function loginWithFacebookPopup(fb: FacebookSdk): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fb.login(
      (response) => {
        const token = response.authResponse?.accessToken
        if (response.status === 'connected' && token) {
          resolve(token)
          return
        }
        reject(new Error('Cancelaste el inicio de sesión con Facebook.'))
      },
      { scope: 'email' },
    )
  })
}
