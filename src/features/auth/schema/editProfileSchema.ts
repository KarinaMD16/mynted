import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'

/**
 * Espeja las reglas de UpdateProfileDto en el backend (username 3-20
 * caracteres alfanuméricos + guión bajo; bio ≤500; location ≤100). Es un
 * schema separado de authSchemas.ts porque estos campos solo existen en el
 * formulario de editar perfil (ver EditProfileForm).
 */
export function makeEditProfileSchema(t: TranslateFn) {
  return z.object({
    username: z
      .string()
      .min(1, t('validation.usernameRequired'))
      .min(3, t('validation.usernameMinLength'))
      .max(20, t('validation.usernameMaxLength'))
      .regex(/^[a-zA-Z0-9_]+$/, t('validation.usernameFormat')),
    bio: z.string().max(500, t('validation.bioMaxLength')),
    location: z.string().max(100, t('validation.locationMaxLength')),
  })
}

export type EditProfileValues = z.infer<ReturnType<typeof makeEditProfileSchema>>
