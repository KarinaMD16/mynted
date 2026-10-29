import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleCheck, Clock3, ShoppingBag } from 'lucide-react'
import { paymentKeys, useMyPurchases } from '@/features/payments/hooks/usePaymentQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import type { ChatConversationContext } from '../models/chat'

interface ChatBuyBarProps {
  context: ChatConversationContext
  /** El vendedor ya escribió: lo dice el historial o llegó un mensaje suyo en vivo. */
  sellerHasReplied: boolean
  /** Cierra el chat (burbuja o panel) al ir a pagar, para que se vea el checkout. */
  onClose?: () => void
}

/**
 * Barra de compra arriba de la caja de texto. Solo la ve el comprador de un
 * producto a la venta que se puede comprar. Se compra después de hablar: hasta
 * que el vendedor responde muestra el aviso (el backend responde 403 al
 * checkout sin respuesta suya, ver PaymentsService.assertSellerHasReplied).
 * Si ya lo compró, en vez de "Comprar" lleva al recibo de esa compra.
 */
export function ChatBuyBar({ context, sellerHasReplied, onClose }: ChatBuyBarProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const { product } = context
  const isBuyer = context.viewerRole === 'buyer' && context.productType !== 'exchange'
  // Las compras más recientes (primera página): alcanza para la que se acaba de hacer.
  const purchases = useMyPurchases(isBuyer)
  const purchase = purchases.data?.pages
    .flatMap((page) => page.data)
    .find((item) => item.product.id === product.id && item.paymentStatus === 'completed')

  if (!isBuyer || purchases.isPending) return null
  if (purchase) {
    return (
      <div className="flex items-center justify-between gap-3 border-t border-mynted-border bg-mynted-bg px-3 py-2.5 sm:px-4">
        <p className="flex min-w-0 items-center gap-2 text-xs text-mynted-gray">
          <CircleCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
          {t('chat.buy.purchased')}
        </p>
        <Link
          to="/compras/$transactionId"
          params={{ transactionId: purchase.id }}
          onClick={() => onClose?.()}
          className="shrink-0 rounded-[10px] border border-mynted-border bg-white px-3.5 py-2 text-xs font-semibold text-mynted-ink outline-none transition-colors hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
        >
          {t('chat.buy.viewPurchase')}
        </Link>
      </div>
    )
  }
  if (!product.isAvailable) return null

  return (
    <div className="flex items-center justify-between gap-3 border-t border-mynted-border bg-mynted-bg px-3 py-2.5 sm:px-4">
      {sellerHasReplied ? (
        <>
          <p className="min-w-0 text-xs text-mynted-gray">{t('chat.buy.ready')}</p>
          <Link
            to="/checkout/$productId"
            params={{ productId: String(product.id) }}
            onClick={() => {
              // Una cotización rechazada antes de la respuesta (403) quedó en caché: se vuelve a pedir.
              void queryClient.invalidateQueries({ queryKey: [...paymentKeys.all, 'quote', product.id] })
              onClose?.()
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-mynted-orange px-3.5 py-2 text-xs font-semibold text-white outline-none transition-colors hover:bg-mynted-orange-hover focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
          >
            <ShoppingBag className="size-3.5" aria-hidden="true" />
            {t('chat.buy.cta')}
          </Link>
        </>
      ) : (
        <p role="status" className="flex items-center gap-2 text-xs text-mynted-gray">
          <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
          {t('chat.buy.waiting', { seller: context.otherParticipant.displayName })}
        </p>
      )}
    </div>
  )
}
