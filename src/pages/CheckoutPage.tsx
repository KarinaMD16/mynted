import { cx } from '@/utils/cx'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { getHttpStatus, isNotFoundError } from '@/api/apiError'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useContactSeller } from '@/features/chat/hooks/useContactSeller'
import { CheckoutForm, type CheckoutShippingOptions } from '@/features/payments/components/CheckoutForm'
import { CheckoutSummary } from '@/features/payments/components/CheckoutSummary'
import { PaymentNotice } from '@/features/payments/components/PaymentNotice'
import {
  readCheckoutFailure,
  readStockConflict,
  useCheckoutMutation,
  type CheckoutFailure,
} from '@/features/payments/hooks/usePaymentMutations'
import { usePaymentQuote } from '@/features/payments/hooks/usePaymentQueries'
import type {
  PaymentCardPayload,
  PaymentFailureReason,
  ShippingAddressPayload,
} from '@/features/payments/models/payment'
import { useProduct } from '@/features/products/hooks/useProductQueries'
import type { ProductDetail } from '@/features/products/models/product'
import { useShipTo } from '@/features/region/hooks/useShipTo'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { regionFlag, regionName } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'

/** Por qué rechazó la pasarela, en palabras (ver PaymentFailureReason). */
const FAILURE_MESSAGE: Record<PaymentFailureReason, TranslationKey> = {
  card_declined: 'checkout.failure.cardDeclined',
  insufficient_funds: 'checkout.failure.insufficientFunds',
  expired_card: 'checkout.failure.expiredCard',
}

/** Por qué no se puede comprar este producto, antes siquiera de pedir la tarjeta. */
type Blocker = 'sold' | 'unavailable' | 'exchange' | 'ownProduct' | 'noShipping'

const BLOCKER_MESSAGE: Record<Blocker, TranslationKey> = {
  sold: 'checkout.blocked.soldOut',
  unavailable: 'checkout.blocked.unavailable',
  exchange: 'checkout.blocked.exchange',
  ownProduct: 'checkout.blocked.ownProduct',
  noShipping: 'checkout.blocked.noShipping',
}

