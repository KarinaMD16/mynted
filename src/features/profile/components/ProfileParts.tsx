import { Calendar } from '@untitledui/icons'
import { Clock, MapPin } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { AppLanguage } from '@/utils/locale'
import type { AuthUser } from '@/features/auth/models/auth'
import { formatMemberSince } from '../utils/profileFormat'

/**
 * Piezas que comparten "Mi perfil" (/profile) y el perfil público de otra
 * persona (/users/:userId): el mismo look, sin acciones de edición.
 */

export function CoverBanner() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[110px] overflow-hidden rounded-2xl bg-gradient-to-br from-mynted-blue-mid to-mynted-orange sm:h-[140px]"
    >
      <div className="absolute -top-10 right-[8%] size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 left-[6%] size-32 rounded-full bg-white/10" />
      <div className="absolute top-1/3 left-[42%] size-16 rounded-full bg-white/10" />
    </div>
  )
}

export function AboutCard({ user, language }: { user: AuthUser; language: AppLanguage }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('profile.about.title')}</h2>
      <p className="mt-2 text-sm text-mynted-gray">{user.bio?.trim() ? user.bio : t('profile.about.noBio')}</p>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-mynted-border pt-4 text-sm text-mynted-gray">
        <span className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {user.location?.trim() ? user.location : t('profile.about.noLocation')}
        </span>
        <span className="flex items-center gap-2">
          <Calendar className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('profile.about.memberSinceLabel', { date: formatMemberSince(user.createdAt, language) })}
        </span>
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('profile.about.respondsInPlaceholder')}
        </span>
      </div>
    </div>
  )
}
