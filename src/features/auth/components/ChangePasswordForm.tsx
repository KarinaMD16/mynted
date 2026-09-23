import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { TextField } from '@/components/ui/TextField'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useChangePasswordMutation } from '../hooks/useAuthMutations'
import { makeChangePasswordSchema } from '../schema/authSchemas'

interface ChangePasswordFormProps {
  isOpen: boolean
  onClose: () => void
}

/** Modal de cambiar contraseña, abierto desde "Configuración" en el menú de cuenta (ver AccountMenu / SiteHeader). */
export function ChangePasswordForm({ isOpen, onClose }: ChangePasswordFormProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <ChangePasswordDialogBody onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function ChangePasswordDialogBody({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const [isDone, setIsDone] = useState(false)

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
        setIsDone(true)
      } catch {
        // el hook muestra el error abajo del form
      }
    },
  })

  if (isDone) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('auth.changePassword.successTitle')}</DialogTitle>
          <DialogDescription>{t('auth.changePassword.successBody')}</DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-mynted-orange px-6 py-2.5 font-heading text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover"
          >
            {t('auth.changePassword.done')}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('auth.changePassword.title')}</DialogTitle>
        <DialogDescription>{t('auth.changePassword.subtitle')}</DialogDescription>
      </DialogHeader>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div className="mt-6 flex flex-col gap-4">
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

        {changePasswordMutation.isError && (
          <p className="mt-4 text-right text-sm text-red-500" role="alert">
            {getApiErrorMessage(changePasswordMutation.error)}
          </p>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-mynted-border bg-white px-6 py-2.5 font-heading text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg"
          >
            {t('auth.changePassword.cancel')}
          </button>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || changePasswordMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-mynted-orange px-6 py-2.5 font-heading text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting || changePasswordMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    {t('auth.changePassword.saving')}
                  </>
                ) : (
                  t('auth.changePassword.submit')
                )}
              </button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </>
  )
}
