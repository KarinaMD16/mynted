import { Switch } from '@/components/ui/Switch'
import { useUnfavoriteConfirmation } from '@/features/favorites/hooks/useUnfavoriteConfirmation'
import { useLanguage } from '@/i18n/LanguageContext'
import { SettingsCard } from './SettingsCard'

/**
 * Interruptor del aviso "¿Quitar de favoritos?". Es el mismo valor que marca
 * el checkbox "No volver a mostrar" del diálogo, así que aquí se puede volver
 * a activar. Se guarda al instante, en este navegador.
 */
export function FavoritesPreferencesCard() {
  const { t } = useLanguage()
  const { confirmUnfavorite, setConfirmUnfavorite } = useUnfavoriteConfirmation()

  return (
    <SettingsCard title={t('settings.favorites.title')} description={t('settings.favorites.description')}>
      <Switch
        label={t('settings.favorites.confirmLabel')}
        description={t('settings.favorites.confirmDescription')}
        isSelected={confirmUnfavorite}
        onChange={setConfirmUnfavorite}
      />
    </SettingsCard>
  )
}
