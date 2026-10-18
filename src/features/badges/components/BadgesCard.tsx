import { Button, Dialog, DialogTrigger, Heading, Popover } from 'react-aria-components'
import type { UseQueryResult } from '@tanstack/react-query'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES } from '@/utils/locale'
import { cx } from '@/utils/cx'
import type { AwardedBadge } from '../models/badges'
import { getBadgeTexts, RARITY_STYLES } from '../utils/badgeDisplay'
import { BadgeIcon } from './BadgeIcon'

interface BadgesCardProps {
  query: UseQueryResult<AwardedBadge[]>
  /** Texto cuando no hay badges ("Todavía no tienes…" vs "Todavía no tiene…"). */
  emptyKey: TranslationKey
}

/**
 * Tarjeta "Insignias" del perfil (propio y público). Cada badge es un botón:
 * al tocarlo (o con Enter) abre un popover con qué significa, cómo se consigue
 * y cuándo se obtuvo. Funciona igual en mouse, teclado y pantallas táctiles.
 */
export function BadgesCard({ query, emptyKey }: BadgesCardProps) {
  const { t } = useLanguage()
  const badges = query.data ?? []

  return (
    <section className="rounded-2xl border border-mynted-border bg-mynted-white p-6" aria-labelledby="badges-card-title">
      <h2 id="badges-card-title" className="font-heading text-lg font-semibold text-mynted-ink">
        {query.isSuccess ? t('profile.badges.title', { count: badges.length }) : t('profile.badges.titleNoCount')}
      </h2>

      {query.isPending && (
        <div className="mt-4 grid grid-cols-3 gap-3" aria-busy="true" aria-label={t('profile.badges.loading')}>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <span className="size-14 animate-pulse rounded-full bg-mynted-bg" />
              <span className="h-3 w-16 animate-pulse rounded bg-mynted-bg" />
            </div>
          ))}
        </div>
      )}

      {query.isError && <p className="mt-3 text-sm text-red-500">{t('profile.badges.loadError')}</p>}

      {query.isSuccess && badges.length === 0 && <p className="mt-3 text-sm text-mynted-gray">{t(emptyKey)}</p>}

      {badges.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {badges.map((badge) => (
            <li key={`${badge.scope}-${badge.code}`}>
              <BadgeItem badge={badge} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BadgeItem({ badge }: { badge: AwardedBadge }) {
  const { t, language } = useLanguage()
  const { name, description, criteria } = getBadgeTexts(badge, t)
  const rarity = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.low
  const awardedAt = new Date(badge.awardedAt)
  const awardedLabel = Number.isNaN(awardedAt.getTime())
    ? null
    : awardedAt.toLocaleDateString(INTL_LOCALES[language], { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DialogTrigger>
      <Button
        aria-label={name}
        className="group flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl p-1.5 text-center outline-none transition-colors hover:bg-mynted-bg focus-visible:ring-2 focus-visible:ring-mynted-orange"
      >
        <BadgeIcon code={badge.code} rarity={badge.rarity} className="size-14 transition-transform group-hover:scale-105" />
        <span className="line-clamp-2 text-xs font-medium text-mynted-gray">{name}</span>
      </Button>

      <Popover
        placement="bottom"
        offset={8}
        className={({ isEntering, isExiting }) =>
          cx(
            'w-72 rounded-2xl border border-mynted-border bg-mynted-white p-4 shadow-[0_16px_40px_-8px_rgba(13,13,20,0.18)] outline-none',
            isEntering && 'duration-150 ease-out animate-in fade-in zoom-in-95',
            isExiting && 'duration-100 ease-in animate-out fade-out zoom-out-95',
          )
        }
      >
        <Dialog className="outline-none">
          <div className="flex items-start gap-3">
            <BadgeIcon code={badge.code} rarity={badge.rarity} className="size-12" />
            <div className="min-w-0">
              <Heading slot="title" className="font-heading text-base font-semibold text-mynted-ink">
                {name}
              </Heading>
              <span className={cx('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold', rarity.pill)}>
                {t(`profile.badges.rarity.${badge.rarity}` as TranslationKey)}
              </span>
            </div>
          </div>

          <p className="mt-3 text-sm text-mynted-ink">{description}</p>

          <div className="mt-3 border-t border-mynted-border pt-3">
            <p className="text-xs font-semibold text-mynted-ink">{t('profile.badges.howToEarn')}</p>
            <p className="mt-0.5 text-xs text-mynted-gray">{criteria}</p>
          </div>

          {awardedLabel && (
            <p className="mt-3 text-xs text-mynted-gray">{t('profile.badges.awardedOn', { date: awardedLabel })}</p>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
