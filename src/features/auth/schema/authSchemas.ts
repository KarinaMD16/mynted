import { z } from 'zod'
import type { TranslateFn } from '@/i18n/LanguageContext'

/**
 * Los schemas se arman con una función `makeXSchema(t)` en vez de ser
 * objetos estáticos, porque los mensajes de validación son texto que el
 * usuario ve — tienen que cambiar con el idioma igual que cualquier otro
 * string de la UI. Cada form (LoginForm, RegisterForm, etc.) llama a su
 * make*Schema con el `t` de useLanguage() y lo recalcula si el idioma
 * cambia (ver el `useMemo` en cada componente).
 */

function buildEmailSchema(t: TranslateFn) {
  return z.string().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid'))
}

function buildPasswordSchema(t: TranslateFn) {
  return z
    .string()
    .min(1, t('validation.passwordRequired'))
    .min(8, t('validation.passwordMinLength'))
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9\W])/, t('validation.passwordComplexity'))
}

function buildUsernameSchema(t: TranslateFn) {
  return z.string().min(1, t('validation.usernameRequired')).min(3, t('validation.usernameMinLength'))
}

/**
 * `identifier` acepta username o email (ver LoginDto en el backend), así
 * que a propósito no se valida como email — solo que no venga vacío.
 */
export function makeLoginSchema(t: TranslateFn) {
  return z.object({
    identifier: z.string().min(1, t('validation.identifierRequired')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
}

export function makeRegisterSchema(t: TranslateFn) {
  return z.object({
    email: buildEmailSchema(t),
    username: buildUsernameSchema(t),
    password: buildPasswordSchema(t),
  })
}

export function makeForgotPasswordSchema(t: TranslateFn) {
  return z.object({
    email: buildEmailSchema(t),
  })
}

/** Cambio de correo desde /settings (ver AccountSettingsSection). */
export function makeEmailChangeSchema(t: TranslateFn) {
  return z.object({
    newEmail: buildEmailSchema(t),
  })
}

export function makeResetPasswordSchema(t: TranslateFn) {
  return z.object({
    newPassword: buildPasswordSchema(t),
  })
}

/**
 * Igual que makeResetPasswordSchema: `confirmPassword` no viaja al backend
 * (ChangePasswordPayload no lo tiene) y por eso no vive acá — se valida a
 * mano en el form con un field validator `onChangeListenTo`, como hace
 * ResetPasswordForm.
 */
export function makeChangePasswordSchema(t: TranslateFn) {
  return z.object({
    currentPassword: z.string().min(1, t('validation.passwordRequired')),
    newPassword: buildPasswordSchema(t),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof makeLoginSchema>>
export type RegisterFormValues = z.infer<ReturnType<typeof makeRegisterSchema>>
export type ForgotPasswordFormValues = z.infer<ReturnType<typeof makeForgotPasswordSchema>>
export type ResetPasswordFormValues = z.infer<ReturnType<typeof makeResetPasswordSchema>>
export type ChangePasswordFormValues = z.infer<ReturnType<typeof makeChangePasswordSchema>>
