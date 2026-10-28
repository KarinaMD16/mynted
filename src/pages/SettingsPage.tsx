import { ErrorState } from '@/components/errors/ErrorState'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { SignedOutState } from '@/components/errors/QueryErrorState'
import { Bell, Lock, type LucideIcon, Palette, Sparkles, UserRound, UserSquare2 } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Loader } from '@/components/ui/Loader'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { AccountSettingsSection } from '@/features/settings/components/AccountSettingsSection'
import { AppearanceSettingsSection } from '@/features/settings/components/AppearanceSettingsSection'
import { NotificationsSettingsSection } from '@/features/settings/components/NotificationsSettingsSection'
import { PrivacySettingsSection } from '@/features/settings/components/PrivacySettingsSection'
import { ProfileSettingsSection } from '@/features/settings/components/ProfileSettingsSection'
import { SubscriptionSettingsSection } from '@/features/settings/components/SubscriptionSettingsSection'
import { SETTINGS_TABS, type SettingsTab } from '@/features/settings/models/settings'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

const routeApi = getRouteApi('/settings')

const TAB_META: Record<SettingsTab, { labelKey: TranslationKey; icon: LucideIcon }> = {
  account: { labelKey: 'settings.tabs.account', icon: UserRound },
  profile: { labelKey: 'settings.tabs.profile', icon: UserSquare2 },
  appearance: { labelKey: 'settings.tabs.appearance', icon: Palette },
  subscription: { labelKey: 'settings.tabs.subscription', icon: Sparkles },
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
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 pt-8 pb-16')}>
        <header>
          <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-mynted-gray">{t('settings.subtitle')}</p>
        </header>

        {isLoading && (
          <div className="flex justify-center py-24">
            <Loader label={t('settings.loading')} />
          </div>
        )}

        {!isLoading && !isLoggedIn && !isError && <SignedOutState description={t('settings.signedOutSubtitle')} />}

        {!isLoading && (isError || (isLoggedIn && !user)) && (
          <ErrorState kind="error" description={t('profile.loadErrorSubtitle')} />
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
                      isActive ? 'bg-mynted-orange text-white' : 'bg-white text-mynted-ink hover:bg-mynted-orange/15'
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
              {activeTab === 'appearance' && <AppearanceSettingsSection key={user.id} user={user} />}
              {activeTab === 'subscription' && <SubscriptionSettingsSection key={user.id} />}
              {activeTab === 'privacy' && <PrivacySettingsSection key={user.id} user={user} />}
              {activeTab === 'notifications' && <NotificationsSettingsSection key={user.id} user={user} />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
