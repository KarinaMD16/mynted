/**
 * Consentimiento de cookies guardado en el navegador. Lo comparten el
 * CookieBanner (primera visita) y la pestaña Privacidad de /settings, así
 * que el nombre, la forma y las opciones de la cookie viven en un solo lugar.
 */
export interface CookieConsent {
  consent: boolean
  marketing: boolean
}

export const COOKIE_CONSENT_NAME = 'mynted_cookie_consent'

export const DEFAULT_COOKIE_CONSENT: CookieConsent = { consent: false, marketing: false }

export const COOKIE_CONSENT_OPTIONS = {
  days: 365,
  sameSite: 'lax',
  secure: true,
} as const

export const COOKIES_POLICY_PATH = '/legal/cookies'
