import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatPrice, shownPrice, type DisplayPriceFields } from '@/utils/price'
import { discountOf } from '../utils/discount'

interface ProductPriceProps {
  /** Precio original: nunca se modifica en el backend. */
  price: string | number
  /** Precio con descuento (calculado por el backend). Si falta, se muestra `price`. */
  finalPrice?: number | null
  /** 0–100 o null. */
  discountPercent?: number | string | null
  /** Moneda en la que se publicó el producto (y en la que se cobra). */
  currency: string
  /**
   * Precio convertido a la moneda del usuario (campos `display*` del backend).
   * Se puede pasar el producto entero. Sin esto, o si no hubo tipo de cambio,
   * se muestra el precio original.
   */
  display?: DisplayPriceFields

  /** Clases del precio que se muestra (el final). */
  className?: string
  /** Pinta el precio tachado y el distintivo para fondos oscuros. */
  onDark?: boolean
  /** Muestra el distintivo "-15 %" junto al precio. */
  showBadge?: boolean
}

/**
 * Precio de un producto: muestra el precio final y, si hay descuento, tacha el
 * precio antes del descuento. Si el backend lo convirtió a la moneda del
 * usuario, se muestra solo ese monto con "≈" ("≈ ₡13 656,60"). El precio en la
 * moneda en que se cobra no se muestra aquí: se deja para el checkout.
 */
export function ProductPrice({
  price,
  finalPrice,
  discountPercent,
  currency,
  display,

  className,
  onDark = false,
  showBadge = true,
}: ProductPriceProps) {
  const { t, language } = useLanguage()
  const shown = shownPrice({ price, finalPrice, currency, ...display })
  const discount = discountOf(discountPercent)
  const hasDiscount = discount !== null && shown.finalPrice < shown.price
  const secondaryText = cx('text-xs', onDark ? 'text-white/70' : 'text-mynted-gray')

  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={className}>
        {shown.isConverted && (
          <>
            <span className="sr-only">{t('products.price.approx')} </span>
            <span aria-hidden="true">≈ </span>
          </>
        )}
        {formatPrice(hasDiscount ? shown.finalPrice : shown.price, shown.currency, language)}
      </span>
      {hasDiscount && (
        <>
          <s className={secondaryText}>
            <span className="sr-only">{t('products.price.original')} </span>
            {formatPrice(shown.price, shown.currency, language)}
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
