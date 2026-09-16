import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { SocialButtons } from './SocialButtons'
import { useLoginMutation } from '../hooks/useAuthMutations'
import { makeLoginSchema } from '../schema/authSchemas'

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { t } = useLanguage()
  // Los mensajes de validación son texto de UI: el schema se recalcula si
  // cambia el idioma (ver makeLoginSchema en authSchemas.ts).
  const loginSchema = useMemo(() => makeLoginSchema(t), [t])
  const loginMutation = useLoginMutation()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      // El backend deja la sesión en cookies httpOnly al responder; no hace
      // falta guardar nada más acá. useLoginMutation ya invalida el cache de
      // "usuario actual" para que el header lo recoja de inmediato.
      await loginMutation.mutateAsync(value)
      await navigate({ to: '/' })
    },
  })

  return (
    <form
      className="flex w-full flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
      noValidate
    >
      <div>
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">{t('auth.login.title')}</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">{t('auth.login.subtitle')}</p>
      </div>

      <form.Field name="identifier" validators={{ onChange: loginSchema.shape.identifier }}>
        {(field) => (
          <TextField
            label={t('auth.identifierLabel')}
            type="text"
            autoComplete="username"
            placeholder={t('auth.identifierPlaceholder')}
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="password" validators={{ onChange: loginSchema.shape.password }}>
        {(field) => (
          <TextField
            label={t('auth.passwordLabel')}
            type="password"
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')}
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <button
        type="button"
        onClick={() => void navigate({ to: '/forgot-password' })}
        className="-mt-2 self-end text-xs font-semibold text-mynted-gray hover:cursor-pointer hover:text-mynted-orange hover:underline"
      >
        {t('auth.forgotPasswordLink')}
      </button>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="hover:cursor-pointer" disabled={!canSubmit || loginMutation.isPending}>
            {isSubmitting || loginMutation.isPending ? t('auth.signingIn') : t('auth.login.submit')}
          </Button>
        )}
      </form.Subscribe>

      {loginMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(loginMutation.error)}
        </p>
      )}

      <button
        type="button"
        onClick={onSwitchToRegister}
        className="w-full text-center text-[13px] font-semibold text-mynted-orange  hover:cursor-pointer hover:underline"
      >
        {t('auth.login.switchToRegister')}
      </button>

      <SocialButtons />
    </form>
  )
}
