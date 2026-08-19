import type { FC } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Bell01, ChevronDown, LogOut01, Menu02, Settings01, User01, X as CloseIcon } from '@untitledui/icons'
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

const NAV_ITEMS: { label: string; href: '/' | '/explore' | '/communities' | '/favorites' | '/messages' }[] = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'Communities', href: '/communities' },
  { label: 'Favorites', href: '/favorites' },
  { label: 'Messages', href: '/messages' },
]

const navItemBaseClass =
  'rounded-[10px] px-4 py-[9px] text-[15px] font-medium whitespace-nowrap text-mynted-gray transition-colors hover:bg-mynted-orange hover:text-mynted-white'

const popoverAnimationClass = ({ isEntering, isExiting }: { isEntering: boolean; isExiting: boolean }) =>
  [
    'w-max origin-top-right will-change-transform',
    isEntering && 'duration-150 ease-out animate-in fade-in slide-in-from-top-1',
    isExiting && 'duration-100 ease-in animate-out fade-out slide-out-to-top-1',
  ]
    .filter(Boolean)
    .join(' ')

interface SiteHeaderProps {
  userName?: string
}

export function SiteHeader({ userName = 'Karina' }: SiteHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 rounded-2xl border border-mynted-border bg-mynted-white px-4 py-3.5 sm:px-6 lg:px-12 lg:py-[18px]">
      <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
        <GooseIcon className="size-9 shrink-0 text-mynted-orange" />
        <span className="font-heading text-[22px] font-semibold text-mynted-blue-mid">mynted</span>
      </Link>

      {/* Nav de escritorio */}
      <nav className="hidden lg:block">
        <ul className="flex flex-wrap items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`${navItemBaseClass} ${isActive ? 'bg-mynted-orange font-semibold text-mynted-white' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

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
        aria-label="Notificaciones"
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-mynted-border bg-mynted-blue-mid text-mynted-white outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:opacity-80"
      >
        <Bell01 className="size-[22px]" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog className="w-72 rounded-xl border border-mynted-border bg-mynted-white p-4 shadow-lg outline-none">
          <p className="text-sm font-semibold text-mynted-ink">Notificaciones</p>
          <p className="mt-2 text-sm text-mynted-gray">
            Todavía no tenés notificaciones. Acá vas a ver actividad de tus comunidades, intercambios y mensajes.
          </p>
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}

function AccountMenu({ userName }: { userName: string }) {
  return (
    <AriaDialogTrigger>
      <AriaButton className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-mynted-border bg-mynted-orange py-1.5 pr-3.5 pl-1.5 outline-none transition-colors hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid pressed:bg-mynted-orange-hover">
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-mynted-white/25">
          <GooseIcon className="size-[22px] text-mynted-white" />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap text-mynted-white">{userName}</span>
        <ChevronDown className="size-3.5 shrink-0 text-mynted-white/80" aria-hidden="true" />
      </AriaButton>

      <AriaPopover placement="bottom right" offset={8} className={popoverAnimationClass}>
        <AriaDialog className="w-56 rounded-xl border border-mynted-border bg-mynted-white p-1.5 shadow-lg outline-none">
          <MenuItem icon={User01} label="Mi perfil" />
          <MenuItem icon={Settings01} label="Configuración" />
          <div className="my-1 border-t border-mynted-border" />
          <MenuItem icon={LogOut01} label="Cerrar sesión" tone="danger" />
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}

function MenuItem({
  icon: Icon,
  label,
  tone = 'default',
  onPress,
}: {
  icon: FC<{ className?: string }>
  label: string
  tone?: 'default' | 'danger'
  onPress?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors outline-none hover:bg-mynted-bg focus-visible:bg-mynted-bg ${
        tone === 'danger' ? 'text-red-600' : 'text-mynted-ink'
      }`}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {label}
    </button>
  )
}

/** Botón hamburguesa + drawer con nav, búsqueda y acciones de cuenta, para pantallas menores a `lg`. */
function MobileMenuTrigger({ userName, pathname }: { userName: string; pathname: string }) {
  return (
    <AriaDialogTrigger>
      <AriaButton
        aria-label="Abrir menú"
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
                  aria-label="Cerrar menú"
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
                <MenuItem icon={User01} label="Mi perfil" onPress={() => state.close()} />
                <MenuItem icon={Settings01} label="Configuración" onPress={() => state.close()} />
                <div className="my-1 border-t border-mynted-border" />
                <MenuItem icon={LogOut01} label="Cerrar sesión" tone="danger" onPress={() => state.close()} />
              </div>
            </AriaDialog>
          </AriaModal>
        )}
      </AriaModalOverlay>
    </AriaDialogTrigger>
  )
}
