import { Link, useRouterState } from '@tanstack/react-router'
import { Bell01, LayoutAlt01, Menu02, Settings01, User01, LogOut01, X as CloseIcon } from '@untitledui/icons'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Popover as AriaPopover,
} from 'react-aria-components'
import { GooseIcon } from '../ui/GooseIcon'
import { SearchBar } from '../ui/SearchBar'
import { Logo } from '../ui/Logo'
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { Navigation } from '../ui/Navigation'
import { NAV_ITEMS } from '../ui/navItems'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import { BlurAppear } from '@/components/ui/BlurAppear'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { AccountControl } from './AccountControl'
import { MenuItem } from './menuPrimitives'
import { useAccountActions } from './useAccountActions'

const navItemBaseClass =
  'rounded-[10px] px-4 py-[9px] text-[15px] font-medium whitespace-nowrap text-mynted-gray transition-colors hover:bg-mynted-orange hover:text-mynted-white'

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { data: currentUser, isLoggedIn, isLoading } = useCurrentUser()

  return (
    <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 rounded-2xl border border-mynted-border bg-mynted-white px-4 py-3.5 sm:px-6 lg:px-12 lg:py-[18px]">
      <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
      <Logo ver='small'/>
      </Link>

      <Navigation className="hidden items-center gap-1.5 lg:flex lg:flex-wrap" />

      {/* Acciones de escritorio */}
      <div className="hidden shrink-0 items-center gap-3.5 lg:flex">
        <SearchBar />
        <LanguageSwitcher />
        <NotificationsMenu />
        <AccountControl isLoading={isLoading} isLoggedIn={isLoggedIn} userName={currentUser?.username} />
      </div>

      {/* Acciones compactas (mobile / tablet) */}
      <div className="flex shrink-0 items-center gap-2 lg:hidden">
        <NotificationsMenu />
        <MobileMenuTrigger isLoggedIn={isLoggedIn} userName={currentUser?.username} pathname={pathname} />
      </div>
    </header>
  )
}

function NotificationsMenu() {
  const { t } = useLanguage()

  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label={t('header.notifications')}
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mynted-border bg-mynted-blue-mid text-mynted-white outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:opacity-80"
      >
        <Bell01 className="size-[22px]" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog className="w-72 rounded-xl border border-mynted-border bg-mynted-white p-4 shadow-lg outline-none">
          <BlurAppear>
            <p className="text-sm font-semibold text-mynted-ink">{t('header.notifications')}</p>
            <p className="mt-2 text-sm text-mynted-gray">{t('header.notificationsEmpty')}</p>
          </BlurAppear>
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}

/** Botón hamburguesa + drawer con nav, búsqueda y acciones de cuenta, para pantallas menores a `lg`. */
function MobileMenuTrigger({
  isLoggedIn,
  userName,
  pathname,
}: {
  isLoggedIn: boolean
  userName?: string
  pathname: string
}) {
  const { t } = useLanguage()
  const { logout, goToProfile, goToSettings, goToAdmin, isLoggingOut } = useAccountActions()
  const isSuperAdmin = useCurrentUser().data?.role === 'superadmin'

  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label={t('header.openMenu')}
        className="group flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mynted-border text-mynted-ink outline-none transition-colors hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:bg-mynted-bg"
      >
        <Menu02 className="size-5 transition-opacity duration-150 ease-in-out group-aria-expanded:opacity-0" aria-hidden="true" />
        <CloseIcon
          className="absolute size-5 opacity-0 transition-opacity duration-150 ease-in-out group-aria-expanded:opacity-100"
          aria-hidden="true"
        />
      </AriaButton>

      <AriaModalOverlay
        isDismissable
        className={({ isEntering, isExiting }) =>
          [
            'fixed inset-0 z-50 bg-mynted-ink/40 backdrop-blur-[2px]',
            isEntering && 'duration-200 ease-out animate-in fade-in',
            isExiting && 'duration-150 ease-in animate-out fade-out',
          ]
            .filter(Boolean)
            .join(' ')
        }
      >
        {({ state }) => (
          <AriaModal
            className={({ isEntering, isExiting }) =>
              [
                'fixed inset-y-0 right-0 flex h-dvh w-full max-w-[340px] will-change-transform outline-none',
                isEntering && 'duration-200 ease-out animate-in slide-in-from-right',
                isExiting && 'duration-150 ease-in animate-out slide-out-to-right',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <AriaDialog className="flex h-full w-full flex-col overflow-y-auto bg-mynted-white outline-none">
              <div className="flex items-center justify-between border-b border-mynted-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <GooseIcon className="size-7 shrink-0 text-mynted-orange" />
                  <span className="font-heading text-lg font-semibold text-mynted-blue-mid">mynted</span>
                </div>
                <AriaButton
                  aria-label={t('header.closeMenu')}
                  onPress={() => state.close()}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full text-mynted-gray outline-none transition-colors hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
                >
                  <CloseIcon className="size-5" aria-hidden="true" />
                </AriaButton>
              </div>

              <div className="px-5 pt-4">
                <SearchBar />
              </div>

              <div className="px-5 pt-4">
                <LanguageSwitcher className="w-fit" />
              </div>

              <nav className="px-3 pt-4">
                <ul className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => state.close()}
                          className={`block ${navItemBaseClass} ${isActive ? 'bg-mynted-orange font-semibold text-mynted-white' : ''}`}
                        >
                          {t(item.labelKey)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="mt-auto border-t border-mynted-border p-3">
                {isLoggedIn ? (
                  <>
                    <div className="mb-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mynted-orange">
                        <GooseIcon className="size-5 text-mynted-white" />
                      </span>
                      <span className="text-sm font-semibold text-mynted-ink">{userName ?? t('header.account')}</span>
                    </div>
                    {isSuperAdmin ? (
                      <MenuItem
                        icon={LayoutAlt01}
                        label={t('admin.menu.open')}
                        onPress={() => {
                          state.close()
                          goToAdmin()
                        }}
                      />
                    ) : (
                      <>
                        <MenuItem
                          icon={User01}
                          label={t('header.myProfile')}
                          onPress={() => {
                            state.close()
                            goToProfile()
                          }}
                        />
                        <MenuItem
                          icon={Settings01}
                          label={t('header.settings')}
                          onPress={() => {
                            state.close()
                            goToSettings()
                          }}
                        />
                      </>
                    )}
                    <div className="my-1 border-t border-mynted-border" />
                    <MenuItem
                      icon={LogOut01}
                      label={isLoggingOut ? t('header.loggingOut') : t('header.logout')}
                      tone="danger"
                      disabled={isLoggingOut}
                      onPress={() => {
                        state.close()
                        void logout()
                      }}
                    />
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => state.close()}
                    className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-mynted-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
                  >
                    {t('header.login')}
                  </Link>
                )}
              </div>
            </AriaDialog>
          </AriaModal>
        )}
      </AriaModalOverlay>
    </AriaDialogTrigger>
  )
}
