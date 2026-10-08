import { useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCookie } from '@/cuicui/hooks/use-cookies'
import { useLanguage } from '@/i18n/LanguageContext'
import { COOKIE_CONSENT_NAME, COOKIE_CONSENT_OPTIONS, DEFAULT_COOKIE_CONSENT, type CookieConsent } from '@/utils/cookieConsent'
import { currencyOfRegion } from '@/utils/locale'
import { useShipTo } from '../hooks/useShipTo'

const DISMISSED_KEY = 'mynted_shipto_dismissed'

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Al entrar, pregunta a qué país se envían las compras ("¿Dónde recibes tus
 * compras?") para no depender del idioma del navegador: el país elegido manda
 * la moneda de referencia de los precios (ver useDisplayCurrency). Arranca con
 * el país detectado. Solo aparece si todavía no eligió uno, y después de
 * resolver el banner de cookies para no apilar avisos. "Ahora no" lo oculta
 * solo durante esta visita.
 */
export function ShipToDialog() {
  const { t } = useLanguage()
  const { shipTo, setShipTo, options, detectedRegion } = useShipTo()
  const [consent] = useCookie<CookieConsent>(COOKIE_CONSENT_NAME, DEFAULT_COOKIE_CONSENT, COOKIE_CONSENT_OPTIONS)
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [draft, setDraft] = useState<string | null>(null)

  const isOpen = consent.consent && shipTo === null && !dismissed
  const selected = draft ?? detectedRegion

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // sin sessionStorage: se oculta igual mientras no se recargue la página
    }
    setDismissed(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-1 grid size-11 place-items-center rounded-full bg-mynted-orange/10 text-mynted-orange">
            <Globe className="size-5" aria-hidden="true" />
          </span>
          <DialogTitle className="text-xl">{t('shipTo.title')}</DialogTitle>
          <DialogDescription>{t('shipTo.description')}</DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-1.5">
          <label htmlFor="ship-to-country" className="text-[13px] font-medium text-mynted-ink">
            {t('shipTo.countryLabel')}
          </label>
          <Select
            id="ship-to-country"
            value={selected}
            options={options}
            placeholder={t('shipTo.countryPlaceholder')}
            onChange={setDraft}
          />
          <span className="text-xs text-mynted-gray">{t('shipTo.currencyNote', { currency: currencyOfRegion(selected) })}</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" size="md" onClick={dismiss}>
            {t('shipTo.later')}
          </Button>
          <Button type="button" variant="primary" size="md" onClick={() => setShipTo(selected)}>
            {t('shipTo.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
