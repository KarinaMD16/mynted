import { INTL_LOCALES, SUPPORTED_CURRENCIES, type AppLanguage } from './locale'

/**
 * Opciones para un selector de moneda: "Colón costarricense (CRC)", en el
 * idioma de la app. Si el navegador no conoce Intl.DisplayNames, solo el código.
 */
export function currencyOptions(language: AppLanguage): { value: string; label: string }[] {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames(INTL_LOCALES[language], { type: 'currency' })
  } catch {
    names = null
  }
  return SUPPORTED_CURRENCIES.map((code) => {
    const name = names?.of(code)
    return { value: code, label: name && name !== code ? `${name} (${code})` : code }
  })
}
