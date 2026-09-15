import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCookie } from '@/cuicui/hooks/use-cookies'
import { detectLanguage, type AppLanguage } from '@/utils/locale'
import { en } from './translations/en'
import { es, type TranslationKey } from './translations/es'

const LANGUAGE_COOKIE_NAME = 'mynted_language'
const dictionaries = { es, en } satisfies Record<AppLanguage, Record<TranslationKey, string>>

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

  const language = stored ?? detectLanguage()

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[language]
    return {
      language,
      isManuallySet: stored !== null,
      setLanguage: setStored,
      t: (key, params) => {
        const text = dict[key] ?? dictionaries.es[key] ?? key
        if (!params) return text
        return Object.entries(params).reduce(
          (result, [paramName, paramValue]) => result.replaceAll(`{{${paramName}}}`, String(paramValue)),
          text,
        )
      },
    }
  }, [language, stored, setStored])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage debe usarse dentro de <LanguageProvider> (ver App.tsx)')
  return ctx
}
