import { Star } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES } from '@/utils/locale'
import { cx } from '@/utils/cx'
import { Rating } from './Rating'

const SIZES = {
  sm: { stars: 12, text: 'text-xs', gap: 'gap-1.5' },
  md: { stars: 14, text: 'text-sm', gap: 'gap-2' },
  lg: { stars: 18, text: 'text-base', gap: 'gap-2.5' },
} as const

interface RatingSummaryProps {
  /** Promedio (1 decimal) o null si todavía no hay reseñas. */
  average: number | null | undefined
  /** Cantidad de reseñas. */
  count: number
  size?: keyof typeof SIZES
  /**
   * `stars`: estrellas + "4,7 · 12 reseñas" (perfil, tienda, detalle).
   * `compact`: una estrella + "4,7 (12)" (filas de búsqueda, cifras, tarjetas).
   */
  variant?: 'stars' | 'compact'
  /** Texto si no hay reseñas; con `false` no se pinta nada. */
  emptyLabel?: string | false
  /** Ocultar el número cuando ya se muestra aparte en grande (tarjeta de reputación). */
  showValue?: boolean
  className?: string
}

/**
 * Calificación de solo lectura reutilizable: estrellas (o una estrella),
 * promedio con el separador decimal del idioma y la cantidad de reseñas.
 * Para lectores de pantalla se lee como una frase ("4,7 de 5 estrellas, 12
 * reseñas") en vez de una lista de números sueltos.
 */
export function RatingSummary({
  average,
  count,
  size = 'md',
  variant = 'stars',
  emptyLabel,
  showValue = true,
  className,
}: RatingSummaryProps) {
  const { t, language } = useLanguage()
  const styles = SIZES[size]

  if (average === null || average === undefined || count === 0) {
    if (emptyLabel === false) return null
    return <span className={cx(styles.text, 'text-mynted-gray', className)}>{emptyLabel ?? t('rating.noReviews')}</span>
  }

  const value = average.toLocaleString(INTL_LOCALES[language], { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const countText = t(count === 1 ? 'rating.countOne' : 'rating.count', { count: count.toLocaleString(INTL_LOCALES[language]) })
  const label = t('rating.summaryLabel', { value, count: countText })

  if (variant === 'compact') {
    return (
      <span role="img" aria-label={label} className={cx('inline-flex items-center gap-1', styles.text, className)}>
        <Star className="size-[1.1em] fill-amber-400 text-amber-400" aria-hidden="true" />
        <span className="font-semibold text-mynted-ink">{value}</span>
        <span className="text-mynted-gray">({count.toLocaleString(INTL_LOCALES[language])})</span>
      </span>
    )
  }

  return (
    <span role="img" aria-label={label} className={cx('inline-flex flex-wrap items-center', styles.gap, styles.text, className)}>
      <Rating value={average} size={styles.stars} className="pointer-events-none" />
      {showValue && <span className="font-semibold text-mynted-ink">{value}</span>}
      <span className="text-mynted-gray">
        {showValue && '· '}
        {countText}
      </span>
    </span>
  )
}
