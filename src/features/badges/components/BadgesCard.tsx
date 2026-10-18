import { Lock } from 'lucide-react'
import { Button, Dialog, DialogTrigger, Heading, Popover } from 'react-aria-components'
import type { UseQueryResult } from '@tanstack/react-query'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES } from '@/utils/locale'
import { cx } from '@/utils/cx'
import type { AwardedBadge } from '../models/badges'
import { getBadgeTexts, getRarityStyles } from '../utils/badgeDisplay'
import { BadgeIcon } from './BadgeIcon'

interface BadgesCardProps {
  /** Badges ganados (GET /users/me/badges o /users/:id/badges). */
  query: UseQueryResult<AwardedBadge[]>
  /**
   * Catálogo (GET /badges?scope=user). Si se pasa, también se muestran en gris
   * los que faltan por ganar, con cómo conseguirlos. Solo tiene sentido en el perfil propio.
   */
  catalogQuery?: UseQueryResult<AwardedBadge[]>
  /** Texto cuando no hay badges ("Todavía no tienes…" vs "Todavía no tiene…"). */
  emptyKey: TranslationKey
}

/**
 * Tarjeta "Insignias" del perfil (propio y público). Cada badge es un botón:
 * al tocarlo (o con Enter) abre un popover con qué significa, cómo se consigue
 * y cuándo se obtuvo. Funciona igual en mouse, teclado y pantallas táctiles.
 */
export function BadgesCard({ query, catalogQuery, emptyKey }: BadgesCardProps) {
  const { t } = useLanguage()
  const earned = query.data ?? []
  const earnedCodes = new Set(earned.map((badge) => badge.code))
  // El catálogo ya viene ordenado por rareza; solo se quitan los que ya se ganaron.
  const locked = (catalogQuery?.data ?? []).filter((badge) => !earnedCodes.has(badge.code))
  const total = catalogQuery?.data ? earned.length + locked.length : undefined

  const title = !query.isSuccess
    ? t('profile.badges.titleNoCount')
    : total !== undefined
      ? t('profile.badges.titleProgress', { earned: earned.length, total })
      : t('profile.badges.title', { count: earned.length })

  return (
    <section className="rounded-2xl border border-mynted-border bg-mynted-white p-6" aria-labelledby="badges-card-title">
      <h2 id="badges-card-title" className="font-heading text-lg font-semibold text-mynted-ink">
        {title}
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

      {query.isSuccess && earned.length === 0 && <p className="mt-3 text-sm text-mynted-gray">{t(emptyKey)}</p>}

      {(earned.length > 0 || locked.length > 0) && query.isSuccess && (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {earned.map((badge) => (
            <li key={`${badge.scope}-${badge.code}`}>
              <BadgeItem badge={badge} />
            </li>
          ))}
          {locked.map((badge) => (
            <li key={`locked-${badge.scope}-${badge.code}`}>
              <BadgeItem badge={badge} locked />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BadgeItem({ badge, locked = false }: { badge: AwardedBadge; locked?: boolean }) {
  const { t, language } = useLanguage()
  const { name, description, criteria } = getBadgeTexts(badge, t)
  const rarity = getRarityStyles(badge.rarity)
  const awardedAt = badge.awardedAt ? new Date(badge.awardedAt) : null
  const awardedLabel =
    awardedAt && !Number.isNaN(awardedAt.getTime())
      ? awardedAt.toLocaleDateString(INTL_LOCALES[language], { day: 'numeric', month: 'long', year: 'numeric' })
      : null

  return (
    <DialogTrigger>
      <Button
        aria-label={locked ? t('profile.badges.lockedLabel', { name }) : name}
        className="group flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl p-1.5 text-center outline-none transition-colors hover:bg-mynted-bg focus-visible:ring-2 focus-visible:ring-mynted-orange"
      >
        <span className="relative">
          <BadgeIcon
            code={badge.code}
            rarity={badge.rarity}
            locked={locked}
            className="size-14 transition-transform group-hover:scale-105"
          />
          {locked && (
            <Lock
              className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full bg-mynted-white p-0.5 text-mynted-gray"
              aria-hidden="true"
            />
          )}
        </span>
        <span className={cx('line-clamp-2 text-xs font-medium', locked ? 'text-mynted-gray/70' : 'text-mynted-gray')}>
          {name}
        </span>
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
            <BadgeIcon code={badge.code} rarity={badge.rarity} locked={locked} className="size-12" />
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

          {criteria && (
            <div className="mt-3 border-t border-mynted-border pt-3">
              <p className="text-xs font-semibold text-mynted-ink">{t('profile.badges.howToEarn')}</p>
              <p className="mt-0.5 text-xs text-mynted-gray">{criteria}</p>
            </div>
          )}

          {locked ? (
            <p className="mt-3 text-xs font-medium text-mynted-gray">{t('profile.badges.locked')}</p>
          ) : badge.derived ? (
            <p className="mt-3 text-xs text-mynted-gray">{t('profile.badges.derived')}</p>
          ) : (
            awardedLabel && <p className="mt-3 text-xs text-mynted-gray">{t('profile.badges.awardedOn', { date: awardedLabel })}</p>
          )}
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
