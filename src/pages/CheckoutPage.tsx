import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { isNotFoundError } from '@/api/apiError'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CheckoutForm } from '@/features/payments/components/CheckoutForm'
import { CheckoutSummary } from '@/features/payments/components/CheckoutSummary'
import { PaymentNotice } from '@/features/payments/components/PaymentNotice'
import { readCheckoutFailure, useCheckoutMutation, type CheckoutFailure } from '@/features/payments/hooks/usePaymentMutations'
import { usePaymentQuote } from '@/features/payments/hooks/usePaymentQueries'
import type { PaymentCardPayload, PaymentFailureReason } from '@/features/payments/models/payment'
import { useProduct } from '@/features/products/hooks/useProductQueries'
import type { ProductDetail } from '@/features/products/models/product'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { SiteHeader } from '../components/layout/SiteHeader'

/** Por qué rechazó la pasarela, en palabras (ver PaymentFailureReason). */
const FAILURE_MESSAGE: Record<PaymentFailureReason, TranslationKey> = {
  card_declined: 'checkout.failure.cardDeclined',
  insufficient_funds: 'checkout.failure.insufficientFunds',
  expired_card: 'checkout.failure.expiredCard',
}

/** Por qué no se puede comprar este producto, antes siquiera de pedir la tarjeta. */
type Blocker = 'sold' | 'unavailable' | 'exchange' | 'ownProduct'

const BLOCKER_MESSAGE: Record<Blocker, TranslationKey> = {
  sold: 'checkout.blocked.sold',
  unavailable: 'checkout.blocked.unavailable',
  exchange: 'checkout.blocked.exchange',
  ownProduct: 'checkout.blocked.ownProduct',
}

function findBlocker(product: ProductDetail, isOwnProduct: boolean): Blocker | null {
  if (isOwnProduct) return 'ownProduct'
  if (product.status === 'sold') return 'sold'
  if (product.status !== 'active') return 'unavailable'
  if (product.type !== 'sale') return 'exchange'
  return null
}

/**
 * Checkout de un producto (pasarela simulada).
 *
 * Pide sesión: el botón "Comprar" del detalle ya manda a iniciar sesión, pero
 * se puede llegar escribiendo la ruta. El monto que se cobra es el de
 * GET /payments/quote, no el del producto, porque es el que usa el backend.
 */
export default function CheckoutPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { productId: rawId } = useParams({ from: '/checkout/$productId' })
  const parsed = Number(rawId)
  const productId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const { isLoggedIn, isLoading: isLoadingUser, data: currentUser } = useCurrentUser()
  const product = useProduct(productId, isLoggedIn)
  const quote = usePaymentQuote(productId, isLoggedIn)
  // GET /products/:id trae el id de usuario del vendedor, así que comparar
  // alcanza. Mientras no haya cargado el producto no se sabe, y vale `false`:
  // el backend igual rechaza comprarse a uno mismo.
  const sellerUserId = product.data?.seller.userId
  const isOwnProduct = sellerUserId !== undefined && currentUser?.id === sellerUserId

  const checkout = useCheckoutMutation()
  // El último rechazo, que se muestra bajo el botón. Se borra al reintentar.
  const [failure, setFailure] = useState<CheckoutFailure | null>(null)

  function handlePay(card: PaymentCardPayload) {
    if (productId === undefined || checkout.isPending) return
    setFailure(null)
    checkout.mutate(
      { productId, card },
      {
        onSuccess: (result) => void navigate({ to: '/compras/$transactionId', params: { transactionId: result.id } }),
        onError: (error) => {
          const next = readCheckoutFailure(error)
          if (next.kind === 'unauthenticated') void navigate({ to: '/login' })
          else setFailure(next)
        },
      },
    )
  }

  const blocker = product.data ? findBlocker(product.data, isOwnProduct) : null
  // Insistir con otra tarjeta no sirve si el producto ya no está a la venta.
  const isClosed = blocker !== null || failure?.kind === 'soldOut' || failure?.kind === 'notFound'

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('checkout.title')}</h1>

        {!isLoggedIn && !isLoadingUser ? (
          <SignedOutState description={t('checkout.signedOut')} />
        ) : productId === undefined || isNotFoundError(product.error) || isNotFoundError(quote.error) ? (
          <ErrorState kind="notFound" title={t('itemDetail.notFound')}>
            <Link to="/explore" className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80">
              {t('explore.title')}
            </Link>
          </ErrorState>
        ) : product.isError || quote.isError ? (
          <QueryErrorState
            error={product.error ?? quote.error}
            onRetry={() => {
              void product.refetch()
              void quote.refetch()
            }}
            texts={{ error: { description: t('checkout.loadError') } }}
          />
        ) : product.isLoading || quote.isLoading || isLoadingUser ? (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]" aria-busy="true">
            <div className="h-[460px] animate-pulse rounded-2xl bg-white" />
            <div className="h-60 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : product.data && quote.data ? (
          <div className="grid items-start gap-6 md:grid-cols-[1fr_320px]">
            {/* En móvil el resumen va arriba: primero se ve qué se paga y
                cuánto, y después se escribe la tarjeta. Desde md vuelve a la
                columna de la derecha. */}
            <CheckoutSummary product={product.data} quote={quote.data} className="md:order-2" />

            <CheckoutForm onPay={handlePay} isPaying={checkout.isPending} disabled={isClosed}>
              {blocker && <PaymentNotice tone="warning" message={t(BLOCKER_MESSAGE[blocker])} backToShop />}
              {!blocker && failure && <FailureNotice failure={failure} />}
            </CheckoutForm>
          </div>
        ) : null}
      </main>
    </div>
  )
}

/** Mensaje del resultado de un intento de pago, bajo el botón. */
function FailureNotice({ failure }: { failure: CheckoutFailure }) {
  const { t } = useLanguage()

  switch (failure.kind) {
    case 'declined':
      return (
        <PaymentNotice
          tone="error"
          message={failure.reason ? t(FAILURE_MESSAGE[failure.reason]) : t('checkout.failure.generic')}
          hint={t('checkout.failure.retryHint')}
        />
      )
    case 'soldOut':
      return <PaymentNotice tone="warning" message={t('checkout.failure.soldOut')} backToShop />
    case 'notFound':
      return <PaymentNotice tone="warning" message={t('checkout.failure.notFound')} backToShop />
    case 'invalidCard':
      return <PaymentNotice tone="error" message={t('checkout.failure.invalidCard')} />
    case 'gatewayDown':
      return <PaymentNotice tone="error" message={t('checkout.failure.gatewayDown')} hint={t('checkout.failure.notCharged')} />
    default:
      return <PaymentNotice tone="error" message={t('checkout.failure.generic')} hint={t('checkout.failure.notCharged')} />
  }
}


