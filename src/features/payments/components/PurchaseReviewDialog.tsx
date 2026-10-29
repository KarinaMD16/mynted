import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ReviewForm } from '@/features/products/components/ProductReviews'
import { useLanguage } from '@/i18n/LanguageContext'
import { paymentKeys } from '../hooks/usePaymentQueries'
import type { PurchaseItem } from '../models/payment'

/**
 * Reseñar una compra sin salir de "Mis compras". Usa el mismo formulario que el
 * detalle del producto (POST /products/:id/reviews), así que también sirve para
 * un producto que el vendedor borró: quien lo compró lo puede seguir reseñando.
 *
 * Al publicar se vuelve a pedir el historial para que `canReview` /
 * `hasReviewed` cambien (la guía pide refrescarlos después de reseñar).
 */
export function PurchaseReviewDialog({
  purchase,
  open,
  onClose,
}: {
  /** La compra que se reseña; se conserva mientras corre la animación de cierre. */
  purchase: PurchaseItem | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('purchases.review.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('purchases.review.dialogDescription')}</DialogDescription>
        </DialogHeader>

        {purchase && (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-mynted-bg p-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-white">
                {purchase.product.imageUrl && <img src={purchase.product.imageUrl} alt="" className="size-full object-cover" />}
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="truncate font-heading text-sm font-semibold text-mynted-ink">{purchase.product.title}</p>
                <p className="truncate text-xs text-mynted-gray">
                  {t('checkout.summary.seller', { name: purchase.seller.displayName })}
                </p>
              </div>
            </div>

            <div className="mt-4">
              {/* key: cada compra arranca con el formulario vacío. */}
              <ReviewForm
                key={purchase.id}
                productId={purchase.product.id}
                variant="plain"
                onDone={() => {
                  void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
                  toast.success(t('purchases.review.thanks'))
                  onClose()
                }}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
