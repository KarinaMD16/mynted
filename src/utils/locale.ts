/**
 * Detección best-effort de locale/moneda/idioma del navegador. No hay forma
 * 100% confiable de inferir la moneda o el idioma "correcto" a partir del
 * locale del navegador, así que sacamos el país del locale y lo cruzamos
 * contra tablas chicas. Cubren los mercados donde Mynted planea lanzar
 * primero; si hace falta un país que no está acá, se agrega a ambas tablas.
 */
const REGION_CURRENCY: Record<string, string> = {
  CR: 'CRC',
  US: 'USD',
  MX: 'MXN',
  PA: 'USD',
  GT: 'GTQ',
  HN: 'HNL',
  SV: 'USD',
  NI: 'NIO',
  CO: 'COP',
  PE: 'PEN',
  CL: 'CLP',
  AR: 'ARS',
  EC: 'USD',
  ES: 'EUR',
}

export type AppLanguage = 'es' | 'en'

/**
 * A qué idioma cae cada región cuando el navegador no manda ni "es" ni "en"
 * como idioma explícito (ver detectLanguage). Todos los mercados de
 * Latinoamérica + España caen en español; el resto (hoy solo US) en inglés.
 */
const REGION_LANGUAGE: Record<string, AppLanguage> = {
  CR: 'es',
  MX: 'es',
  PA: 'es',
  GT: 'es',
  HN: 'es',
  SV: 'es',
  NI: 'es',
  CO: 'es',
  PE: 'es',
  CL: 'es',
  AR: 'es',
  EC: 'es',
  ES: 'es',
  US: 'en',
}

const DEFAULT_LOCALE = 'es-CR'
const DEFAULT_CURRENCY = 'CRC'
const DEFAULT_LANGUAGE: AppLanguage = 'es'

export function detectLocale(): string {
  try {
    return navigator.language || DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

export function detectCurrency(locale: string = detectLocale()): string {
  try {
    const region = new Intl.Locale(locale).maximize().region
    return (region && REGION_CURRENCY[region]) || DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

/**
 * Idioma con el que arranca la app para alguien que todavía no eligió uno a
 * mano (ver LanguageContext, que guarda esa elección aparte y ya no vuelve a
 * llamar esta función una vez que existe). Dos pasos, del más al menos
 * específico:
 *
 * 1. Si el navegador ya manda un idioma soportado ("es-CR", "en-GB", "es",
 *    "en"...) lo usamos directo — es la señal más confiable que hay.
 * 2. Si no (por ejemplo alguien con el sistema operativo en francés o
 *    portugués), inferimos el idioma a partir de la región del locale, con
 *    la misma idea que detectCurrency: alguien ubicado en un país
 *    hispanohablante probablemente prefiera español aunque su navegador
 *    esté en otro idioma.
 *
 * Si ninguna de las dos pistas sirve, se cae a español (mercado de
 * lanzamiento de Mynted).
 */
export function detectLanguage(locale: string = detectLocale()): AppLanguage {
  try {
    const primary = locale.split('-')[0]?.toLowerCase()
    if (primary === 'es' || primary === 'en') return primary

    const region = new Intl.Locale(locale).maximize().region
    return (region && REGION_LANGUAGE[region]) || DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

/**
 * Arma el locale que se manda al backend (ver InterestsStep.buildPayload)
 * cuando la persona eligió un idioma a mano con el selector ES/EN, en vez de
 * dejar que se autodetecte: mantiene la región de su locale de navegador
 * (de ahí sale la moneda, ver detectCurrency) pero reemplaza el idioma por
 * el que eligió. Así, alguien en Costa Rica que cambia la app a inglés
 * queda guardado como "en-CR" — moneda de Costa Rica, idioma inglés — en vez
 * de perder esa elección la próxima vez que el backend/algún reporte lea su
 * locale.
 */
export function buildLocaleTag(language: AppLanguage, baseLocale: string = detectLocale()): string {
  try {
    const region = new Intl.Locale(baseLocale).maximize().region
    return region ? `${language}-${region}` : language
  } catch {
    return language
  }
}
