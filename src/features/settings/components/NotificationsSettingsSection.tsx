import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import { Switch } from '@/components/ui/Switch'
import type { AuthUser } from '@/features/auth/models/auth'
import { useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations'
import { toProfileFormData } from '../hooks/useSavedFlash'
import { SettingsCard } from './SettingsCard'

type NotificationField = 'emailNotifications' | 'pushNotifications'

/**
 * Pestaña "Notificaciones". Cada interruptor guarda al instante con
 * PATCH /users/me (no hay botón de guardar). El backend por defecto deja
 * ambas en true, así que un valor ausente se trata como activado.
 */
export function NotificationsSettingsSection({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const updateProfile = useUpdateProfileMutation()

  // Mientras se guarda, el interruptor ya muestra el valor nuevo.
  const pending = updateProfile.isPending ? updateProfile.variables : undefined
  const pendingValue = (field: NotificationField) => {
    const raw = pending?.get(field)
    return raw === null || raw === undefined ? undefined : raw === 'true'
  }

  const valueOf = (field: NotificationField) => pendingValue(field) ?? user[field] ?? true

  const toggle = (field: NotificationField, value: boolean) => {
    updateProfile.mutate(toProfileFormData({ [field]: value }))
  }

  return (
    <SettingsCard
      title={t('settings.notifications.title')}
      description={t('settings.notifications.description')}
    >
      <div className="flex flex-col divide-y divide-mynted-border">
        <div className="pb-4">
          <Switch
            label={t('settings.notifications.emailLabel')}
            description={t('settings.notifications.emailDescription')}
            isSelected={valueOf('emailNotifications')}
            isDisabled={updateProfile.isPending}
            onChange={(value) => toggle('emailNotifications', value)}
          />
        </div>
        <div className="pt-4">
          <Switch
            label={t('settings.notifications.pushLabel')}
            description={t('settings.notifications.pushDescription')}
            isSelected={valueOf('pushNotifications')}
            isDisabled={updateProfile.isPending}
            onChange={(value) => toggle('pushNotifications', value)}
          />
        </div>
      </div>

      {updateProfile.isError && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {getApiErrorMessage(updateProfile.error)}
        </p>
      )}
    </SettingsCard>
  )
}
