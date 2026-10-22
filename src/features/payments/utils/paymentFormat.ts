import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'

/** Fecha larga de un pago ("21 de octubre de 2026"). */
export function formatPaymentDate(iso: string | null, language: AppLanguage): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(INTL_LOCALES[language], { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Fecha corta para las filas de una tabla ("21/10/2026"). */
export function formatPaymentDateShort(iso: string | null, language: AppLanguage): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(INTL_LOCALES[language], { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Tasa en porcentaje. El backend las manda en fracción (0.045 = 4,5 %) y se
 * muestran con hasta dos decimales: los descuentos por nivel son de medio
 * punto, así que redondear a entero los borraría.
 */
export function formatRate(rate: number, language: AppLanguage): string {
  return new Intl.NumberFormat(INTL_LOCALES[language], {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(rate)
}

/** Los últimos 4 dígitos con la máscara de siempre ("•••• 1234"). */
export function maskedCard(last4: string | null): string {
  return last4 ? `•••• ${last4}` : '—'
}

/**
 * Rango de un tier en texto: "0 – 10", "100 o más". `format` dibuja cada
 * extremo (un número de ventas va tal cual; un rango de precio, con su moneda).
 */
export function formatTierRange(
  minValue: number,
  maxValue: number | null,
  format: (value: number) => string,
  openEndedLabel: (min: string) => string,
): string {
  return maxValue === null ? openEndedLabel(format(minValue)) : `${format(minValue)} – ${format(maxValue)}`
}
