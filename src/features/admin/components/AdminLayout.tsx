import type { ComponentType, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ExternalLink, FolderTree, LogOut, Store, Users, UsersRound } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Logo } from '@/components/ui/Logo'
import { GooseIcon } from '@/components/ui/GooseIcon'
import { useAccountActions } from '@/components/layout/useAccountActions'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { ADMIN_TABS, type AdminSection, type AdminTab } from '../models/admin'

const SECTION_META: Record<
  AdminSection,
  { labelKey: TranslationKey; descriptionKey: TranslationKey; icon: ComponentType<{ className?: string }> }
> = {
  communities: {
    labelKey: 'admin.sections.communities',
    descriptionKey: 'admin.sections.communitiesDescription',
    icon: UsersRound,
  },
  categories: {
    labelKey: 'admin.sections.categories',
    descriptionKey: 'admin.sections.categoriesDescription',
    icon: FolderTree,
  },
  users: {
    labelKey: 'admin.sections.users',
    descriptionKey: 'admin.sections.usersDescription',
    icon: Users,
  },
  sellerRequests: {
    labelKey: 'admin.sections.sellerRequests',
    descriptionKey: 'admin.sections.sellerRequestsDescription',
    icon: Store,
  },
}

const SECTION_ORDER: AdminSection[] = ['communities', 'categories', 'users', 'sellerRequests']

const TAB_LABELS: Record<AdminTab, TranslationKey> = {
  overview: 'admin.tabs.overview',
  manage: 'admin.tabs.manage',
}

/**
 * Estructura del panel de superadmin, siguiendo el mockup de referencia:
 * barra lateral con las secciones (Menú principal) y la cuenta abajo;
 * arriba, pestañas "Resumen" / "Gestionar" de la sección actual; y el
 * contenido sobre fondo gris claro. En pantallas chicas la barra lateral se
 * convierte en una fila de píldoras desplazable arriba.
 *
 * La sección y la pestaña viven en la URL (?section=...&tab=...) para que
 * se puedan compartir, recargar y usar con el botón "atrás" del navegador.
 */
export function AdminLayout({
  section,
  tab,
  userName,
  pendingSellerCount,
  children,
}: {
  section: AdminSection
  tab: AdminTab
  userName: string
  pendingSellerCount: number
  children: ReactNode
}) {
  const { t } = useLanguage()
  const { logout, isLoggingOut } = useAccountActions()
  const meta = SECTION_META[section]

  return (
    <div className="min-h-svh bg-mynted-white lg:grid lg:grid-cols-[280px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden border-r border-mynted-border bg-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:px-5 lg:py-8">
        <Link to="/" className="mb-10 block w-fit rounded outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid">
          <Logo ver="small" />
        </Link>

        <p className="mb-3 px-3 text-xs font-medium tracking-[0.14em] text-mynted-gray uppercase [:lang(ko)_&]:tracking-normal">
          {t('admin.sidebar.mainMenu')}
        </p>
        <nav aria-label={t('admin.sidebar.navLabel')}>
          <ul className="flex flex-col gap-1">
            {SECTION_ORDER.map((id) => (
              <li key={id}>
                <SidebarLink
                  section={id}
                  isActive={id === section}
                  badge={id === 'sellerRequests' ? pendingSellerCount : 0}
                />
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 mb-3 px-3 text-xs font-medium tracking-[0.14em] text-mynted-gray uppercase [:lang(ko)_&]:tracking-normal">
          {t('admin.sidebar.account')}
        </p>
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-mynted-ink transition-colors outline-none hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
        >
          <ExternalLink className="size-5 text-mynted-gray" aria-hidden="true" />
          {t('admin.sidebar.viewSite')}
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          disabled={isLoggingOut}
          className="mt-auto flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-mynted-ink transition-colors outline-none hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-mynted-blue-mid disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="size-5" aria-hidden="true" />
          {isLoggingOut ? t('header.loggingOut') : t('header.logout')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Barra superior: pestañas + idioma + cuenta */}
        <header className="border-b border-mynted-border bg-white px-4 sm:px-8">
          <div className="flex items-center justify-between gap-4 pt-4 lg:hidden">
            <Link to="/" className="rounded outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid">
              <Logo ver="small" className="w-[100px]" />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => void logout()}
                disabled={isLoggingOut}
                aria-label={t('header.logout')}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-mynted-border text-mynted-ink hover:bg-mynted-bg"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Secciones en mobile */}
          <nav aria-label={t('admin.sidebar.navLabel')} className="-mx-4 overflow-x-auto px-4 pt-4 lg:hidden">
            <ul className="flex w-max gap-2">
              {SECTION_ORDER.map((id) => (
                <li key={id}>
                  <SidebarLink
                    section={id}
                    isActive={id === section}
                    badge={id === 'sellerRequests' ? pendingSellerCount : 0}
                    compact
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div role="tablist" aria-label={t('admin.tabs.label')} className="flex gap-8 pt-4 lg:pt-7">
              {ADMIN_TABS.map((id) => {
                const isActive = id === tab
                return (
                  <Link
                    key={id}
                    to="/admin"
                    search={{ section, tab: id }}
                    role="tab"
                    aria-selected={isActive}
                    className={`-mb-px border-b-2 px-1 pb-4 text-[17px] transition-colors outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid ${
                      isActive
                        ? 'border-mynted-blue-mid font-semibold text-mynted-blue-mid'
                        : 'border-transparent text-mynted-gray hover:text-mynted-ink'
                    }`}
                  >
                    {t(TAB_LABELS[id])}
                  </Link>
                )
              })}
            </div>

            <div className="hidden items-center gap-3 pb-3 lg:flex">
              <LanguageSwitcher />
              <span className="flex items-center gap-2.5 rounded-full border border-mynted-border py-1 pr-4 pl-1">
                <span className="flex size-9 items-center justify-center rounded-full bg-mynted-orange">
                  <GooseIcon className="size-5 text-white" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-mynted-ink">{userName}</span>
                  <span className="text-xs text-mynted-gray">{t('admin.users.role.superadmin')}</span>
                </span>
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-mynted-bg px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-mynted-ink">{t(meta.labelKey)}</h1>
              <p className="mt-1 text-sm text-mynted-gray">{t(meta.descriptionKey)}</p>
            </div>
            <div role="tabpanel" className="flex flex-col gap-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarLink({
  section,
  isActive,
  badge,
  compact = false,
}: {
  section: AdminSection
  isActive: boolean
  badge: number
  compact?: boolean
}) {
  const { t } = useLanguage()
  const { labelKey, icon: Icon } = SECTION_META[section]

  const base = compact
    ? 'flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm'
    : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px]'
  const state = isActive
    ? compact
      ? 'border-mynted-blue-mid bg-mynted-blue-mid font-semibold text-white'
      : 'bg-mynted-bg font-semibold text-mynted-ink'
    : compact
      ? 'border-mynted-border bg-white text-mynted-ink'
      : 'text-mynted-ink hover:bg-mynted-bg'

  return (
    <Link
      to="/admin"
      search={{ section, tab: 'overview' }}
      aria-current={isActive ? 'page' : undefined}
      className={`${base} ${state} transition-colors outline-none focus-visible:outline-2 focus-visible:outline-mynted-blue-mid`}
    >
      <Icon className={`size-5 shrink-0 ${isActive && !compact ? 'text-mynted-orange' : ''}`} aria-hidden="true" />
      {t(labelKey)}
      {badge > 0 && (
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
            isActive && compact ? 'bg-white text-mynted-blue-mid' : 'bg-mynted-blue-mid text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
