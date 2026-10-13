import { INTL_LOCALES, type AppLanguage } from './locale'

/** Precio con su moneda en el idioma de la app; si Intl no reconoce el código de moneda, se muestra tal cual. */
export function formatPrice(price: string | number, currency: string, language: AppLanguage): string {
  const value = typeof price === 'number' ? price : Number(price)
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}
