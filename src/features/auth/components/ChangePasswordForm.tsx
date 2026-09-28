import { useMemo } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'
import { SettingsFormFooter } from '@/features/settings/components/SettingsCard'
import { useSavedFlash } from '@/features/settings/hooks/useSavedFlash'
import { useChangePasswordMutation } from '../hooks/useAuthMutations'
import { makeChangePasswordSchema } from '../schema/authSchemas'

/**
 * Formulario de cambiar contraseña (POST /auth/change-password). Vive en la
 * pestaña Privacidad de /settings (ver PrivacySettingsSection); antes era un
 * modal que se abría desde "Configuración" en el menú de cuenta.
 */
export function ChangePasswordForm() {
  const { t } = useLanguage()
  const saved = useSavedFlash(5000)

  const changePasswordSchema = useMemo(() => makeChangePasswordSchema(t), [t])
  const changePasswordMutation = useChangePasswordMutation()

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await changePasswordMutation.mutateAsync({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        })
        form.reset()
        saved.flash()
      } catch {
        // el error se muestra en el pie del formulario
      }
    },
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <div className="flex flex-col gap-4">
        <form.Field name="currentPassword" validators={{ onChange: changePasswordSchema.shape.currentPassword }}>
          {(field) => (
            <TextField
              label={t('auth.changePassword.currentPasswordLabel')}
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.changePassword.currentPasswordPlaceholder')}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
            />
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="newPassword" validators={{ onChange: changePasswordSchema.shape.newPassword }}>
            {(field) => (
              <TextField
                label={t('auth.changePassword.newPasswordLabel')}
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.changePassword.newPasswordPlaceholder')}
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
                value !== fieldApi.form.getFieldValue('newPassword')
                  ? t('auth.changePassword.passwordsDontMatch')
                  : undefined,
            }}
          >
            {(field) => (
              <TextField
                label={t('auth.changePassword.confirmPasswordLabel')}
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.changePassword.confirmPasswordPlaceholder')}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
        </div>

        {/* Las cuentas creadas con Google/Facebook no tienen contraseña: el
            backend lo rechaza y sugiere crear una desde "Recuperar contraseña". */}
        <p className="text-xs text-mynted-gray">
          {t('settings.privacy.forgotPasswordHint')}{' '}
          <Link to="/forgot-password" className="font-semibold text-mynted-orange hover:underline">
            {t('settings.privacy.forgotPasswordLink')}
          </Link>
        </p>
      </div>

      <SettingsFormFooter
        error={changePasswordMutation.isError ? changePasswordMutation.error : undefined}
        showSaved={saved.isVisible}
        savedLabel={t('auth.changePassword.successBody')}
      >
        <form.Subscribe selector={(state) => [state.canSubmit, state.isDirty] as const}>
          {([canSubmit, isDirty]) => (
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!canSubmit || !isDirty}
              isLoading={changePasswordMutation.isPending}
            >
              {t('auth.changePassword.submit')}
            </Button>
          )}
        </form.Subscribe>
      </SettingsFormFooter>
    </form>
  )
}
