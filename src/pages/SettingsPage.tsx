import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { Bell, Lock, type LucideIcon, UserRound, UserSquare2 } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Loader } from '@/components/ui/Loader'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { AccountSettingsSection } from '@/features/settings/components/AccountSettingsSection'
import { NotificationsSettingsSection } from '@/features/settings/components/NotificationsSettingsSection'
import { PrivacySettingsSection } from '@/features/settings/components/PrivacySettingsSection'
import { ProfileSettingsSection } from '@/features/settings/components/ProfileSettingsSection'
import { SETTINGS_TABS, type SettingsTab } from '@/features/settings/models/settings'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'

const routeApi = getRouteApi('/settings')

const TAB_META: Record<SettingsTab, { labelKey: TranslationKey; icon: LucideIcon }> = {
  account: { labelKey: 'settings.tabs.account', icon: UserRound },
  profile: { labelKey: 'settings.tabs.profile', icon: UserSquare2 },
  privacy: { labelKey: 'settings.tabs.privacy', icon: Lock },
  notifications: { labelKey: 'settings.tabs.notifications', icon: Bell },
}

/**
 * /settings — ajustes de la cuenta, en pestañas. La pestaña activa va en la
 * URL (?tab=) para poder enlazar directo a una (p. ej. "Editar perfil" en
 * /profile lleva a ?tab=profile).
 */
export default function SettingsPage() {
  const { t } = useLanguage()
  const { tab: activeTab } = routeApi.useSearch()
  const navigate = useNavigate({ from: '/settings' })
  const { isLoggedIn, data: user, isLoading, isError } = useCurrentUser()

  const selectTab = (tab: SettingsTab) => {
    void navigate({ search: { tab }, replace: true })
  }

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-mynted-gray">{t('settings.subtitle')}</p>
        </header>

        {isLoading && (
          <div className="flex justify-center py-24">
            <Loader label={t('settings.loading')} />
          </div>
        )}

        {!isLoading && !isLoggedIn && !isError && <SignedOutState />}

        {!isLoading && (isError || (isLoggedIn && !user)) && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white py-24 text-center">
            <h2 className="font-heading text-xl font-semibold text-mynted-ink">{t('profile.loadErrorTitle')}</h2>
            <p className="max-w-sm text-sm text-mynted-gray">{t('profile.loadErrorSubtitle')}</p>
          </div>
        )}

        {user && (
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            {/* En mobile las pestañas van en fila con scroll horizontal; en desktop, como menú lateral. */}
            <nav
              role="tablist"
              aria-label={t('settings.title')}
              className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0 lg:pb-0"
            >
              {SETTINGS_TABS.map((tab) => {
                const { labelKey, icon: Icon } = TAB_META[tab]
                const isActive = activeTab === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    id={`settings-tab-${tab}`}
                    aria-selected={isActive}
                    aria-controls={`settings-panel-${tab}`}
                    onClick={() => selectTab(tab)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-semibold whitespace-nowrap transition-colors ${
                      isActive ? 'bg-mynted-orange text-white' : 'bg-white text-mynted-ink hover:bg-mynted-border/40'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(labelKey)}
                  </button>
                )
              })}
            </nav>

            <div role="tabpanel" id={`settings-panel-${activeTab}`} aria-labelledby={`settings-tab-${activeTab}`}>
              {/* key: al cambiar de usuario (otra sesión) los formularios arrancan de cero. */}
              {activeTab === 'account' && <AccountSettingsSection key={user.id} user={user} />}
              {activeTab === 'profile' && <ProfileSettingsSection key={user.id} user={user} />}
              {activeTab === 'privacy' && <PrivacySettingsSection key={user.id} user={user} />}
              {activeTab === 'notifications' && <NotificationsSettingsSection key={user.id} user={user} />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SignedOutState() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-mynted-border bg-white py-24 text-center">
      <h2 className="font-heading text-xl font-semibold text-mynted-ink">{t('settings.signedOutTitle')}</h2>
      <p className="max-w-sm text-sm text-mynted-gray">{t('settings.signedOutSubtitle')}</p>
      <Link
        to="/login"
        className="mt-2 rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
      >
        {t('profile.goToLogin')}
      </Link>
    </div>
  )
}
