import { Select } from '@/components/ui/Select'
import { useShipTo } from '@/features/region/hooks/useShipTo'
import { useLanguage } from '@/i18n/LanguageContext'
import { currencyOfRegion } from '@/utils/locale'
import { SettingsCard } from './SettingsCard'

/**
 * País al que la persona recibe sus compras. Es el mismo valor que pregunta el
 * diálogo de bienvenida; se guarda al instante en la cookie de preferencias.
 */
export function ShipToPreferencesCard() {
  const { t } = useLanguage()
  const { shipTo, setShipTo, options } = useShipTo()

  return (
    <SettingsCard title={t('settings.shipTo.title')} description={t('settings.shipTo.description')}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-ship-to" className="text-[13px] font-medium text-mynted-ink">
          {t('shipTo.countryLabel')}
        </label>
        <Select
          id="settings-ship-to"
          value={shipTo ?? ''}
          options={options}
          placeholder={t('settings.shipTo.unset')}
          onChange={setShipTo}
        />
        {shipTo && <p className="text-xs text-mynted-gray">{t('shipTo.currencyNote', { currency: currencyOfRegion(shipTo) })}</p>}
      </div>
    </SettingsCard>
  )
}
