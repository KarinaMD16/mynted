import type { ReactNode } from 'react'
import { Calendar } from '@untitledui/icons'
import { Clock, MapPin } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { AppLanguage } from '@/utils/locale'
import type { AuthUser } from '@/features/auth/models/auth'
import { ProfileBanner } from '@/features/pro/components/ProfileBanner'
import type { EffectiveBanner } from '@/features/pro/models/cosmetics'
import { formatResponseTime } from '@/features/stores/utils/responseTime'
import { formatMemberSince } from '../utils/profileFormat'

/**
 * Piezas que comparten "Mi perfil" (/profile) y el perfil público de otra
 * persona (/users/:userId): el mismo look, sin acciones de edición.
 */

/**
 * Banner de la cabecera: el cosmético EFECTIVO del usuario (banner propio si es
 * Pro, uno del catálogo o el degradado por defecto). En el perfil se usa la
 * imagen animada (`url`); ver ProfileBanner.
 */
export function CoverBanner({ banner, fallbackUrl }: { banner?: EffectiveBanner | null; fallbackUrl?: string | null }) {
  return <ProfileBanner banner={banner} fallbackUrl={fallbackUrl} mode="animated" />
}

/**
 * Una cifra de la franja inferior de la cabecera (perfil y tienda): ícono,
 * etiqueta y valor. Va dentro de un <dl> con `gap-px` y fondo de borde, así
 * las celdas quedan separadas por una línea fina.
 */
export function HeaderStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-mynted-white px-3 pt-4 text-center">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-mynted-gray">
        <span className="text-mynted-orange" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="font-heading text-base font-semibold text-mynted-ink">{value}</dd>
    </div>
  )
}

/** Hueco del valor mientras carga, del alto del texto para que la franja no salte. */
export function HeaderStatSkeleton() {
  return <span className="inline-block h-5 w-10 animate-pulse rounded bg-mynted-bg align-middle" />
}

/**
 * Solo usa estos campos: sirve tanto para la cuenta propia (AuthUser) como
 * para un perfil público (PublicUser). El tiempo de respuesta solo aplica a
 * vendedores aprobados (los que traen `seller`).
 */
export function AboutCard({
  user,
  language,
  isOwn = true,
}: {
  user: Pick<AuthUser, 'bio' | 'location' | 'createdAt' | 'seller'>
  language: AppLanguage
  /** En el perfil de otra persona el aviso de "sin biografía" no le habla a quien mira. */
  isOwn?: boolean
}) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('profile.about.title')}</h2>
      <p className="mt-2 text-sm text-mynted-gray">{user.bio?.trim() ? user.bio : t(isOwn ? 'profile.about.noBio' : 'profile.about.noBioOther')}</p>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-mynted-border pt-4 text-sm text-mynted-gray">
        <span className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {user.location?.trim() ? user.location : t('profile.about.noLocation')}
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('profile.about.memberSinceLabel', { date: formatMemberSince(user.createdAt, language) })}
        </span>
        {user.seller && (
          <span className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
            {formatResponseTime(user.seller.responseTime, t)}
          </span>
        )}
      </div>
    </div>
  )
}
