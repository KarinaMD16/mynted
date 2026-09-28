import { useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Mail01 } from '@untitledui/icons'
import { MailCheck } from 'lucide-react'
import { getFieldErrorMessage } from '@/utils/form'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'
import type { AuthUser } from '@/features/auth/models/auth'
import { useRequestEmailChangeMutation, useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations'
import { makeEmailChangeSchema } from '@/features/auth/schema/authSchemas'
import { makeEditProfileSchema } from '@/features/auth/schema/editProfileSchema'
import { toProfileFormData, useSavedFlash } from '../hooks/useSavedFlash'
import { SettingsCard, SettingsFormFooter, SettingsReadOnlyRow } from './SettingsCard'

/** Pestaña "Cuenta": correo electrónico y datos personales. */
export function AccountSettingsSection({ user }: { user: AuthUser }) {
  return (
    <div className="flex flex-col gap-6">
      <EmailCard user={user} />
      <PersonalDataCard user={user} />
    </div>
  )
}

function formatDate(value: string | null | undefined, language: AppLanguage): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(INTL_LOCALES[language], { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Cambio de correo en dos pasos (ver AuthService.requestEmailChange):
 * aquí solo se pide el enlace, que llega al correo NUEVO. El correo de la
 * cuenta no cambia hasta que se abre ese enlace (ConfirmEmailChangePage).
 */
function EmailCard({ user }: { user: AuthUser }) {
  const { t, language } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const emailChangeSchema = useMemo(() => makeEmailChangeSchema(t), [t])
  const requestEmailChange = useRequestEmailChangeMutation()

  const form = useForm({
    defaultValues: { newEmail: '' },
    validators: { onChange: emailChangeSchema },
    onSubmit: async ({ value }) => {
      const newEmail = value.newEmail.trim()
      try {
        await requestEmailChange.mutateAsync({ newEmail })
        setSentTo(newEmail)
        setIsEditing(false)
        form.reset()
      } catch {
        // el error se muestra en el pie del formulario
      }
    },
  })

  const cancel = () => {
    setIsEditing(false)
    form.reset()
    requestEmailChange.reset()
  }

  return (
    <SettingsCard title={t('settings.account.emailTitle')} description={t('settings.account.emailDescription')}>
      <div className="flex flex-col gap-4 rounded-xl bg-mynted-bg p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-mynted-orange">
            <Mail01 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-mynted-gray uppercase">
              {t('settings.account.currentEmail')}
            </p>
            <p className="truncate text-sm font-semibold text-mynted-ink">{user.email}</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setSentTo(null)
              setIsEditing(true)
            }}
          >
            {t('settings.account.changeEmail')}
          </Button>
        )}
      </div>

      {sentTo && !isEditing && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{t('settings.account.emailSent', { email: sentTo })}</p>
        </div>
      )}

      {isEditing && (
        <form
          noValidate
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <form.Field name="newEmail">
            {(field) => (
              <TextField
                label={t('settings.account.newEmailLabel')}
                type="email"
                autoComplete="email"
                autoFocus
                placeholder={t('settings.account.newEmailPlaceholder')}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
          <p className="mt-2 text-xs text-mynted-gray">{t('settings.account.newEmailHint')}</p>

          <SettingsFormFooter error={requestEmailChange.isError ? requestEmailChange.error : undefined}>
            <Button type="button" variant="secondary" size="md" onClick={cancel}>
              {t('settings.cancel')}
            </Button>
            <form.Subscribe selector={(state) => state.canSubmit}>
              {(canSubmit) => (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!canSubmit}
                  isLoading={requestEmailChange.isPending}
                >
                  {t('settings.account.sendLink')}
                </Button>
              )}
            </form.Subscribe>
          </SettingsFormFooter>
        </form>
      )}

      <div className="mt-5 flex flex-col gap-2.5 border-t border-mynted-border pt-4">
        <SettingsReadOnlyRow label={t('settings.account.memberSince')} value={formatDate(user.createdAt, language)} />
      </div>
    </SettingsCard>
  )
}

/** Nombre de usuario y ubicación (PATCH /users/me). */
function PersonalDataCard({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const updateProfile = useUpdateProfileMutation()
  const saved = useSavedFlash()

  // Solo se validan los dos campos de esta tarjeta; la bio vive en la pestaña Perfil.
  const schema = useMemo(() => makeEditProfileSchema(t).pick({ username: true, location: true }), [t])

  const form = useForm({
    defaultValues: {
      username: user.username,
      location: user.location ?? '',
    },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      try {
        const updated = await updateProfile.mutateAsync(
          toProfileFormData({ username: value.username.trim(), location: value.location.trim() }),
        )
        form.reset({ username: updated.username, location: updated.location ?? '' })
        saved.flash()
      } catch {
        // el error se muestra en el pie del formulario
      }
    },
  })

  return (
    <SettingsCard
      title={t('settings.account.personalTitle')}
      description={t('settings.account.personalDescription')}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="username">
            {(field) => (
              <TextField
                label={t('auth.usernameLabel')}
                autoComplete="username"
                placeholder={t('auth.usernamePlaceholder')}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <TextField
                label={t('profile.edit.locationLabel')}
                autoComplete="address-level2"
                placeholder={t('profile.edit.locationPlaceholder')}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>
        </div>
        <p className="mt-2 text-xs text-mynted-gray">{t('settings.account.usernameHint')}</p>

        <SettingsFormFooter error={updateProfile.isError ? updateProfile.error : undefined} showSaved={saved.isVisible}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isDirty] as const}>
            {([canSubmit, isDirty]) => (
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canSubmit || !isDirty}
                isLoading={updateProfile.isPending}
              >
                {t('settings.save')}
              </Button>
            )}
          </form.Subscribe>
        </SettingsFormFooter>
      </form>
    </SettingsCard>
  )
}
