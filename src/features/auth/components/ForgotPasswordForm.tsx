import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { useForgotPasswordMutation } from '../hooks/useAuthMutations'
import { makeForgotPasswordSchema } from '../schema/authSchemas'

export function ForgotPasswordForm() {
  const { t } = useLanguage()
  const forgotPasswordSchema = useMemo(() => makeForgotPasswordSchema(t), [t])
  const navigate = useNavigate()
  const forgotPasswordMutation = useForgotPasswordMutation()
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      await forgotPasswordMutation.mutateAsync(value)
      setSubmittedEmail(value.email)
    },
  })

  // El backend siempre responde con un mensaje genérico (nunca dice si el
  // email existe o no, para no filtrar cuentas registradas), así que la
  // pantalla de "listo" es la misma sin importar el resultado real.
  if (submittedEmail) {
    // t() sin params deja el placeholder literal ("{{email}}") en el texto;
    // lo partimos ahí para poder envolver el correo en su propio <span> en
    // negrita, en vez de perder el énfasis metiéndolo como string plano.
    const [beforeEmail, afterEmail] = t('auth.forgotPassword.checkEmailBody').split('{{email}}')
    return (
      <div className="flex w-full flex-col gap-3.5">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">
            {t('auth.forgotPassword.checkEmailTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-mynted-gray">
            {beforeEmail}
            <span className="font-semibold text-mynted-ink">{submittedEmail}</span>
            {afterEmail}
          </p>
        </div>

        <Button type="button" className="hover:cursor-pointer" onClick={() => void navigate({ to: '/login' })}>
          {t('auth.forgotPassword.backToSignIn')}
        </Button>
      </div>
    )
  }

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
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">{t('auth.forgotPassword.title')}</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">{t('auth.forgotPassword.subtitle')}</p>
      </div>

      <form.Field name="email" validators={{ onChange: forgotPasswordSchema.shape.email }}>
        {(field) => (
          <TextField
            label={t('auth.emailLabel')}
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            className="hover:cursor-pointer"
            disabled={!canSubmit || forgotPasswordMutation.isPending}
          >
            {isSubmitting || forgotPasswordMutation.isPending
              ? t('auth.forgotPassword.sending')
              : t('auth.forgotPassword.submit')}
          </Button>
        )}
      </form.Subscribe>

      {forgotPasswordMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(forgotPasswordMutation.error)}
        </p>
      )}

      <button
        type="button"
        onClick={() => void navigate({ to: '/login' })}
        className="w-full text-center text-[13px] font-semibold text-mynted-orange hover:cursor-pointer hover:underline"
      >
        {t('auth.forgotPassword.backToSignIn')}
      </button>
    </form>
  )
}
