import { ShoppingBag, Star } from 'lucide-react'
import { RatingSummary } from '@/components/ui/RatingSummary'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES } from '@/utils/locale'
import { useUserReputation } from '../hooks/useReputation'
import type { RatingDistribution } from '../models/reputation'

const STAR_LEVELS = ['5', '4', '3', '2', '1'] as const

/**
 * Tarjeta "Reputación" del perfil de un vendedor (GET /profiles/:id/reputation):
 * promedio grande con estrellas, cuántas reseñas tiene, cómo se reparten por
 * estrellas y sus ventas completadas. Si la persona no es vendedora no se
 * muestra (no tiene reseñas que mostrar). Si la consulta falla, tampoco: la
 * calificación ya aparece en la cabecera del perfil.
 */
export function ReputationCard({ userId }: { userId: string }) {
  const { t, language } = useLanguage()
  const reputation = useUserReputation(userId)

  if (reputation.isPending) {
    return <div className="h-56 animate-pulse rounded-2xl border border-mynted-border bg-mynted-white" aria-busy="true" />
  }
  if (reputation.isError || !reputation.data.isSeller) return null

  const { ratingAverage, reviewsCount, completedSalesCount, ratingDistribution } = reputation.data
  const number = (value: number) => value.toLocaleString(INTL_LOCALES[language])

  return (
    <section aria-labelledby="reputation-title" className="rounded-2xl border border-mynted-border bg-mynted-white p-6">
      <h2 id="reputation-title" className="flex items-center gap-2 font-heading text-lg font-semibold text-mynted-ink">
        <Star className="size-5 text-mynted-orange" aria-hidden="true" />
        {t('reputation.title')}
      </h2>

      {ratingAverage === null || reviewsCount === 0 ? (
        <p className="mt-3 text-sm text-mynted-gray">{t('reputation.empty')}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="font-heading text-[40px] leading-none font-semibold text-mynted-ink">
              {ratingAverage.toLocaleString(INTL_LOCALES[language], { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <RatingSummary average={ratingAverage} count={reviewsCount} size="md" showValue={false} className="flex-col items-start gap-1" />
          </div>
          <Distribution distribution={ratingDistribution} total={reviewsCount} />
        </div>
      )}

      <p className="mt-4 flex items-center gap-2 border-t border-mynted-border pt-4 text-sm text-mynted-gray">
        <ShoppingBag className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
        {t(completedSalesCount === 1 ? 'reputation.salesOne' : 'reputation.sales', { count: number(completedSalesCount) })}
      </p>
    </section>
  )
}

/** Barras de 5 a 1 estrellas con el porcentaje de reseñas de cada una. */
function Distribution({ distribution, total }: { distribution: RatingDistribution; total: number }) {
  const { t, language } = useLanguage()
  const formatPercent = new Intl.NumberFormat(INTL_LOCALES[language], { style: 'percent', maximumFractionDigits: 0 })
  return (
    <ul className="flex flex-col gap-1.5" aria-label={t('reputation.distribution')}>
      {STAR_LEVELS.map((level) => {
        const count = distribution[level] ?? 0
        const ratio = total > 0 ? count / total : 0
        const percent = formatPercent.format(ratio)
        return (
          <li key={level} className="flex items-center gap-2 text-xs text-mynted-gray">
            <span className="flex w-7 shrink-0 items-center gap-0.5 font-medium text-mynted-ink">
              {level}
              <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            </span>
            <span
              className="h-2 flex-1 overflow-hidden rounded-full bg-mynted-bg"
              role="img"
              aria-label={t('reputation.levelLabel', { stars: level, percent, count })}
            >
              <span className="block h-full rounded-full bg-amber-400" style={{ width: `${ratio * 100}%` }} />
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums">{percent}</span>
          </li>
        )
      })}
    </ul>
  )
}
