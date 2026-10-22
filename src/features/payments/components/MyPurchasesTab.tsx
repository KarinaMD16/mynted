import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { ProfileFeedFrame } from '@/features/community/components/profile/ProfileFeedFrame'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/price'
import { useMyPurchases } from '../hooks/usePaymentQueries'
import type { PurchaseItem } from '../models/payment'
import { formatPaymentDateShort, maskedCard } from '../utils/paymentFormat'

/**
 * "Mis compras": las compras completadas de quien mira, paginadas, con enlace
 * al recibo de cada una. Vive en el perfil y en /compras (ver MyPurchasesPage).
 */
export function MyPurchasesTab() {
  const query = useMyPurchases()
  const purchases = query.data?.pages.flatMap((page) => page.data) ?? []

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
            <PurchaseRow purchase={purchase} />
          </li>
        ))}
      </ul>
    </ProfileFeedFrame>
  )
}

/** Una compra: foto, producto, vendedor, fecha, tarjeta y monto. Toda la fila abre el recibo. */
function PurchaseRow({ purchase }: { purchase: PurchaseItem }) {
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
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-mynted-gray">
          <span>{formatPaymentDateShort(purchase.completedAt, language)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{maskedCard(purchase.cardLast4)}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="font-heading text-sm font-semibold text-mynted-ink">
          {formatPrice(purchase.amount, purchase.currency, language)}
        </span>
        <ChevronRight className="size-4 text-mynted-gray" aria-hidden="true" />
      </div>
    </article>
  )
}
