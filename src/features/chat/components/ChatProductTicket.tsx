import type { Ref } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatPrice, shownPrice } from '@/utils/price'
import type { ChatProductContext } from '../models/chat'

interface ChatProductTicketProps {
  product: ChatProductContext
  /** En el panel del detalle el producto ya está en pantalla: sin "Ver producto". */
  linkToProduct?: boolean
  /** Para saber si la ficha está a la vista (ver MessageThread). */
  ref?: Ref<HTMLDivElement>
}

/**
 * "Ficha" del producto al principio del hilo: la conversación siempre es sobre
 * un objeto, así que arranca presentándolo, como una etiqueta de coleccionable
 * (foto, nombre, precio y estado), con una línea punteada de "ticket". Mientras
 * se ve, la tira fija de arriba (ChatProductCard) no hace falta; ver ChatPanel.
 */
export function ChatProductTicket({ product, linkToProduct = true, ref }: ChatProductTicketProps) {
  const { t, language } = useLanguage()
  // Convertido a la moneda del usuario si el backend lo trae; si no, el original.
  const shown = product.currency ? shownPrice({ ...product, currency: product.currency }) : null
  const hasDiscount = shown !== null && shown.finalPrice < shown.price
  const status = product.status === 'sold' ? 'sold' : product.isAvailable ? 'available' : 'unavailable'

  return (
    <div ref={ref} className="mx-auto mb-2 w-full max-w-[340px] pt-2">
      <p className="mb-2 text-center text-[11px] font-semibold tracking-[0.12em] text-mynted-gray uppercase [:lang(ko)_&]:tracking-normal">
        {t('chat.ticket.label')}
      </p>
      <div className="overflow-hidden rounded-2xl border border-mynted-border bg-white shadow-[0_2px_10px_rgba(13,13,20,0.05)]">
        <div className="relative aspect-[4/3] bg-mynted-bg">
          {product.imageUrl && <img src={product.imageUrl} alt="" className="size-full object-cover" />}
          <span
            className={cx(
              'absolute top-2.5 left-2.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
              status === 'available' ? 'bg-white text-[#0d8c66]' : 'bg-[#fff4d6] text-[#8a5a00]',
            )}
          >
            {t(`chat.ticket.${status}`)}
          </span>
        </div>

        {/* Línea punteada: el "corte" de una etiqueta. */}
        <div className="border-t border-dashed border-mynted-border" aria-hidden="true" />

        <div className="flex items-end justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="line-clamp-2 font-heading text-[15px] leading-snug font-semibold text-mynted-ink">{product.title}</p>
            {shown && (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-heading text-lg font-semibold text-mynted-ink">
                  {shown.isConverted && <span aria-hidden="true">≈ </span>}
                  {formatPrice(shown.finalPrice, shown.currency, language)}
                </span>
                {hasDiscount && <s className="text-xs text-mynted-gray">{formatPrice(shown.price, shown.currency, language)}</s>}
              </p>
            )}
          </div>
          {linkToProduct && (
            <Link
              to="/products/$productId"
              params={{ productId: String(product.id) }}
              className="flex shrink-0 items-center gap-1 rounded-[10px] bg-[#f3f3f2] px-3 py-2 text-xs font-semibold text-mynted-ink outline-none transition-colors hover:bg-[#ffdfd1] hover:text-mynted-orange focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
            >
              {t('chat.ticket.view')}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
