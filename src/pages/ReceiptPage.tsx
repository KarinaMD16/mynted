import { Link, useParams } from '@tanstack/react-router'
import { CheckCircle2, XCircle } from 'lucide-react'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useLanguage } from '@/i18n/LanguageContext'
import { usePaymentReceipt } from '@/features/payments/hooks/usePaymentQueries'
import type { PaymentFailureReason, PaymentReceipt } from '@/features/payments/models/payment'
import { formatPaymentDate, formatRate, maskedCard } from '@/features/payments/utils/paymentFormat'
import type { TranslationKey } from '@/i18n/translations/es'
import { formatPrice } from '@/utils/price'
import { SiteHeader } from '../components/layout/SiteHeader'

const FAILURE_MESSAGE: Record<PaymentFailureReason, TranslationKey> = {
  card_declined: 'checkout.failure.cardDeclined',
  insufficient_funds: 'checkout.failure.insufficientFunds',
  expired_card: 'checkout.failure.expiredCard',
}

/**
 * Recibo de una transacción (/compras/:id).
 *
 * Lo pueden abrir las dos partes: el backend deja ver el recibo al comprador y
 * al vendedor de esa transacción, y responde 403 a cualquier otro. Por eso
 * también muestra la comisión cuando viene — el comprador no la recibe.
 */
export default function ReceiptPage() {
  const { t } = useLanguage()
  const { transactionId } = useParams({ from: '/compras/$transactionId' })
  const receipt = usePaymentReceipt(transactionId)

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        {receipt.isLoading ? (
          <div className="h-[420px] animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : receipt.isError ? (
          <QueryErrorState
            error={receipt.error}
            onRetry={() => void receipt.refetch()}
            texts={{
              notFound: { description: t('receipt.notFound') },
              forbidden: { description: t('receipt.forbidden') },
              error: { description: t('receipt.loadError') },
            }}
          />
        ) : receipt.data ? (
          <ReceiptCard receipt={receipt.data} />
        ) : null}
      </main>
    </div>
  )
}

function ReceiptCard({ receipt }: { receipt: PaymentReceipt }) {
  const { t, language } = useLanguage()
  const isCompleted = receipt.status === 'completed'
  // El backend solo le manda la comisión al vendedor (ver receipt() en
  // payment-history.service.ts), así que es también la señal de quién está
  // mirando: el mismo recibo lo abren las dos partes, pero no dice lo mismo.
  const isSellerView = receipt.commission !== undefined

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-mynted-border bg-white p-5 sm:p-7">
      <header className="flex flex-col items-center gap-2 text-center">
        {isCompleted ? (
          <CheckCircle2 className="size-11 text-emerald-600" aria-hidden="true" />
        ) : (
          <XCircle className="size-11 text-red-500" aria-hidden="true" />
        )}
        <h1 className="font-heading text-[22px] font-semibold text-mynted-ink">
          {t(isCompleted ? (isSellerView ? 'receipt.saleTitle' : 'receipt.title') : 'receipt.failedTitle')}
        </h1>
        <p className="text-sm text-mynted-gray">
          {isCompleted
            ? t(isSellerView ? 'receipt.saleSubtitle' : 'receipt.subtitle')
            : t(receipt.failureReason ? FAILURE_MESSAGE[receipt.failureReason] : 'checkout.failure.generic')}
        </p>
      </header>

      <div className="flex items-center gap-3.5 rounded-xl bg-mynted-bg p-3.5">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-white">
          {receipt.product.imageUrl && <img src={receipt.product.imageUrl} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            to="/products/$productId"
            params={{ productId: String(receipt.product.id) }}
            className="line-clamp-2 font-heading text-sm font-semibold text-mynted-ink hover:underline"
          >
            {receipt.product.title}
          </Link>
          {!isSellerView && (
            <p className="truncate text-xs text-mynted-gray">
              {t('checkout.summary.seller', { name: receipt.seller.displayName })}
            </p>
          )}
        </div>
      </div>

      <dl className="flex flex-col gap-3 text-sm">
        <Row label={t('receipt.amount')}>
          <span className="font-heading text-lg font-semibold text-mynted-ink">
            {formatPrice(receipt.amount, receipt.currency, language)}
          </span>
        </Row>
        <Row label={t('receipt.date')}>{formatPaymentDate(receipt.date, language)}</Row>
        <Row label={t('receipt.card')}>
          <span className="font-mono">{maskedCard(receipt.cardLast4)}</span>
        </Row>
        {/* Solo lo recibe el comprador, y viene vacío en las compras
            anteriores a que el backend guardara este dato. */}
        {receipt.cardHolderName && <Row label={t('receipt.holder')}>{receipt.cardHolderName}</Row>}
        <Row label={t('receipt.reference')}>
          <span className="font-mono">{receipt.gatewayReference ?? '—'}</span>
        </Row>
      </dl>

      {/* Solo el vendedor la recibe: al comprador el backend no le manda comisión. */}
      {receipt.commission && (
        <dl className="flex flex-col gap-3 border-t border-mynted-border pt-5 text-sm">
          <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('receipt.commissionTitle')}</h2>
          <Row label={t('receipt.commissionTier')}>
            {t('receipt.commissionTierValue', {
              sales: receipt.commission.salesTierName,
              price: receipt.commission.priceTierName,
            })}
          </Row>
          <Row label={t('receipt.commissionRate')}>{formatRate(receipt.commission.commissionRate, language)}</Row>
          <Row label={t('receipt.commissionAmount')}>
            −{formatPrice(receipt.commission.commissionAmount, receipt.currency, language)}
          </Row>
          <Row label={t('receipt.sellerNet')}>
            <span className="font-semibold text-mynted-ink">
              {formatPrice(receipt.commission.sellerNet, receipt.currency, language)}
            </span>
          </Row>
        </dl>
      )}

      <Link
        to={isSellerView ? '/ventas' : '/compras'}
        className="self-center rounded-lg border border-mynted-border bg-white px-4 py-2 text-sm font-semibold text-mynted-ink hover:bg-mynted-bg"
      >
        {t(isSellerView ? 'receipt.backToSales' : 'receipt.backToPurchases')}
      </Link>
    </article>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-mynted-gray">{label}</dt>
      <dd className="text-right text-mynted-ink">{children}</dd>
    </div>
  )
}
