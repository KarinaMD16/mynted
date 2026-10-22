import type { AuthUser } from '@/features/auth/models/auth'
import { SUPPORTED_CURRENCIES, currencyOfRegion, detectCurrency } from './locale'

/**
 * Moneda en la que se MUESTRAN los precios ("moneda de visualización").
 *
 * El backend convierte cada producto a esta moneda (campos `display*`, ver
 * utils/price.ts). Para que todo lo que se ve en pantalla coincida (tarjetas,
 * detalle, filtro de precio de Explorar), el frontend calcula la misma moneda
 * que usaría el backend y la manda en cada petición con el header
 * `X-Display-Currency` (ver el interceptor en api/apiConfig.ts):
 *
 * - CON sesión: `displayCurrency` de la cuenta (se elige en /settings), si no
 *   `currency` (moneda de venta), si no CRC. Es el mismo orden del backend.
 * - SIN sesión: la moneda del país de envío elegido en el diálogo de
 *   bienvenida (cookie de preferencias); si no eligió, la del navegador.
 *
 * Con sesión, el país de envío ya NO cambia la moneda: solo filtra envíos.
 */

export const DISPLAY_CURRENCY_HEADER = 'X-Display-Currency'

/** Lo que usa el backend cuando no recibe nada. */
export const DEFAULT_DISPLAY_CURRENCY = 'CRC'

export function isSupportedCurrency(code: string | null | undefined): code is string {
  return typeof code === 'string' && SUPPORTED_CURRENCIES.includes(code)
}

export function accountDisplayCurrency(user: Pick<AuthUser, 'displayCurrency' | 'currency'>): string {
  if (isSupportedCurrency(user.displayCurrency)) return user.displayCurrency
  if (isSupportedCurrency(user.currency)) return user.currency
  return DEFAULT_DISPLAY_CURRENCY
}

export function visitorDisplayCurrency(shipTo: string | null): string {
  const currency = shipTo ? currencyOfRegion(shipTo) : detectCurrency()
  return isSupportedCurrency(currency) ? currency : DEFAULT_DISPLAY_CURRENCY
}

// -----------------------------------------------------------------------------
// Valor para el header
// -----------------------------------------------------------------------------
//
// El interceptor de axios vive fuera de React, así que no puede usar hooks.
// DisplayCurrencySync (App.tsx) escribe aquí la moneda ya resuelta. Mientras
// no se sabe si hay sesión queda en null y no se manda el header: el backend
// decide con la cookie de sesión (la preferencia de la cuenta o CRC).

let requestDisplayCurrency: string | null = null

export function getRequestDisplayCurrency(): string | null {
  return requestDisplayCurrency
}

export function setRequestDisplayCurrency(currency: string | null): void {
  requestDisplayCurrency = currency
}
