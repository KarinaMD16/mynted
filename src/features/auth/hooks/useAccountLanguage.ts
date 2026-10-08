import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import myntedAPI from '@/api/apiConfig'
import { useLanguage } from '@/i18n/LanguageContext'
import { buildLocaleTag, isAppLanguage, type AppLanguage } from '@/utils/locale'
import type { AuthUser } from '../models/auth'
import { authKeys } from './useAuthMutations'
import { useCurrentUser } from './useCurrentUser'

/** Idioma soportado de un locale de la cuenta ("es-CR" → "es"), o null si no es uno de los nuestros. */
function languageOfLocale(locale: string | null | undefined): AppLanguage | null {
  const primary = locale?.split('-')[0]?.toLowerCase()
  return isAppLanguage(primary) ? primary : null
}

/**
 * Cambiar el idioma de la app. Siempre queda en la cookie del navegador y,
 * si hay sesión, también en la cuenta (`locale` de PATCH /users/me), para que
 * la próxima vez que la persona entre desde otro navegador o dispositivo la
 * app arranque en su idioma (ver AccountLanguageSync). Si guardar en la cuenta
 * falla, el idioma igual cambia en este navegador.
 */
export function useChangeLanguage() {
  const { language, setLanguage } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const queryClient = useQueryClient()
  const saveLocale = useMutation({
    mutationFn: async (locale: string) => {
      const formData = new FormData()
      formData.append('locale', locale)
      const { data } = await myntedAPI.patch<AuthUser>('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (user) => queryClient.setQueryData<AuthUser>(authKeys.me, user),
  })

  return useCallback(
    (next: AppLanguage) => {
      if (next === language) return
      setLanguage(next)
      if (isLoggedIn) saveLocale.mutate(buildLocaleTag(next))
    },
    [language, setLanguage, isLoggedIn, saveLocale],
  )
}

/**
 * Al iniciar sesión en un navegador donde la persona todavía no eligió idioma
 * a mano, adopta el idioma guardado en su cuenta. Si ya eligió uno en este
 * navegador, ese gana (y se guarda en la cuenta al cambiarlo, ver
 * useChangeLanguage). Solo corre una vez por cuenta y sesión de la página.
 */
export function useAdoptAccountLanguage() {
  const { setLanguage, isManuallySet } = useLanguage()
  const { data: user } = useCurrentUser()
  const adoptedFor = useRef<string | null>(null)

  const accountLanguage = languageOfLocale(user?.locale)
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId || adoptedFor.current === userId) return
    adoptedFor.current = userId
    if (!isManuallySet && accountLanguage) setLanguage(accountLanguage)
  }, [userId, accountLanguage, isManuallySet, setLanguage])
}
