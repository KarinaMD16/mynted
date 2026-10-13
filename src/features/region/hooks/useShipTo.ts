import { useCallback, useMemo } from 'react'
import { SHIPPING_REGIONS, detectShippingRegion, regionFlag, regionName } from '@/utils/locale'
import { useLanguage } from '@/i18n/LanguageContext'
import { useUserPreferences } from '@/utils/userPreferences'

/**
 * País al que la persona recibe sus compras (cookie de preferencias, ver
 * utils/userPreferences.ts). Lo eligen el diálogo de bienvenida y /settings.
 * `options` trae los países con bandera, ordenados por nombre en el idioma
 * actual, listos para el <Select>.
 */
export function useShipTo() {
  const { language } = useLanguage()
  const { preferences, setPreference } = useUserPreferences()

  const options = useMemo(
    () =>
      SHIPPING_REGIONS.map((region) => ({ value: region, label: `${regionFlag(region)} ${regionName(region, language)}` })).sort(
        (a, b) => a.label.localeCompare(b.label, language),
      ),
    [language],
  )

  const setShipTo = useCallback((region: string) => setPreference('shipTo', region), [setPreference])

  return { shipTo: preferences.shipTo, setShipTo, options, detectedRegion: detectShippingRegion() }
}
