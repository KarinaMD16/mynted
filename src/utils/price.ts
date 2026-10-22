import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'

/**
 * Precio con el formato del idioma activo. El backend manda los montos como
 * string (columna numeric), asi que tambien se acepta string. Intl ya usa los
 * decimales oficiales de cada moneda (0 en CLP y KRW, 2 en las demas).
 */
export function formatPrice(price: string | number, currency: string, language: AppLanguage): string {
  const value = typeof price === 'number' ? price : Number(price)
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/**
 * Campos que el backend agrega a cada producto con el precio convertido a la
 * moneda de visualización del usuario (ver utils/displayCurrency.ts y
 * docs/GUIA_MONEDA_FRONTEND.md del backend). Son opcionales porque algunos
 * endpoints no los traen (GET /products/me, crear/editar, la bandeja del chat).
 */
export interface DisplayPriceFields {
  /** `price` convertido; null si no hay tipo de cambio. */
  displayPrice?: number | null
  /** `finalPrice` (con descuento) convertido; null si no hay tipo de cambio. */
  displayFinalPrice?: number | null
  /** Moneda en la que el backend resolvió los precios de este request. */
  displayCurrency?: string
  /** true si el precio se convirtió; false si ya estaba en esa moneda o no hubo tasa. */
  isConverted?: boolean
}

interface PricedProduct extends DisplayPriceFields {
  price: string | number
  finalPrice?: number | null
  currency: string
}

/** Precio listo para pintar: convertido si se pudo, original si no. */
export interface ShownPrice {
  price: number
  /** Precio con descuento; igual a `price` si no hay descuento. */
  finalPrice: number
  currency: string
  /** true = monto aproximado en la moneda del usuario (se cobra en la moneda del producto). */
  isConverted: boolean
}

/**
 * Elige qué monto mostrar. Si el backend convirtió el precio se usa el
 * convertido, para que todos los productos se vean en la misma moneda; si no
 * hubo tipo de cambio (`displayPrice: null`) se cae al precio original.
 */
export function shownPrice(product: PricedProduct): ShownPrice {
  const price = Number(product.price)
  const finalPrice = product.finalPrice != null ? Number(product.finalPrice) : price

  if (product.isConverted === true && product.displayPrice != null && product.displayCurrency) {
    return {
      price: product.displayPrice,
      finalPrice: product.displayFinalPrice ?? product.displayPrice,
      currency: product.displayCurrency,
      isConverted: true,
    }
  }
  return { price, finalPrice, currency: product.currency, isConverted: false }
}

/** Solo los campos `display*` de un producto, para pasarlos a otra forma de tarjeta. */
export function displayFieldsOf(product: DisplayPriceFields): DisplayPriceFields {
  return {
    displayPrice: product.displayPrice,
    displayFinalPrice: product.displayFinalPrice,
    displayCurrency: product.displayCurrency,
    isConverted: product.isConverted,
  }
}
