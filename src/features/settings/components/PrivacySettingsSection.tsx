import { Link } from '@tanstack/react-router'
import { Cookie, FileText, ShieldCheck } from 'lucide-react'
import { useCookie } from '@/cuicui/hooks/use-cookies'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES, regionName } from '@/utils/locale'
import {
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_OPTIONS,
  COOKIES_POLICY_PATH,
  DEFAULT_COOKIE_CONSENT,
  type CookieConsent,
} from '@/utils/cookieConsent'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import type { AuthUser } from '@/features/auth/models/auth'
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'
import { PRIVACY_POLICY_PATH } from '@/features/auth/legal/privacyPolicy'
import { PREFERENCES_COOKIE_NAME, useUserPreferences } from '@/utils/userPreferences'
import { SettingsCard, SettingsReadOnlyRow } from './SettingsCard'

/** Pestaña "Privacidad": contraseña, cookies y políticas aceptadas. */
export function PrivacySettingsSection({ user }: { user: AuthUser }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title={t('settings.privacy.passwordTitle')}
        description={t('settings.privacy.passwordDescription')}
      >
        <ChangePasswordForm />
      </SettingsCard>

      <CookiesCard />
      <LegalCard user={user} />
    </div>
  )
}

/**
 * Las cookies se guardan en el navegador, no en el backend: se edita la
 * misma cookie que escribe el CookieBanner. Cambiarla desde aquí también
 * cuenta como haber respondido el banner.
 */
function CookiesCard() {
  const { t } = useLanguage()
  const [consent, setConsent] = useCookie<CookieConsent>(
    COOKIE_CONSENT_NAME,
    DEFAULT_COOKIE_CONSENT,
    COOKIE_CONSENT_OPTIONS,
  )

  return (
    <SettingsCard title={t('settings.privacy.cookiesTitle')} description={t('settings.privacy.cookiesDescription')}>
      <div className="flex flex-col divide-y divide-mynted-border">
        <div className="pb-4">
          <Switch
            label={t('cookieBanner.necessaryTitle')}
            description={t('cookieBanner.necessaryDescription')}
            isSelected
            isDisabled
          />
        </div>
        <div className="pt-4">
          <Switch
            label={t('cookieBanner.marketingTitle')}
            description={t('cookieBanner.marketingDescription')}
            isSelected={consent.marketing}
            onChange={(marketing) => setConsent({ consent: true, marketing })}
          />
        </div>
      </div>
      <PreferencesCookieDetails />
      <Link
        to={COOKIES_POLICY_PATH}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-mynted-orange hover:underline"
      >
        <Cookie className="size-4" aria-hidden="true" />
        {t('cookieBanner.cookiesPolicyLinkText')}
      </Link>
    </SettingsCard>
  )
}

/**
 * Detalle de la cookie de preferencias (`mynted_preferences`): qué guarda,
 * cuánto dura, los valores actuales y cómo restablecerla. Las preferencias
 * se cambian en el lugar donde se usan (p. ej. pestaña Cuenta > Favoritos).
 */
function PreferencesCookieDetails() {
  const { t, language } = useLanguage()
  const { preferences, isStored, resetPreferences } = useUserPreferences()

  return (
    <div className="mt-5 rounded-xl bg-mynted-bg p-4">
      <h3 className="text-sm font-semibold text-mynted-ink">{t('settings.privacy.preferencesTitle')}</h3>
      <p className="mt-1 text-sm text-mynted-gray">{t('settings.privacy.preferencesDescription')}</p>
      <p className="mt-1 text-xs text-mynted-gray">
        {t('settings.privacy.preferencesCookie', { name: PREFERENCES_COOKIE_NAME })}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <SettingsReadOnlyRow
          label={t('settings.shipTo.title')}
          value={preferences.shipTo ? regionName(preferences.shipTo, language) : t('settings.shipTo.unset')}
        />
        <SettingsReadOnlyRow
          label={t('settings.favorites.confirmLabel')}
          value={t(preferences.confirmUnfavorite ? 'settings.privacy.preferenceOn' : 'settings.privacy.preferenceOff')}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {!isStored && <p className="text-xs text-mynted-gray">{t('settings.privacy.preferencesNone')}</p>}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={resetPreferences}
          disabled={!isStored}
          className="ml-auto"
        >
          {t('settings.privacy.preferencesReset')}
        </Button>
      </div>
    </div>
  )
}

function LegalCard({ user }: { user: AuthUser }) {
  const { t, language } = useLanguage()

  const acceptedAt = user.acceptedPrivacyPolicyAt ? new Date(user.acceptedPrivacyPolicyAt) : null
  const acceptedLabel =
    acceptedAt && !Number.isNaN(acceptedAt.getTime())
      ? acceptedAt.toLocaleDateString(INTL_LOCALES[language], { day: 'numeric', month: 'long', year: 'numeric' })
      : t('settings.privacy.notAccepted')

  return (
    <SettingsCard title={t('settings.privacy.legalTitle')} description={t('settings.privacy.legalDescription')}>
      <div className="flex flex-col gap-2.5">
        <SettingsReadOnlyRow label={t('settings.privacy.acceptedOn')} value={acceptedLabel} />
        {user.privacyPolicyVersion && (
          <SettingsReadOnlyRow label={t('settings.privacy.policyVersion')} value={user.privacyPolicyVersion} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-mynted-border pt-4">
        <Link
          to={PRIVACY_POLICY_PATH}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-mynted-border px-3 text-sm font-semibold text-mynted-ink transition-colors hover:bg-mynted-bg"
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t('settings.privacy.privacyPolicyLink')}
        </Link>
        <Link
          to={COOKIES_POLICY_PATH}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-mynted-border px-3 text-sm font-semibold text-mynted-ink transition-colors hover:bg-mynted-bg"
        >
          <FileText className="size-4" aria-hidden="true" />
          {t('cookieBanner.cookiesPolicyLinkText')}
        </Link>
      </div>
    </SettingsCard>
  )
}
