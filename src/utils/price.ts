import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'

/**
 * Precio con el formato del idioma activo. El backend manda los montos como
 * string (columna numeric), asi que tambien se acepta string.
 */
export function formatPrice(price: string | number, currency: string, language: AppLanguage): string {
  const value = typeof price === 'number' ? price : Number(price)
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}
