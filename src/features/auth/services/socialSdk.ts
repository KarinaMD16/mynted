import type { GoogleAccountsId, FacebookSdk } from "../types/socialTypes"


const GOOGLE_SDK_SRC = 'https://accounts.google.com/gsi/client'
const GOOGLE_SDK_ID = 'google-identity-services'

const FACEBOOK_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js'
const FACEBOOK_SDK_ID = 'facebook-jssdk'
const FACEBOOK_API_VERSION = 'v21.0'

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
export const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID ?? ''

export const isGoogleConfigured = GOOGLE_CLIENT_ID.length > 0
export const isFacebookConfigured = FACEBOOK_APP_ID.length > 0


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
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
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

function isRealFacebookSdk(fb: FacebookSdk | undefined): fb is FacebookSdk {
  return !!fb && !('__buffer' in fb)
}

/**
 * Carga e inicializa el SDK una sola vez. Conviene llamarlo al montar la
 * pantalla: cuando llega el click el SDK ya está listo y `FB.login` puede
 * correr sin `await` para evitar que el navegador bloquee el popup.
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
