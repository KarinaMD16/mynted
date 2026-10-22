/**
 * Productos vistos recientemente en este navegador. Sirven como señal para
 * GET /products/recommended cuando no hay sesión (con sesión el backend usa los
 * que registra POST /products/:id/view). El backend admite como máximo 10 ids.
 */
const STORAGE_KEY = 'mynted_recent_products'
export const MAX_RECENT_PRODUCTS = 10

export function readRecentProductIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0).slice(0, MAX_RECENT_PRODUCTS)
  } catch {
    // sin localStorage o con el valor corrupto: simplemente no hay historial
    return []
  }
}

/** Guarda el producto como el más reciente (sin repetirlo) y devuelve la lista nueva. */
export function rememberRecentProduct(productId: number): number[] {
  const next = [productId, ...readRecentProductIds().filter((id) => id !== productId)].slice(0, MAX_RECENT_PRODUCTS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sin localStorage: el historial de esta sesión se pierde y ya
  }
  return next
}