function findBlocker(product: ProductDetail, isOwnProduct: boolean): Blocker | null {
  if (isOwnProduct) return 'ownProduct'
  // Agotado: vendido a mano o sin unidades (quantity 0).
  if (product.status === 'sold' || product.quantity === 0) return 'sold'
  if (product.status !== 'active') return 'unavailable'
  if (product.type !== 'sale') return 'exchange'
  // Sin países de envío el backend no acepta ninguna dirección.
  if (!product.shipsTo?.length) return 'noShipping'
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
  const { t, language } = useLanguage()
  const { shipTo } = useShipTo()
  const navigate = useNavigate()
  const { productId: rawId } = useParams({ from: '/checkout/$productId' })
  const parsed = Number(rawId)
  const productId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const { isLoggedIn, isLoading: isLoadingUser, data: currentUser } = useCurrentUser()
  const product = useProduct(productId, isLoggedIn)
  const [quantity, setQuantity] = useState(1)
  // GET /products/:id trae el id de usuario del vendedor, así que comparar
  // alcanza. Mientras no haya cargado el producto no se sabe, y vale `false`:
  // el backend igual rechaza comprarse a uno mismo.
  const sellerUserId = product.data?.seller.userId
  const isOwnProduct = sellerUserId !== undefined && currentUser?.id === sellerUserId
  // Sin chat con respuesta del vendedor la cotización da 403, también al dueño:
  // se pide solo cuando se sabe que el producto es de otro.
  const quote = usePaymentQuote(productId, quantity, isLoggedIn && product.data !== undefined && !isOwnProduct)

  const checkout = useCheckoutMutation()
  // El último rechazo, que se muestra bajo el botón. Se borra al reintentar.
  const [failure, setFailure] = useState<CheckoutFailure | null>(null)

  // Solo los países a los que envía el vendedor; el de quien compra va
  // elegido si está entre ellos. Si no, queda vacío y se le avisa.
  const shipsTo = product.data?.shipsTo
  const shipping = useMemo<CheckoutShippingOptions | undefined>(() => {
    if (!shipsTo?.length) return undefined
    const countries = shipsTo
      .map((region) => ({
        value: region,
        label: `${regionFlag(region)} ${regionName(region, language)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, language))
    return {
      countries,
      defaultCountry: shipTo && shipsTo.includes(shipTo) ? shipTo : '',
    }
  }, [shipsTo, shipTo, language])
  const notShippingToBuyer = Boolean(shipping && shipTo && !shipsTo?.includes(shipTo))

  function handlePay(card: PaymentCardPayload, shippingAddress?: ShippingAddressPayload) {
    if (productId === undefined || !shippingAddress || checkout.isPending) return
    setFailure(null)
    checkout.mutate(
      { productId, quantity, card, shippingAddress },
      {
        onSuccess: (result) =>
          void navigate({
            to: '/compras/$transactionId',
            params: { transactionId: result.id },
          }),
        onError: (error) => {
          const next = readCheckoutFailure(error)
          if (next.kind === 'unauthenticated') {
            void navigate({ to: '/login' })
            return
          }
          // Quedan menos unidades de las pedidas: se baja la cantidad a lo que
          // hay (la cotización se recalcula sola) y el aviso explica por qué.
          if (next.kind === 'notEnoughStock' && next.available !== null && next.available > 0) {
            setQuantity(Math.min(quantity, next.available))
          }
          setFailure(next)
        },
      },
    )
  }

  const blocker = product.data ? findBlocker(product.data, isOwnProduct) : null
  // Insistir con otra tarjeta no sirve si el producto ya no está a la venta.
  const isClosed = blocker !== null || failure?.kind === 'soldOut' || failure?.kind === 'notFound'
  // El stock vigente lo dice la cotización; nunca menos de 1 para el selector.
  const maxQuantity = Math.max(1, quote.data?.availableQuantity ?? 1)

  // La cotización también responde 409 si el stock bajó mientras se elegía la
  // cantidad (alguien más compró): se ajusta a lo que queda en vez de mostrar
  // un error, o se avisa que se agotó.
  const quoteStock = readStockConflict(quote.error)
  const quoteAvailable = quoteStock?.kind === 'notEnoughStock' ? quoteStock.available : null
  const [stockAdjustedTo, setStockAdjustedTo] = useState<number | null>(null)
  // Mientras se baja la cantidad y llega la cotización nueva, se ve la carga (no un error).
  const isAdjustingStock = quoteAvailable !== null && quoteAvailable > 0 && !quote.data
  // Se ajusta durante el render (patrón de React para derivar estado de otro dato),
  // así no hay un render intermedio con la cantidad que ya no alcanza.
  if (quoteAvailable !== null && quoteAvailable > 0 && quantity > quoteAvailable) {
    setQuantity(quoteAvailable)
    setStockAdjustedTo(quoteAvailable)
  }

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 py-10 sm:py-12')}>
        <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('checkout.title')}</h1>

        {!isLoggedIn && !isLoadingUser ? (
          <SignedOutState description={t('checkout.signedOut')} />
        ) : productId === undefined || isNotFoundError(product.error) || isNotFoundError(quote.error) ? (
          <ErrorState kind="notFound" title={t('itemDetail.notFound')}>
            <Link
              to="/explore"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
            >
              {t('explore.title')}
            </Link>
          </ErrorState>
        ) : quoteStock?.kind === 'soldOut' ? (
          <ErrorState kind="empty" title={t('checkout.blocked.soldOut')} description={t('checkout.soldOutBody')}>
            <Link
              to="/explore"
              className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80"
            >
              {t('explore.title')}
            </Link>
          </ErrorState>
        ) : getHttpStatus(quote.error) === 403 ? (
          // Se compra después de hablar: la cotización pide que el vendedor ya haya respondido.
          <ChatRequiredState productId={productId} />
        ) : product.isError || (quote.isError && !isAdjustingStock) ? (
          <QueryErrorState
            error={product.error ?? quote.error}
            onRetry={() => {
              void product.refetch()
              void quote.refetch()
            }}
            texts={{ error: { description: t('checkout.loadError') } }}
          />
        ) : product.isLoading || (quote.isLoading && !quote.data) || isLoadingUser || isAdjustingStock ? (
          <div className="grid gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_400px] lg:gap-8" aria-busy="true">
            <div className="h-[460px] animate-pulse rounded-2xl bg-white" />
            <div className="h-60 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : product.data && quote.data ? (
          <div className="grid items-start gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_400px] lg:gap-8">
            {/* En móvil el resumen va arriba: primero se ve qué se paga y
                cuánto, y después se escribe la tarjeta. Desde md vuelve a la
                columna de la derecha. */}
            <CheckoutSummary
              product={product.data}
              quote={quote.data}
              quantity={quantity}
              maxQuantity={maxQuantity}
              onQuantityChange={(next) => {
                setQuantity(next)
                setStockAdjustedTo(null)
                // Un "no alcanza el stock" ya no vale con otra cantidad.
                if (failure?.kind === 'notEnoughStock') setFailure(null)
              }}
              isUpdating={quote.isFetching}
              disabled={isClosed || checkout.isPending}
              className="md:order-2"
            />
            {/* key: el formulario arranca con el país de quien compra, y ese
                dato llega con el producto. */}
            <CheckoutForm
              key={product.data.id}
              onPay={handlePay}
              shipping={shipping}
              isPaying={checkout.isPending}
              disabled={isClosed}
            >
              {!blocker && notShippingToBuyer && shipTo && (
                <PaymentNotice
                  tone="warning"
                  message={t('checkout.shipping.notToYourCountry', {
                    country: regionName(shipTo, language),
                  })}
                />
              )}
              {blocker && <PaymentNotice tone="warning" message={t(BLOCKER_MESSAGE[blocker])} backToShop />}
              {!blocker && !failure && stockAdjustedTo !== null && (
                <PaymentNotice tone="warning" message={t('checkout.stockAdjusted', { count: stockAdjustedTo })} />
              )}
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
    case 'shippingNotAllowed':
      return (
        <PaymentNotice
          tone="error"
          message={t('checkout.failure.shippingNotAllowed')}
          hint={t('checkout.failure.notCharged')}
        />
      )
    case 'notEnoughStock':
      return (
        <PaymentNotice
          tone="error"
          message={
            failure.available !== null && failure.available > 0
              ? t('checkout.failure.notEnoughStockCount', { count: failure.available })
              : t('checkout.failure.notEnoughStock')
          }
          hint={t('checkout.failure.notCharged')}
        />
      )
    case 'notFound':
      return <PaymentNotice tone="warning" message={t('checkout.failure.notFound')} backToShop />
    case 'invalidCard':
      return <PaymentNotice tone="error" message={t('checkout.failure.invalidCard')} />
    case 'gatewayDown':
      return (
        <PaymentNotice
          tone="error"
          message={t('checkout.failure.gatewayDown')}
          hint={t('checkout.failure.notCharged')}
        />
      )
    case 'chatRequired':
      return (
        <PaymentNotice
          tone="warning"
          message={t('checkout.failure.chatRequired')}
          hint={t('checkout.failure.notCharged')}
        />
      )
    default:
      return (
        <PaymentNotice tone="error" message={t('checkout.failure.generic')} hint={t('checkout.failure.notCharged')} />
      )
  }
}

/** Sin respuesta del vendedor en el chat todavía no se puede pagar: se invita a escribirle. */
function ChatRequiredState({ productId }: { productId: number }) {
  const { t } = useLanguage()
  const { contact, isOpening } = useContactSeller()

  return (
    <ErrorState
      kind="forbidden"
      eyebrow={t('checkout.chatRequired.eyebrow')}
      title={t('checkout.chatRequired.title')}
      description={t('checkout.chatRequired.body')}
    >
      <button
        type="button"
        onClick={() => contact(productId)}
        disabled={isOpening}
        className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80 disabled:opacity-60"
      >
        {t('checkout.chatRequired.cta')}
      </button>
    </ErrorState>
  )
}
