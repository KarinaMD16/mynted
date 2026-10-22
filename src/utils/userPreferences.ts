import { useCallback, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { eraseCookie, readCookie, writeCookie } from '@/cuicui/hooks/use-cookies'
import { authKeys, useCurrentUserQuery, useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations'
import type { AuthUser } from '@/features/auth/models/auth'
import { SHIPPING_REGIONS } from './locale'

/**
 * Preferencias de uso de la app que el usuario cambia a mano: pedir
 * confirmación antes de quitar un favorito y el país al que recibe sus
 * compras. Los interruptores son boolean, igual que las preferencias de
 * notificaciones; el país (`shipTo`) es el único valor de texto.
 *
 * Dónde viven:
 * - CON sesión, en la cuenta: `confirmUnfavorite` y `country` de
 *   GET/PATCH /users/me, así que siguen a la persona entre dispositivos.
 * - SIN sesión, en una cookie, `mynted_preferences`, que solo se crea cuando la
 *   persona cambia alguna; sin cookie rigen los valores por defecto. La cookie
 *   está descrita en la Política de Cookies y se puede ver y restablecer desde
 *   /settings (pestaña Privacidad).
 *
 * Quien consume `useUserPreferences` no necesita saber cuál de las dos se usa.
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

function useCookiePreferences() {
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

/** PATCH /users/me es multipart (puede llevar foto): hasta los booleanos viajan como texto. */
function profileFormData(fields: Record<string, string | boolean>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) formData.append(key, String(value))
  return formData
}

/**
 * Preferencias vigentes: las de la cuenta si hay sesión, las de la cookie si no.
 *
 * - `isLoading`: todavía no se sabe si hay sesión. Mientras tanto no conviene
 *   decidir nada con `shipTo` (p. ej. abrir el diálogo "¿Dónde recibes tus
 *   compras?" a alguien que ya tiene país en su cuenta).
 * - `isStored`: hay algo guardado distinto de los valores por defecto.
 * - `resetPreferences`: borra la cookie de este navegador y, con sesión,
 *   vuelve a activar el aviso de favoritos. El país de la cuenta no se puede
 *   quitar (el backend solo lo reemplaza), se cambia eligiendo otro.
 */
export function useUserPreferences() {
  const cookie = useCookiePreferences()
  const queryClient = useQueryClient()
  const userQuery = useCurrentUserQuery()
  const updateProfile = useUpdateProfileMutation()
  const user = userQuery.data

  const preferences: UserPreferences = user
    ? {
        confirmUnfavorite: user.confirmUnfavorite ?? DEFAULT_PREFERENCES.confirmUnfavorite,
        // Si la cuenta aún no tiene país, rige el que se eligió antes de entrar (cookie).
        shipTo: user.country ?? cookie.preferences.shipTo,
      }
    : cookie.preferences

  const saveToAccount = useCallback(
    (fields: Partial<Pick<AuthUser, 'country' | 'confirmUnfavorite'>>) => {
      // Optimista: el interruptor / selector cambia al instante y, si el backend falla, se vuelve a pedir.
      queryClient.setQueryData<AuthUser>(authKeys.me, (current) => current && { ...current, ...fields })
      updateProfile.mutate(profileFormData(fields as Record<string, string | boolean>), {
        onError: () => void queryClient.invalidateQueries({ queryKey: authKeys.me }),
      })
    },
    [queryClient, updateProfile],
  )

  const setPreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      if (!user) {
        cookie.setPreference(key, value)
      } else if (key === 'confirmUnfavorite') {
        saveToAccount({ confirmUnfavorite: value as boolean })
      } else if (typeof value === 'string') {
        saveToAccount({ country: value })
      }
    },
    [cookie, saveToAccount, user],
  )

  const resetPreferences = useCallback(() => {
    cookie.resetPreferences()
    if (user && user.confirmUnfavorite === false) saveToAccount({ confirmUnfavorite: true })
  }, [cookie, saveToAccount, user])

  return {
    preferences,
    isLoading: userQuery.isPending,
    isStored: user ? Boolean(user.country) || user.confirmUnfavorite === false || cookie.isStored : cookie.isStored,
    setPreference,
    resetPreferences,
  }
}
