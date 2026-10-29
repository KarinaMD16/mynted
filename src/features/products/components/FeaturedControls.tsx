import { Link } from '@tanstack/react-router'
import { Lock, Rocket, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { cx } from '@/utils/cx'
import { useFeaturedSummary } from '../hooks/useProductQueries'
import type { FeaturedSummary, MyProductCard } from '../models/product'

/**
 * Productos destacados (sección 11 de la guía Pro). Un vendedor aprobado con
 * Pro vigente destaca hasta 3 productos: suben al inicio de Explorar y de su
 * tienda con la etiqueta "Destacado". Marcar solo guarda la PREFERENCIA
 * (`featuredEnabled`); que de verdad se eleve (`isFeatured`) lo decide el
 * backend al leer. Una preferencia que no se eleva es un destacado "en pausa".
 */

/** Etiqueta "Destacado" sobre una tarjeta o en el detalle de un producto. */
export function FeaturedTag({ className }: { className?: string }) {
  const { t } = useLanguage()
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md bg-mynted-orange px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs sm:px-2 sm:py-1 sm:text-[11px]',
        className,
      )}
    >
      <Star className="size-3 fill-current" aria-hidden="true" />
      {t('featured.tag')}
    </span>
  )
}

/** Por qué un destacado está en pausa, de lo más probable a lo menos. */
function pauseReason(product: MyProductCard, isPro: boolean): TranslationKey {
  if (!isPro) return 'featured.paused.noPro'
  if (product.status !== 'active') return 'featured.paused.inactive'
  if (!product.isVisible) return 'featured.paused.hidden'
  return 'featured.paused.other'
}

/** Estado del destacado en una fila de "Mis productos": "Destacado" o "En pausa" con el motivo. */
export function FeaturedStatus({ product, isPro }: { product: MyProductCard; isPro: boolean }) {
  const { t } = useLanguage()
  if (product.isFeatured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mynted-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-mynted-orange">
        <Star className="size-3 fill-current" aria-hidden="true" />
        {t('featured.tag')}
      </span>
    )
  }
  if (!product.featuredEnabled) return null
  return (
    <span
      title={t(pauseReason(product, isPro))}
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700"
    >
      <Star className="size-3" aria-hidden="true" />
      {t('featured.pausedPill')}
    </span>
  )
}

/** Línea con el motivo de la pausa, bajo los datos del producto. */
export function FeaturedPauseNote({ product, isPro }: { product: MyProductCard; isPro: boolean }) {
  const { t } = useLanguage()
  if (!product.featuredEnabled || product.isFeatured) return null
  return (
    <p className="text-xs text-amber-700">
      {t(pauseReason(product, isPro))}
      {!isPro && (
        <>
          {' '}
          <Link to="/pro" className="font-semibold underline underline-offset-2">
            {t('pro.plans.ctaRenew')}
          </Link>
        </>
      )}
    </p>
  )
}

/**
 * Botón de destacar / quitar destacado de una fila. Quitar siempre se puede
 * (no exige Pro). Destacar solo en productos activos; sin Pro lleva a los
 * planes en vez de llamar al endpoint, y con los cupos llenos queda deshabilitado.
 */
export function FeaturedToggleButton({
  product,
  isPro,
  summary,
  isBusy,
  onToggle,
  onUpsell,
}: {
  product: MyProductCard
  isPro: boolean
  summary: FeaturedSummary | undefined
  isBusy: boolean
  onToggle: (featured: boolean) => void
  onUpsell: () => void
}) {
  const { t } = useLanguage()

  if (product.featuredEnabled) {
    return (
      <Button type="button" variant="secondary" size="sm" disabled={isBusy} onClick={() => onToggle(false)}>
        <StarOff className="size-4" aria-hidden="true" />
        {t('featured.action.remove')}
      </Button>
    )
  }

  if (product.status !== 'active') return null

  if (!isPro) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={onUpsell} title={t('featured.action.needsPro')}>
        <Lock className="size-4" aria-hidden="true" />
        {t('featured.action.add')}
      </Button>
    )
  }

  const isFull = summary !== undefined && summary.remaining <= 0
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isBusy || isFull}
      title={isFull ? t('featured.action.full', { limit: summary?.limit ?? 3 }) : undefined}
      onClick={() => onToggle(true)}
    >
      <Star className="size-4" aria-hidden="true" />
      {t('featured.action.add')}
    </Button>
  )
}

/** Tarjeta de cupos en "Mis productos": "2 de 3 destacados", o la invitación a Pro. */
export function FeaturedSlotsCard({ isPro }: { isPro: boolean }) {
  const { t } = useLanguage()
  const summary = useFeaturedSummary(isPro)
  const limit = summary.data?.limit ?? 3
  const used = summary.data?.used ?? 0

  return (
    <section
      aria-labelledby="featured-slots-title"
      className="flex flex-col gap-4 rounded-2xl border border-mynted-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mynted-orange/10 text-mynted-orange" aria-hidden="true">
          <Rocket className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="featured-slots-title" className="flex items-center gap-2 font-heading text-base font-semibold text-mynted-ink">
            {t('featured.slots.title')}
            <ProBadge size="xs" />
          </h2>
          <p className="max-w-xl text-sm text-mynted-gray">{t(isPro ? 'featured.slots.body' : 'featured.slots.upsell')}</p>
        </div>
      </div>

      {isPro ? (
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end" aria-live="polite">
          {summary.isPending ? (
            <span className="h-5 w-28 animate-pulse rounded bg-mynted-bg" />
          ) : summary.isError ? (
            <span className="text-sm text-mynted-gray">—</span>
          ) : (
            <>
              <span className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: limit }, (_, index) => (
                  <span
                    key={index}
                    className={cx('size-3 rounded-full', index < used ? 'bg-mynted-orange' : 'bg-mynted-border')}
                  />
                ))}
              </span>
              <span className="text-sm font-semibold text-mynted-ink">{t('featured.slots.used', { used, limit })}</span>
            </>
          )}
        </div>
      ) : (
        <Link
          to="/pro"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-mynted-orange px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-mynted-orange-hover"
        >
          {t('pro.plans.ctaJoin')}
        </Link>
      )}
    </section>
  )
}
