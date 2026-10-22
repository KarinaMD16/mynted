import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DEFAULT_DISPLAY_CURRENCY,
  accountDisplayCurrency,
  getRequestDisplayCurrency,
  setRequestDisplayCurrency,
  visitorDisplayCurrency,
} from '@/utils/displayCurrency'
import { useUserPreferences } from '@/utils/userPreferences'
import { authKeys } from './useAuthMutations'
import { useCurrentUser } from './useCurrentUser'

/**
 * Moneda en la que se muestran los precios (ver utils/displayCurrency.ts).
 * `isResolved` es false mientras no se sabe si hay sesión: en ese rato vale
 * CRC, que es lo que el backend usa cuando no recibe el header.
 */
function useResolvedDisplayCurrency(): { currency: string; isResolved: boolean } {
  const { data: user, isPending } = useCurrentUser()
  const { preferences } = useUserPreferences()
  const { shipTo } = preferences

  return useMemo(() => {
    if (user) return { currency: accountDisplayCurrency(user), isResolved: true }
    if (isPending) return { currency: DEFAULT_DISPLAY_CURRENCY, isResolved: false }
    return { currency: visitorDisplayCurrency(shipTo), isResolved: true }
  }, [user, isPending, shipTo])
}

/**
 * Moneda con la que se muestran importes que arma el propio frontend (p. ej.
 * las etiquetas del filtro de precio de Explorar). Es la misma que se manda
 * al backend en el header X-Display-Currency, así que coincide con los
 * precios `display*` de los productos.
 */
export function useDisplayCurrency(): string {
  return useResolvedDisplayCurrency().currency
}

/**
 * Montado una sola vez en App.tsx. Guarda la moneda resuelta para el
 * interceptor de axios y, si cambia (se resolvió la sesión, el visitante
 * eligió otro país o el usuario cambió la moneda en ajustes), vuelve a pedir
 * los datos en caché para que ningún precio quede en la moneda anterior.
 *
 * Mientras no se sabe si hay sesión las peticiones salen sin header y el
 * backend responde en CRC (visitante) o en la moneda de la cuenta; por eso,
 * al resolverse, si la moneda no es CRC se refresca una vez.
 */
export function DisplayCurrencySync() {
  const queryClient = useQueryClient()
  const { currency, isResolved } = useResolvedDisplayCurrency()

  useEffect(() => {
    if (!isResolved) return
    const previous = getRequestDisplayCurrency() ?? DEFAULT_DISPLAY_CURRENCY
    setRequestDisplayCurrency(currency)
    if (currency !== previous) {
      // Todo menos la sesión: los productos aparecen en muchas consultas
      // (listados, búsqueda, favoritos, publicaciones, chat...).
      void queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] })
    }
  }, [currency, isResolved, queryClient])

  return null
}
