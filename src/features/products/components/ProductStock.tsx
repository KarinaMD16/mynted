import { Package, PackageX } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { INTL_LOCALES } from '@/utils/locale'
import type { StockFields } from '../models/product'
import { getStockState, LOW_STOCK_THRESHOLD } from '../utils/stock'

/**
 * Unidades disponibles en el detalle del producto (sección 14 de la guía):
 * - Agotado → pastilla roja.
 * - Pocas unidades (≤ 3) → "¡Última unidad!" / "Solo quedan N", en ámbar.
 * - Si no → "N disponibles", en neutro.
 * Un producto pausado o borrador ya tiene su aviso arriba: aquí no se repite.
 */
export function ProductStock({ product }: { product: StockFields & { status?: string | null } }) {
  const { t, language } = useLanguage()
  const stock = getStockState(product)

  if (stock === 'soldOut') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdecec] px-3 py-1 text-xs font-semibold text-[#c62a2f]">
        <PackageX className="size-3.5" aria-hidden="true" />
        {t('products.stock.soldOut')}
      </span>
    )
  }

  if (stock === 'unavailable' || product.quantity === undefined) return null

  const quantity = product.quantity
  const isLow = quantity <= LOW_STOCK_THRESHOLD

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isLow ? 'bg-[#fff4d6] text-[#8a5a00]' : 'bg-mynted-bg text-mynted-ink ring-1 ring-mynted-border'
      }`}
    >
      <Package className="size-3.5" aria-hidden="true" />
      {quantity === 1
        ? t('products.stock.lastUnit')
        : isLow
          ? t('products.stock.few', { count: quantity })
          : t('products.stock.available', { count: quantity.toLocaleString(INTL_LOCALES[language]) })}
    </span>
  )
}
