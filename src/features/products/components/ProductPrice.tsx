import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatPrice } from '@/utils/price'
import { discountOf } from '../utils/discount'

interface ProductPriceProps {
  /** Precio original: nunca se modifica en el backend. */
  price: string | number
  /** Precio con descuento (calculado por el backend). Si falta, se muestra `price`. */
  finalPrice?: number | null
  /** 0–100 o null. */
  discountPercent?: number | string | null
  currency: string
  /** Clases del precio que se muestra (el final). */
  className?: string
  /** Pinta el precio tachado y el distintivo para fondos oscuros. */
  onDark?: boolean
  /** Muestra el distintivo "-15 %" junto al precio. */
  showBadge?: boolean
}

/**
 * Precio de un producto: muestra `finalPrice` y, si hay descuento, tacha el
 * precio original (`price`). Sin descuento es solo el precio.
 */
export function ProductPrice({
  price,
  finalPrice,
  discountPercent,
  currency,
  className,
  onDark = false,
  showBadge = true,
}: ProductPriceProps) {
  const { t, language } = useLanguage()
  const original = Number(price)
  const discount = discountOf(discountPercent)
  const hasDiscount = discount !== null && finalPrice != null && finalPrice < original

  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={className}>{formatPrice(hasDiscount ? finalPrice : price, currency, language)}</span>
      {hasDiscount && (
        <>
          <s className={cx('text-xs', onDark ? 'text-white/70' : 'text-mynted-gray')}>
            <span className="sr-only">{t('products.price.original')} </span>
            {formatPrice(original, currency, language)}
          </s>
          {showBadge && (
            <span
              className={cx(
                'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                onDark ? 'bg-mynted-yellow text-mynted-ink' : 'bg-mynted-orange/10 text-mynted-orange',
              )}
            >
              -{discount}%
            </span>
          )}
        </>
      )}
    </span>
  )
}
