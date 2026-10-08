import { useCallback } from 'react'
import { useUserPreferences } from '@/utils/userPreferences'

/**
 * Preferencia "pedir confirmación antes de quitar un favorito" (activada por
 * defecto). La cambian dos lugares: el checkbox "No volver a mostrar" del
 * diálogo y el interruptor de /settings; los dos quedan sincronizados porque
 * leen de la misma cookie de preferencias (ver utils/userPreferences.ts).
 */
export function useUnfavoriteConfirmation() {
  const { preferences, setPreference } = useUserPreferences()
  const setConfirmUnfavorite = useCallback((value: boolean) => setPreference('confirmUnfavorite', value), [setPreference])

  return { confirmUnfavorite: preferences.confirmUnfavorite, setConfirmUnfavorite }
}
