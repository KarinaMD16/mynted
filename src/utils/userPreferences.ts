import { useCallback, useSyncExternalStore } from 'react'
import { eraseCookie, readCookie, writeCookie } from '@/cuicui/hooks/use-cookies'
import { SHIPPING_REGIONS } from './locale'

/**
 * Preferencias de uso de la app que el usuario cambia a mano (pedir
 * confirmación antes de quitar un favorito y el país al que recibe sus
 * compras). Se guardan juntas en una sola cookie, `mynted_preferences`, que
 * solo se crea cuando el usuario cambia alguna; sin cookie rigen los valores
 * por defecto. Los interruptores son boolean, igual que las preferencias de
 * notificaciones del backend; el país (`shipTo`) es el único valor de texto.
 *
 * La cookie está descrita en la Política de Cookies y se puede ver y
 * restablecer desde /settings (pestaña Privacidad). Cuando el backend tenga
 * estas preferencias como booleanos del usuario, este archivo es el único
 * que hay que cambiar.
 */
export interface UserPreferences {
  /** Mostrar el aviso "¿Quitar de favoritos?" antes de quitar uno. */
  confirmUnfavorite: boolean
  /** País (código ISO 3166-1 alfa-2, p. ej. "CR") al que la persona recibe sus compras; null = sin elegir. */
  shipTo: string | null
}

export const PREFERENCES_COOKIE_NAME = 'mynted_preferences'
export const PREFERENCES_COOKIE_DAYS = 365

export const DEFAULT_PREFERENCES: UserPreferences = { confirmUnfavorite: true, shipTo: null }

interface PreferencesState {
  values: UserPreferences
  /** true si ya existe la cookie (el usuario cambió alguna preferencia). */
  isStored: boolean
}

const DEFAULT_STATE: PreferencesState = { values: DEFAULT_PREFERENCES, isStored: false }

function parse(raw: string | null): PreferencesState {
  if (raw === null) return DEFAULT_STATE
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof UserPreferences, unknown>>
    const values: UserPreferences = {
      confirmUnfavorite:
        typeof parsed.confirmUnfavorite === 'boolean' ? parsed.confirmUnfavorite : DEFAULT_PREFERENCES.confirmUnfavorite,
      // Solo se acepta un código de país de la lista; cualquier otra cosa se ignora.
      shipTo:
        typeof parsed.shipTo === 'string' && SHIPPING_REGIONS.includes(parsed.shipTo) ? parsed.shipTo : DEFAULT_PREFERENCES.shipTo,
    }
    return { values, isStored: true }
  } catch {
    // Cookie corrupta: se ignora y rigen los valores por defecto.
    return DEFAULT_STATE
  }
}

// useSyncExternalStore necesita el mismo objeto mientras la cookie no cambie.
let cachedRaw: string | null | undefined
let cachedState: PreferencesState = DEFAULT_STATE

function getSnapshot(): PreferencesState {
  const raw = readCookie(PREFERENCES_COOKIE_NAME)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedState = parse(raw)
  }
  return cachedState
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Las cookies no avisan cuando cambian: al volver a la pestaña se vuelve a leer, por si cambió en otra.
  window.addEventListener('focus', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('focus', listener)
  }
}

export function useUserPreferences() {
  const { values, isStored } = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_STATE)

  const setPreference = useCallback(<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = { ...getSnapshot().values, [key]: value }
    writeCookie(PREFERENCES_COOKIE_NAME, JSON.stringify(next), {
      days: PREFERENCES_COOKIE_DAYS,
      sameSite: 'lax',
      secure: true,
    })
    notify()
  }, [])

  const resetPreferences = useCallback(() => {
    eraseCookie(PREFERENCES_COOKIE_NAME)
    notify()
  }, [])

  return { preferences: values, isStored, setPreference, resetPreferences }
}
