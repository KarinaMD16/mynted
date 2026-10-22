import { Link } from '@tanstack/react-router'
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
  className,
}: {
  product: ProductDetail
  quote: PaymentQuote
  className?: string
}) {
  const { t, language } = useLanguage()
  const total = formatPrice(quote.amount, quote.currency, language)

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

      <dl className="flex flex-col gap-2 border-t border-mynted-border pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mynted-gray">{t('checkout.summary.price')}</dt>
          <dd className="font-medium text-mynted-ink">{total}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-mynted-border pt-2">
          <dt className="font-semibold text-mynted-ink">{t('checkout.summary.total')}</dt>
          <dd className="font-heading text-xl font-semibold text-mynted-ink">{total}</dd>
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
