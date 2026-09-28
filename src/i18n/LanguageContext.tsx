import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { z } from 'zod'
import { useCookie } from '@/cuicui/hooks/use-cookies'
import { detectLanguage, isAppLanguage, type AppLanguage } from '@/utils/locale'
import { de } from './translations/de'
import { en } from './translations/en'
import { es, type TranslationKey } from './translations/es'
import { fr } from './translations/fr'
import { ko } from './translations/ko'
import { pt } from './translations/pt'
import { makeZodErrorMap } from './zodErrorMap'

const LANGUAGE_COOKIE_NAME = 'mynted_language'
const dictionaries = { es, en, de, fr, pt, ko } satisfies Record<AppLanguage, Record<TranslationKey, string>>

interface LanguageContextValue {
  /** Idioma efectivo: el que la persona eligió a mano, o el autodetectado si todavía no eligió ninguno. */
  language: AppLanguage
  /** true solo si la persona ya tocó el selector alguna vez (ver LanguageSwitcher). */
  isManuallySet: boolean
  setLanguage: (lang: AppLanguage) => void
  /** `params` reemplaza placeholders `{{nombre}}` en el texto (ver 'onboarding.selectedCount' para un ejemplo). */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

/** Tipo del `t()` del contexto, exportado para tipar funciones que lo reciben como parámetro (ver authSchemas/createCommunitySchema). */
export type TranslateFn = LanguageContextValue['t']

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useCookie<AppLanguage | null>(LANGUAGE_COOKIE_NAME, null, {
    days: 365,
    sameSite: 'lax',
    secure: true,
  })

  // Si la cookie trae un valor que ya no está soportado (o alguien la editó a
  // mano), se ignora y se vuelve a autodetectar en vez de romper la app.
  const manualLanguage = isAppLanguage(stored) ? stored : null
  const language = manualLanguage ?? detectLanguage()

  // Mantiene <html lang="..."> sincronizado con el idioma de la app: lo usan
  // los lectores de pantalla para la pronunciación, el navegador para elegir
  // fuentes (p. ej. coreano) y el corrector ortográfico de los inputs.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[language]
    const t: TranslateFn = (key, params) => {
      const text = dict[key] ?? dictionaries.es[key] ?? key
      if (!params) return text
      return Object.entries(params).reduce(
        (result, [paramName, paramValue]) => result.replaceAll(`{{${paramName}}}`, String(paramValue)),
        text,
      )
    }

    // Mensajes de Zod para reglas sin mensaje propio (ver zodErrorMap.ts).
    // Se configura acá, durante el render y no en un useEffect, para que ya
    // esté en el idioma nuevo cuando los forms vuelvan a validar con el
    // schema recalculado en este mismo render.
    z.config({ customError: makeZodErrorMap(t) })

    return {
      language,
      isManuallySet: manualLanguage !== null,
      setLanguage: setStored,
      t,
    }
  }, [language, manualLanguage, setStored])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage debe usarse dentro de <LanguageProvider> (ver App.tsx)')
  return ctx
}
