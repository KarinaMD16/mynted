import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import type { AuthUser } from '@/features/auth/models/auth'
import { useUpdateProfileMutation } from '@/features/auth/hooks/useAuthMutations'
import { useLanguage } from '@/i18n/LanguageContext'
import { accountDisplayCurrency } from '@/utils/displayCurrency'
import { INTL_LOCALES, SUPPORTED_CURRENCIES } from '@/utils/locale'
import { toProfileFormData, useSavedFlash } from '../hooks/useSavedFlash'
import { SettingsCard, SettingsFormFooter } from './SettingsCard'

/**
 * Moneda en la que la persona VE los precios (`displayCurrency` de PATCH
 * /users/me). Es distinta de la moneda de venta del vendedor (`currency`, ver
 * CurrencyForm en la pestaña Perfil): esta solo cambia cómo se muestran los
 * precios; cada compra se sigue cobrando en la moneda del producto.
 * Al guardar, DisplayCurrencySync (App.tsx) vuelve a pedir los productos.
 */
export function DisplayCurrencyCard({ user }: { user: AuthUser }) {
  const { t, language } = useLanguage()
  const updateProfile = useUpdateProfileMutation()
  const saved = useSavedFlash()
  // Si nunca la eligió, arranca en la que ya se le está mostrando (su moneda de cuenta o CRC).
  const [currency, setCurrency] = useState(() => accountDisplayCurrency(user))

  const options = useMemo(() => {
    let names: Intl.DisplayNames | null = null
    try {
      names = new Intl.DisplayNames(INTL_LOCALES[language], { type: 'currency' })
    } catch {
      names = null
    }
    return SUPPORTED_CURRENCIES.map((code) => {
      const name = names?.of(code)
      return { value: code, label: name && name !== code ? `${name} (${code})` : code }
    })
  }, [language])

  // La que se le está mostrando ahora: si no cambió, no hay nada que guardar.
  const shownCurrency = accountDisplayCurrency(user)

  const save = () => {
    updateProfile.mutate(toProfileFormData({ displayCurrency: currency }), { onSuccess: () => saved.flash() })
  }

  return (
    <SettingsCard title={t('settings.displayCurrency.title')} description={t('settings.displayCurrency.description')}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-display-currency" className="text-[13px] font-medium text-mynted-ink">
          {t('settings.displayCurrency.label')}
        </label>
        <Select
          id="settings-display-currency"
          className="sm:max-w-sm"
          value={currency}
          options={options}
          placeholder={t('settings.profile.currencyPlaceholder')}
          onChange={setCurrency}
        />
        <p className="text-xs text-mynted-gray">{t('settings.displayCurrency.hint')}</p>
      </div>

      <SettingsFormFooter error={updateProfile.isError ? updateProfile.error : undefined} showSaved={saved.isVisible}>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={currency === shownCurrency}
          isLoading={updateProfile.isPending}
          onClick={save}
        >
          {t('settings.save')}
        </Button>
      </SettingsFormFooter>
    </SettingsCard>
  )
}
