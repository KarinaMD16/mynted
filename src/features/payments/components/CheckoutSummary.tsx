import { Link } from '@tanstack/react-router'
import { Minus, Plus } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatPrice } from '@/utils/price'
import type { ProductDetail } from '@/features/products/models/product'
import type { PaymentQuote } from '../models/payment'

/**
 * Resumen de lo que se está pagando: portada, título, vendedor, precio y
 * total. El monto que manda es el de la cotización (GET /payments/quote),
 * que es el que va a cobrar el backend; el producto solo aporta la foto, el
 * título y el vendedor.
 */
export function CheckoutSummary({
  product,
  quote,
  quantity,
  maxQuantity,
  onQuantityChange,
  isUpdating = false,
  disabled = false,
  className,
}: {
  product: ProductDetail
  quote: PaymentQuote
  quantity: number
  /** Stock disponible: con 1 no se muestra el selector. */
  maxQuantity: number
  onQuantityChange: (quantity: number) => void
  /** Se está pidiendo la cotización de otra cantidad: el total es el anterior. */
  isUpdating?: boolean
  disabled?: boolean
  className?: string
}) {
  const { t, language } = useLanguage()
  const total = formatPrice(quote.amount, quote.currency, language)
  const unitPrice = formatPrice(quote.unitPrice ?? quote.amount, quote.currency, language)

  return (
    <aside className={cx('flex h-fit flex-col gap-4 rounded-2xl border border-mynted-border bg-white p-5', className)}>
      <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('checkout.summary.title')}</h2>

      <div className="flex gap-3.5">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-mynted-bg">
          {product.imageUrl && <img src={product.imageUrl} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            to="/products/$productId"
            params={{ productId: String(product.id) }}
            className="line-clamp-2 font-heading text-sm font-semibold text-mynted-ink hover:underline"
          >
            {product.title}
          </Link>
          <p className="truncate text-xs text-mynted-gray">
            {t('checkout.summary.seller', { name: product.seller.displayName })}
          </p>
        </div>
      </div>

      {maxQuantity > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-mynted-border pt-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-mynted-ink">{t('checkout.summary.quantity')}</span>
            <span className="text-xs text-mynted-gray">{t('checkout.summary.available', { count: maxQuantity })}</span>
          </div>
          <div className="flex items-center rounded-xl border border-mynted-border">
            <button
              type="button"
              onClick={() => onQuantityChange(quantity - 1)}
              disabled={disabled || quantity <= 1}
              aria-label={t('checkout.summary.decrease')}
              className="grid size-9 cursor-pointer place-items-center text-mynted-ink disabled:cursor-not-allowed disabled:text-mynted-gray-light"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-mynted-ink" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={disabled || quantity >= maxQuantity}
              aria-label={t('checkout.summary.increase')}
              className="grid size-9 cursor-pointer place-items-center text-mynted-ink disabled:cursor-not-allowed disabled:text-mynted-gray-light"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <dl className="flex flex-col gap-2 border-t border-mynted-border pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mynted-gray">{quantity > 1 ? t('checkout.summary.unitPrice') : t('checkout.summary.price')}</dt>
          <dd className="font-medium text-mynted-ink">{unitPrice}</dd>
        </div>
        {/* Varias unidades: la cuenta a la vista (precio unitario × cantidad = total de la cotización). */}
        {quantity > 1 && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-mynted-gray">{t('checkout.summary.lineTotal', { price: unitPrice, count: quantity })}</dt>
            <dd className={`font-medium text-mynted-ink transition-opacity ${isUpdating ? 'opacity-50' : ''}`}>{total}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 border-t border-mynted-border pt-2">
          <dt className="font-semibold text-mynted-ink">{t('checkout.summary.total')}</dt>
          <dd className={`font-heading text-xl font-semibold text-mynted-ink transition-opacity ${isUpdating ? 'opacity-50' : ''}`}>
            {total}
          </dd>
        </div>
      </dl>

      {/* El backend convierte a la moneda del usuario solo para que sepa cuánto
          es "en lo suyo": el cobro va igual en la moneda del producto. */}
      {quote.convertedAmount && (
        <p className="text-xs text-mynted-gray">
          {t('checkout.summary.approxInCurrency', {
            amount: formatPrice(quote.convertedAmount.amount, quote.convertedAmount.currency, language),
            date: quote.convertedAmount.rateDate,
          })}
        </p>
      )}
    </aside>
  )
}
