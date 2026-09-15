import { Link, useRouterState } from '@tanstack/react-router'
import { Bell01, Menu02, Settings01, User01, LogOut01, X as CloseIcon } from '@untitledui/icons'
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
import { Navigation } from '../ui/Navigation'
import { NAV_ITEMS } from '../ui/navItems'
import { popoverAnimationClass } from '@/utils/popoverAnimation'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { AccountMenu } from './AccountMenu'
import { MenuItem } from './menuPrimitives'
import { useAccountActions } from './useAccountActions'

const navItemBaseClass =
  'rounded-[10px] px-4 py-[9px] text-[15px] font-medium whitespace-nowrap text-mynted-gray transition-colors hover:bg-mynted-orange hover:text-mynted-white'

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { data: currentUser } = useCurrentUser()
  // Mientras carga o si no hay sesión (no debería pasar en las pantallas que
  // usan este header, pero por las dudas), mostramos algo genérico en vez de
  // un nombre hardcodeado.
  const userName = currentUser?.username ?? 'Account'

  return (
    <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 rounded-2xl border border-mynted-border bg-mynted-white px-4 py-3.5 sm:px-6 lg:px-12 lg:py-[18px]">
      <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
      <Logo ver='small'/> 
      </Link>

      <Navigation className="hidden items-center gap-1.5 lg:flex lg:flex-wrap" />

      {/* Acciones de escritorio */}
      <div className="hidden shrink-0 items-center gap-3.5 lg:flex">
        <SearchBar />
        <NotificationsMenu />
        <AccountMenu userName={userName} />
      </div>

      {/* Acciones compactas (mobile / tablet) */}
      <div className="flex shrink-0 items-center gap-2 lg:hidden">
        <NotificationsMenu />
        <MobileMenuTrigger userName={userName} pathname={pathname} />
      </div>
    </header>
  )
}

function NotificationsMenu() {
  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label="Notifications"
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mynted-border bg-mynted-blue-mid text-mynted-white outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:opacity-80"
      >
        <Bell01 className="size-[22px]" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog className="w-72 rounded-xl border border-mynted-border bg-mynted-white p-4 shadow-lg outline-none">
          <p className="text-sm font-semibold text-mynted-ink">Notifications</p>
          <p className="mt-2 text-sm text-mynted-gray">
            You don't have any notifications yet. Here you'll see activity from your communities, trades, and messages.
          </p>
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}

/** Botón hamburguesa + drawer con nav, búsqueda y acciones de cuenta, para pantallas menores a `lg`. */
function MobileMenuTrigger({ userName, pathname }: { userName: string; pathname: string }) {
  const { logout, goToProfile, isLoggingOut } = useAccountActions()

  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label="Open menu"
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
                  aria-label="Close menu"
                  onPress={() => state.close()}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full text-mynted-gray outline-none transition-colors hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
                >
                  <CloseIcon className="size-5" aria-hidden="true" />
                </AriaButton>
              </div>

              <div className="px-5 pt-4">
                <SearchBar />
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
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="mt-auto border-t border-mynted-border p-3">
                <div className="mb-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mynted-orange">
                    <GooseIcon className="size-5 text-mynted-white" />
                  </span>
                  <span className="text-sm font-semibold text-mynted-ink">{userName}</span>
                </div>
                <MenuItem
                  icon={User01}
                  label="My profile"
                  onPress={() => {
                    state.close()
                    goToProfile()
                  }}
                />
                <MenuItem icon={Settings01} label="Settings" onPress={() => state.close()} />
                <div className="my-1 border-t border-mynted-border" />
                <MenuItem
                  icon={LogOut01}
                  label={isLoggingOut ? 'Logging out…' : 'Log out'}
                  tone="danger"
                  disabled={isLoggingOut}
                  onPress={() => {
                    state.close()
                    void logout()
                  }}
                />
              </div>
            </AriaDialog>
          </AriaModal>
        )}
      </AriaModalOverlay>
    </AriaDialogTrigger>
  )
}
