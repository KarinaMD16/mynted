import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { GooseIcon } from '../ui/GooseIcon'
import { AccountMenu } from './AccountMenu'

interface AccountControlProps {
  isLoading: boolean
  isLoggedIn: boolean
  userName?: string
}

/**
 * Decide qué mostrar en el lugar del botón de cuenta del header de
 * escritorio, según si hay sesión activa (ver useCurrentUser):
 *
 * - Mientras se resuelve GET /users/me: un placeholder inerte, del mismo
 *   tamaño que los otros dos estados, para no hacer parpadear el layout ni
 *   mostrar "Login" un instante antes de saber si en realidad hay sesión.
 * - Sin sesión: un link a /login con la misma forma de píldora que el
 *   AccountMenu, pero sin dropdown — no hay nada que cerrar sesión de si no
 *   hay sesión.
 * - Con sesión: el AccountMenu de siempre (ícono + username + dropdown).
 */
export function AccountControl({ isLoading, isLoggedIn, userName }: AccountControlProps) {
  const { t } = useLanguage()

  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className="flex h-[42px] w-[110px] shrink-0 animate-pulse items-center gap-1.5 rounded-full border border-mynted-border bg-mynted-bg py-1.5 pr-3.5 pl-1.5"
      >
        <span className="size-[30px] shrink-0 rounded-full bg-mynted-border" />
        <span className="h-3 w-12 rounded-full bg-mynted-border" />
      </span>
    )
  }

  if (!isLoggedIn) {
    return (
      <Link
        to="/login"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-mynted-border bg-mynted-orange py-1.5 pr-3.5 pl-1.5 outline-none transition-colors hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
      >
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-mynted-white/25">
          <GooseIcon className="size-[22px] text-mynted-white" />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap text-mynted-white">{t('header.login')}</span>
      </Link>
    )
  }

  return <AccountMenu userName={userName ?? t('header.account')} />
}
