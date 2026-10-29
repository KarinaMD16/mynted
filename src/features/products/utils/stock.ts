import type { TranslationKey } from '@/i18n/translations/es'
import type { StockFields } from '../models/product'

/**
 * Estado de stock de un producto para pintarlo (sección 14 de la guía):
 * - `soldOut`: agotado (`status: 'sold'` o `quantity: 0`).
 * - `unavailable`: no se puede comprar por otra razón (pausado, oculto…):
 *   `isAvailable: false` sin estar agotado.
 * - `available`: a la venta.
 * Si el listado no trae los campos, se asume disponible (es lo que eran los
 * productos antes del stock).
 */
export type StockState = 'soldOut' | 'unavailable' | 'available'

/** Pocas unidades: se avisa "solo quedan N" para dar urgencia sin alarmar. */
export const LOW_STOCK_THRESHOLD = 3

export function getStockState(product: StockFields & { status?: string | null }): StockState {
  if (product.status === 'sold' || product.quantity === 0) return 'soldOut'
  if (product.isAvailable === false) return 'unavailable'
  return 'available'
}

/** Etiqueta corta para una tarjeta ("Agotado" / "No disponible"); null si está a la venta. */
export const STOCK_LABEL: Record<Exclude<StockState, 'available'>, TranslationKey> = {
  soldOut: 'products.stock.soldOut',
  unavailable: 'products.stock.unavailable',
}

/**
 * Etiqueta de estado en una tarjeta: borrador y pausado por su estado; agotado
 * o no disponible por el stock. null si está a la venta (no se pinta nada).
 */
export function getProductBadgeKey(product: StockFields & { status?: string | null }): TranslationKey | null {
  if (product.status === 'draft') return 'products.status.draft'
  if (product.status === 'inactive') return 'products.status.inactive'
  const stock = getStockState(product)
  return stock === 'available' ? null : STOCK_LABEL[stock]
}
