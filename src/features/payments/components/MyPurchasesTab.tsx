import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleCheck, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProfileFeedFrame } from '@/features/community/components/profile/ProfileFeedFrame'
import { useLastDefined } from '@/hooks/useLastDefined'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import { useMyPurchases } from '../hooks/usePaymentQueries'
import type { PurchaseItem } from '../models/payment'
import { OrderStatusPill } from './OrderTracking'
import { PurchaseReviewDialog } from './PurchaseReviewDialog'
import { formatPaymentDateShort, maskedCard } from '../utils/paymentFormat'

/**
 * "Mis compras": las compras completadas de quien mira, paginadas, con enlace
 * al recibo de cada una. Vive en el perfil y en /compras (ver MyPurchasesPage).
 */
export function MyPurchasesTab() {
  const query = useMyPurchases()
  const purchases = query.data?.pages.flatMap((page) => page.data) ?? []
  // Compra que se está reseñando (diálogo). Se conserva durante la animación de cierre.
  const [reviewing, setReviewing] = useState<PurchaseItem | null>(null)
  const shownReview = useLastDefined(reviewing)

  return (
    <ProfileFeedFrame
      query={query}
      isEmpty={purchases.length === 0}
      emptyTitle="purchases.empty.title"
      emptySubtitle="purchases.empty.subtitle"
    >
      <ul className="flex flex-col gap-3">
        {purchases.map((purchase) => (
          <li key={purchase.id}>
            <PurchaseRow purchase={purchase} onReview={() => setReviewing(purchase)} />
          </li>
        ))}
      </ul>
      <PurchaseReviewDialog purchase={shownReview} open={reviewing !== null} onClose={() => setReviewing(null)} />
    </ProfileFeedFrame>
  )
}

/**
 * Acción de reseña de una compra, según lo que diga el backend:
 * - `canReview` → botón "Reseñar" (abre el diálogo).
 * - `hasReviewed` → "Ver tu reseña" en el detalle, donde se edita; si el
 *   producto se borró (el detalle da 404) solo se indica que ya se reseñó.
 * - Ninguno (reembolsada, intercambio…) → nada.
 * Va por encima del enlace estirado de la fila (relative z-10).
 */
function ReviewAction({ purchase, onReview }: { purchase: PurchaseItem; onReview: () => void }) {
  const { t } = useLanguage()

  if (purchase.canReview) {
    return (
      <Button type="button" variant="secondary" size="sm" className="relative z-10" onClick={onReview}>
        <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
        {t('purchases.review.cta')}
      </Button>
    )
  }

  if (!purchase.hasReviewed) return null

  if (purchase.productDeleted) {
    return (
      <span className="relative z-10 flex items-center gap-1 text-xs font-medium text-[#0d8c66]">
        <CircleCheck className="size-3.5" aria-hidden="true" />
        {t('purchases.review.done')}
      </span>
    )
  }

  return (
    <Link
      to="/products/$productId"
      params={{ productId: String(purchase.product.id) }}
      hash="reviews"
      className="relative z-10 flex items-center gap-1 rounded-md text-xs font-semibold text-mynted-blue outline-none hover:underline focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
    >
      <CircleCheck className="size-3.5 text-[#0d8c66]" aria-hidden="true" />
      {t('purchases.review.view')}
    </Link>
  )
}

/** Una compra: foto, producto, vendedor, fecha, tarjeta y monto. Toda la fila abre el recibo. */
function PurchaseRow({ purchase, onReview }: { purchase: PurchaseItem; onReview: () => void }) {
  const { t, language } = useLanguage()

  return (
    <article className="relative flex items-center gap-3.5 rounded-2xl border border-mynted-border bg-white p-3.5 transition-colors hover:border-mynted-orange/50">
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-mynted-bg">
        {purchase.product.imageUrl && <img src={purchase.product.imageUrl} alt="" loading="lazy" className="size-full object-cover" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="truncate font-heading text-sm font-semibold text-mynted-ink">
          {/* Enlace estirado: toda la tarjeta lleva al recibo. */}
          <Link
            to="/compras/$transactionId"
            params={{ transactionId: purchase.id }}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:underline"
          >
            {purchase.product.title}
          </Link>
        </h3>
        <p className="truncate text-xs text-mynted-gray">
          {t('checkout.summary.seller', { name: purchase.seller.displayName })}
        </p>
        <div className="mt-1">
          <OrderStatusPill paymentStatus={purchase.paymentStatus} shippingStatus={purchase.shippingStatus} />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-mynted-gray">
          <span>{formatPaymentDateShort(purchase.completedAt, language)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{maskedCard(purchase.cardLast4)}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="flex items-center gap-1.5">
          <span className="font-heading text-sm font-semibold text-mynted-ink">
            {formatPrice(purchase.amount, purchase.currency, language)}
          </span>
          <ChevronRight className="size-4 text-mynted-gray" aria-hidden="true" />
        </span>
        <ReviewAction purchase={purchase} onReview={onReview} />
      </div>
    </article>
  )
}
