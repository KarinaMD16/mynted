import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import type { ChatProductContext } from '../models/chat'

interface ChatProductCardProps {
  product: ChatProductContext
  /** En el panel del detalle el producto ya está en pantalla: no hace falta enlazarlo. */
  linkToProduct?: boolean
}

/**
 * Tira con el producto del que se está hablando, fija arriba del hilo. Si el
 * producto ya no está disponible lo avisa, pero el chat sigue funcionando.
 */
export function ChatProductCard({ product, linkToProduct = true }: ChatProductCardProps) {
  const { t, language } = useLanguage()
  const price = product.currency ? formatPrice(product.finalPrice, product.currency, language) : null

  const content = (
    <>
      <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-mynted-bg">
        {product.imageUrl && <img src={product.imageUrl} alt="" className="size-full object-cover" />}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-heading text-[13px] font-semibold text-mynted-ink">{product.title}</span>
        <span className="truncate text-xs text-mynted-gray">
          {price ? `${price} · ` : ''}
          {t('chat.product.talkingAbout')}
        </span>
      </span>
    </>
  )

  const boxClass = 'flex max-w-full items-center gap-3 rounded-xl border border-mynted-border bg-white px-3 py-2.5 sm:w-fit sm:max-w-sm'

  return (
    <div className="flex flex-col gap-2 border-b border-mynted-border bg-mynted-bg px-3 py-3 sm:px-4">
      {linkToProduct ? (
        <Link
          to="/products/$productId"
          params={{ productId: String(product.id) }}
          className={`${boxClass} transition-colors hover:border-mynted-orange-hover`}
        >
          {content}
        </Link>
      ) : (
        <div className={boxClass}>{content}</div>
      )}
      {!product.isAvailable && (
        <p role="status" className="rounded-[10px] bg-[#fff4d6] px-3 py-2 text-xs font-medium text-[#8a5a00]">
          {t('chat.product.unavailable')}
        </p>
      )}
    </div>
  )
}
