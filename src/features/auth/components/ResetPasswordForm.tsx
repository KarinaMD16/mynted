import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { useResetPasswordMutation } from '../hooks/useAuthMutations'
import { makeResetPasswordSchema } from '../schema/authSchemas'

interface ResetPasswordFormProps {
  /** Token de recuperación leído del query param `?token=` del link enviado por correo. */
  token: string | undefined
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useLanguage()
  const resetPasswordSchema = useMemo(() => makeResetPasswordSchema(t), [t])
  const navigate = useNavigate()
  const resetPasswordMutation = useResetPasswordMutation()
  const [isDone, setIsDone] = useState(false)

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (!token) return
      await resetPasswordMutation.mutateAsync({ token, newPassword: value.newPassword })
      setIsDone(true)
    },
  })

  if (!token) {
    return (
      <div className="flex w-full flex-col gap-3.5">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">
            {t('auth.resetPassword.invalidLinkTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-mynted-gray">{t('auth.resetPassword.invalidLinkBody')}</p>
        </div>

        <Button
          type="button"
          className="hover:cursor-pointer"
          onClick={() => void navigate({ to: '/forgot-password' })}
        >
          {t('auth.resetPassword.requestNewLink')}
        </Button>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="flex w-full flex-col gap-3.5">
        <div>
          <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">
            {t('auth.resetPassword.doneTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-mynted-gray">{t('auth.resetPassword.doneBody')}</p>
        </div>

        <Button type="button" className="hover:cursor-pointer" onClick={() => void navigate({ to: '/login' })}>
          {t('auth.resetPassword.goToSignIn')}
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
        <h1 className="font-heading text-[24px] font-semibold text-mynted-ink">{t('auth.resetPassword.title')}</h1>
        <p className="mt-1.5 text-sm text-mynted-gray">{t('auth.resetPassword.subtitle')}</p>
      </div>

      <form.Field name="newPassword" validators={{ onChange: resetPasswordSchema.shape.newPassword }}>
        {(field) => (
          <TextField
            label={t('auth.resetPassword.newPasswordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ['newPassword'],
          onChange: ({ value, fieldApi }) =>
            value !== fieldApi.form.getFieldValue('newPassword') ? t('auth.resetPassword.passwordsDontMatch') : undefined,
        }}
      >
        {(field) => (
          <TextField
            label={t('auth.resetPassword.confirmPasswordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
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
            disabled={!canSubmit || resetPasswordMutation.isPending}
          >
            {isSubmitting || resetPasswordMutation.isPending
              ? t('auth.resetPassword.updating')
              : t('auth.resetPassword.submit')}
          </Button>
        )}
      </form.Subscribe>

      {resetPasswordMutation.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {getApiErrorMessage(resetPasswordMutation.error)}
        </p>
      )}
    </form>
  )
}
