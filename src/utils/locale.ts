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
  // Mercados de los idiomas agregados (alemán, francés, portugués, coreano)
  DE: 'EUR',
  AT: 'EUR',
  CH: 'CHF',
  LI: 'CHF',
  FR: 'EUR',
  BE: 'EUR',
  LU: 'EUR',
  MC: 'EUR',
  BR: 'BRL',
  PT: 'EUR',
  AO: 'AOA',
  MZ: 'MZN',
  KR: 'KRW',
}

/**
 * Monedas que se pueden elegir en /settings (pestaña Perfil, vendedores):
 * las mismas de REGION_CURRENCY, sin repetir y en orden alfabético.
 */
export const SUPPORTED_CURRENCIES: string[] = [...new Set(Object.values(REGION_CURRENCY))].sort()

/**
 * Idiomas soportados por la app. El orden es el que se muestra en el
 * selector de idioma (ver LanguageSwitcher).
 */
export const SUPPORTED_LANGUAGES = ['es', 'en', 'de', 'fr', 'pt', 'ko'] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Nombre de cada idioma escrito en ese mismo idioma (endónimo). Así la
 * persona reconoce el suyo en el selector aunque la app esté en otro idioma
 * que no entiende — por eso NO sale del diccionario de traducciones.
 */
export const LANGUAGE_NATIVE_NAMES: Record<AppLanguage, string> = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
  ko: '한국어',
}

/**
 * Locale completo que usan los formateadores Intl (fechas, "hace 5 minutos")
 * para cada idioma. Portugués va con la variante de Brasil, igual que su
 * diccionario (ver translations/pt.ts).
 */
export const INTL_LOCALES: Record<AppLanguage, string> = {
  es: 'es-CR',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  pt: 'pt-BR',
  ko: 'ko-KR',
}

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * A qué idioma cae cada región cuando el navegador no manda ninguno de los
 * idiomas soportados como idioma explícito (ver detectLanguage). Todos los
 * mercados de Latinoamérica + España caen en español; US en inglés; y los
 * países donde el idioma mayoritario es alemán, francés, portugués o coreano
 * caen en ese idioma. Países multilingües (Suiza, Bélgica) van con el idioma
 * con más hablantes.
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
  DE: 'de',
  AT: 'de',
  CH: 'de',
  LI: 'de',
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  MC: 'fr',
  BR: 'pt',
  PT: 'pt',
  AO: 'pt',
  MZ: 'pt',
  KR: 'ko',
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

/** Lista de preferencia de idiomas del navegador, de la más a la menos preferida. */
function detectLocales(): string[] {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language]
    return list.filter(Boolean)
  } catch {
    return []
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

/** Idioma soportado de un locale ("pt-BR" → "pt", "ko" → "ko"), o null si no es uno de los nuestros. */
function languageOf(locale: string): AppLanguage | null {
  const primary = locale.split('-')[0]?.toLowerCase()
  return isAppLanguage(primary) ? primary : null
}

/**
 * Idioma con el que arranca la app para alguien que todavía no eligió uno a
 * mano (ver LanguageContext, que guarda esa elección aparte y ya no vuelve a
 * llamar esta función una vez que existe). Tres pasos, del más al menos
 * específico:
 *
 * 1. Si el locale principal del navegador ya es un idioma soportado
 *    ("es-CR", "en-GB", "de-AT", "fr", "pt-BR", "ko-KR"...) lo usamos
 *    directo — es la señal más confiable que hay.
 * 2. Si no, recorremos el resto de idiomas preferidos del navegador
 *    (navigator.languages) y tomamos el primero soportado. Por ejemplo,
 *    alguien con el navegador en ["it-IT", "fr-FR"] ve la app en francés.
 * 3. Si ninguno sirve (por ejemplo alguien con todo en italiano o japonés),
 *    inferimos el idioma a partir de la región del locale, con la misma idea
 *    que detectCurrency: alguien ubicado en Brasil probablemente prefiera
 *    portugués aunque su navegador esté en otro idioma.
 *
 * Si ninguna de las pistas sirve, se cae a español (mercado de lanzamiento
 * de Mynted).
 */
export function detectLanguage(locale: string = detectLocale(), preferred: string[] = detectLocales()): AppLanguage {
  try {
    const direct = languageOf(locale)
    if (direct) return direct

    for (const candidate of preferred) {
      const lang = languageOf(candidate)
      if (lang) return lang
    }

    const region = new Intl.Locale(locale).maximize().region
    return (region && REGION_LANGUAGE[region]) || DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

/**
 * Arma el locale que se manda al backend (ver InterestsStep.buildPayload)
 * cuando la persona eligió un idioma a mano con el selector de idioma, en vez
 * de dejar que se autodetecte: mantiene la región de su locale de navegador
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
