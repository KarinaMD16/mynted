import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/cuicui/utils/cn'
import { useCookie } from '@/cuicui/hooks/use-cookies'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from './Button'
import { CookieIcon } from './CookieIcon'

interface CookieConsent {
  consent: boolean
  marketing: boolean
}

const DEFAULT_CONSENT: CookieConsent = { consent: false, marketing: false }
const COOKIES_POLICY_PATH = '/legal/cookies'

export function CookieBanner() {
  const { t } = useLanguage()
  const [consent, setConsent] = useCookie<CookieConsent>('mynted_cookie_consent', DEFAULT_CONSENT, {
    days: 365,
    sameSite: 'lax',
    secure: true,
  })
  const [showPreferences, setShowPreferences] = useState(false)
  const [marketingDraft, setMarketingDraft] = useState(consent.marketing)

  function handleAllowAll() {
    setConsent({ consent: true, marketing: true })
  }

  function handleSavePreferences() {
    setConsent({ consent: true, marketing: marketingDraft })
  }

  return (
    <AnimatePresence>
      {!consent.consent && (
        // Envoltorio a pantalla completa solo para centrar la tarjeta; no
        // tiene fondo (no es un modal que bloquee el resto de la página), así
        // que se le quitan los pointer-events y se los devuelve a la tarjeta.
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            role="dialog"
            aria-describedby="cookie-banner-description"
            aria-labelledby="cookie-banner-title"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'pointer-events-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-mynted-border bg-mynted-white p-5',
              'shadow-[0_16px_40px_-8px_rgba(13,13,20,0.18)] sm:p-6',
            )}
          >
            <div className="flex items-start gap-3">
            <CookieIcon className="mt-0.5 size-6 shrink-0 text-mynted-ink" />
            <h2 id="cookie-banner-title" className="font-heading text-base font-semibold text-mynted-ink">
              {t('cookieBanner.title')}
            </h2>
          </div>

          <p id="cookie-banner-description" className="text-sm text-mynted-gray">
            {t('cookieBanner.description')}{' '}
            <Link
              to={COOKIES_POLICY_PATH}
              target="_blank"
              className="font-medium text-mynted-ink underline underline-offset-2 hover:text-mynted-orange"
            >
              {t('cookieBanner.cookiesPolicyLinkText')}
            </Link>{' '}
            {t('cookieBanner.descriptionSuffix')}
          </p>

          {showPreferences && (
            <div className="flex flex-col gap-3 rounded-xl border border-mynted-border bg-mynted-bg p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-mynted-ink">{t('cookieBanner.necessaryTitle')}</p>
                  <p className="text-xs text-mynted-gray">{t('cookieBanner.necessaryDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label={t('cookieBanner.necessaryTitle')}
                  className="size-4 accent-mynted-orange"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-mynted-ink">{t('cookieBanner.marketingTitle')}</p>
                  <p className="text-xs text-mynted-gray">{t('cookieBanner.marketingDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketingDraft}
                  onChange={(event) => setMarketingDraft(event.target.checked)}
                  aria-label={t('cookieBanner.marketingTitle')}
                  className="size-4 accent-mynted-orange hover:cursor-pointer"
                />
              </div>

              <Button
                type="button"
                variant="primary"
                className="self-start"
                onClick={handleSavePreferences}
              >
                {t('cookieBanner.savePreferences')}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" onClick={handleAllowAll}>
              {t('cookieBanner.allowAll')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreferences((prev) => !prev)}
            >
              {showPreferences ? t('cookieBanner.hideOptions') : t('cookieBanner.manageCookies')}
            </Button>
          </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default CookieBanner
