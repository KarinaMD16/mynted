import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Invitación a iniciar sesión. Se muestra cuando una pantalla pública (Explorar) pide datos y el
 * backend responde 401, es decir, cuando ese endpoint todavía exige sesión. Si el endpoint es
 * público, esta tarjeta nunca aparece.
 */
export function LoginPrompt({ message }: { message: string }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
      <p className="text-sm text-mynted-gray">{message}</p>
      <Link
        to="/login"
        className="rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:bg-mynted-orange-hover"
      >
        {t('home.goToLogin')}
      </Link>
    </div>
  )
}
