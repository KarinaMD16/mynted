import { useMemo } from 'react'
import { currencyOfRegion, detectCurrency } from '@/utils/locale'
import { useUserPreferences } from '@/utils/userPreferences'
import { useCurrentUser } from './useCurrentUser'

/**
 * Moneda con la que se muestran importes de referencia (p. ej. el filtro de
 * precio de Explorar). En orden: la del país al que la persona dijo que recibe
 * sus compras, la de su cuenta y, si no hay ninguna, la que corresponde a su
 * lugar (ver detectCurrency), nunca una fija.
 */
export function useDisplayCurrency(): string {
  const accountCurrency = useCurrentUser().data?.currency
  const { preferences } = useUserPreferences()
  const { shipTo } = preferences
  return useMemo(
    () => (shipTo ? currencyOfRegion(shipTo) : (accountCurrency ?? detectCurrency())),
    [shipTo, accountCurrency],
  )
}
