import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { TrendingDown } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import { cx } from '@/utils/cx'
import { useMyCommissionProfile } from '../hooks/usePaymentQueries'
import type { CommissionProfile } from '../models/payment'
import { formatRate } from '../utils/paymentFormat'

/**
 * "Tu comisión" en el panel del vendedor: en qué nivel está, cuánto le falta
 * para el siguiente y la matriz completa de comisiones (nivel × rango de
 * precio) con su fila marcada.
 *
 * La comisión base es 5 % y baja con dos descuentos que se suman: uno por
 * cantidad de ventas (el nivel) y otro por el precio del artículo. Los dos
 * salen de GET /sellers/me/commission, no se calculan acá.
 */
export function CommissionCard() {
  const { t } = useLanguage()
  const profile = useMyCommissionProfile()

  if (profile.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
  }

  if (profile.isError) {
    return (
      <QueryErrorState
        error={profile.error}
        onRetry={() => void profile.refetch()}
        texts={{ error: { description: t('commission.loadError') } }}
      />
    )
  }

  if (!profile.data) return null

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-mynted-border bg-white p-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('commission.title')}</h2>
        <p className="text-xs text-mynted-gray">{t('commission.subtitle')}</p>
      </header>

      <TierProgress profile={profile.data} />
      <CommissionMatrix profile={profile.data} />

      <p className="flex items-start gap-2 rounded-xl bg-mynted-bg px-3.5 py-2.5 text-xs text-mynted-gray">
        <TrendingDown className="mt-0.5 size-4 shrink-0 text-mynted-blue" aria-hidden="true" />
        {t('commission.higherPriceNote')}
      </p>
    </section>
  )
}

/** Nivel actual, descuento que da y cuánto falta para el siguiente. */
function TierProgress({ profile }: { profile: CommissionProfile }) {
  const { t, language } = useLanguage()
  const { currentTier, nextTier, completedSalesCount, salesRemaining } = profile

  // Progreso dentro del nivel actual. El último nivel no tiene tope: ahí la
  // barra queda llena, que es justamente lo que significa.
  const floor = currentTier.minValue
  const ceiling = currentTier.maxValue
  const span = ceiling === null ? 0 : ceiling - floor
  const progress = span > 0 ? Math.min(100, Math.max(0, ((completedSalesCount - floor) / span) * 100)) : 100

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="flex items-baseline gap-2">
          <span className="font-heading text-xl font-semibold text-mynted-ink">{currentTier.name}</span>
          <span className="text-xs text-mynted-gray">
            {t('commission.salesCount', { count: completedSalesCount })}
          </span>
        </p>
        {currentTier.discount > 0 && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {t('commission.tierDiscount', { discount: formatRate(currentTier.discount, language) })}
          </span>
        )}
      </div>

      <div
        // El carril va en gris del borde, no en el gris del fondo: sobre la
        // tarjeta blanca este último no se distingue, y con 0 ventas la barra
        // está vacía y no se vería nada.
        className="h-2 w-full overflow-hidden rounded-full bg-mynted-border/70"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={t('commission.progressLabel', { tier: nextTier?.name ?? currentTier.name })}
      >
        <div className="h-full rounded-full bg-mynted-orange transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <p className="text-sm text-mynted-gray">
        {nextTier && salesRemaining !== null
          ? t('commission.salesRemaining', { count: salesRemaining, tier: nextTier.name })
          : t('commission.topTier')}
      </p>
    </div>
  )
}

/**
 * Matriz nivel × rango de precio. Cada celda es la comisión que se paga en esa
 * combinación; la fila del vendedor va resaltada.
 */
function CommissionMatrix({ profile }: { profile: CommissionProfile }) {
  const { t, language } = useLanguage()

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-mynted-ink">{t('commission.matrixTitle')}</h3>

      <div className="-mx-1 overflow-x-auto px-1">
        {/* Sin <caption>: el h3 de arriba ya nombra la tabla y repetirlo se lee dos veces. */}
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="px-2.5 py-2 text-left text-xs font-semibold text-mynted-gray">
                {t('commission.column.tier')}
              </th>
              {profile.priceTiers.map((tier) => (
                <th key={tier.name} scope="col" className="px-2.5 py-2 text-right text-xs font-semibold text-mynted-gray">
                  <span className="block text-mynted-ink">{tier.name}</span>
                  <span className="block font-normal">
                    {tier.maxValue === null
                      ? t('commission.range.fromOnly', { min: formatPrice(tier.minValue, tier.currency, language) })
                      : t('commission.range.fromTo', {
                          min: formatPrice(tier.minValue, tier.currency, language),
                          max: formatPrice(tier.maxValue, tier.currency, language),
                        })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profile.matrix.map((row) => {
              const isMine = row.salesTierName === profile.currentTier.name
              return (
                <tr key={row.salesTierName} className={cx('border-t border-mynted-border', isMine && 'bg-mynted-orange/10')}>
                  <th scope="row" className="px-2.5 py-2 text-left font-medium text-mynted-ink">
                    {row.salesTierName}
                    {isMine && <span className="ml-1.5 text-xs font-semibold text-mynted-orange">{t('commission.yourTier')}</span>}
                  </th>
                  {row.rates.map((cell) => (
                    <td
                      key={cell.priceTierName}
                      className={cx('px-2.5 py-2 text-right tabular-nums', isMine ? 'font-semibold text-mynted-ink' : 'text-mynted-gray')}
                    >
                      {formatRate(cell.commissionRate, language)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Los rangos de precio se definen en una moneda y se convierten a las
          demás, así que fuera de la original los límites son aproximados. */}
      {profile.priceTiers.some((tier) => tier.approximate) && (
        <p className="text-xs text-mynted-gray">{t('commission.approximateRanges')}</p>
      )}
    </div>
  )
}
