import type { AdminCommissionTier } from '../models/payment'

/**
 * Comisión base y piso, espejo de COMMISSION_BASE_RATE y COMMISSION_MIN_RATE
 * del backend (valores por defecto en commission.service.ts).
 *
 * Son constantes de entorno del servidor y no se publican en ningún endpoint,
 * así que la vista previa de la matriz las asume. La matriz que de verdad se
 * cobra la calcula el backend; esto solo sirve para ver el efecto de un cambio
 * ANTES de guardarlo. Si alguna vez se cambian esas variables, hay que
 * cambiarlas también acá — o, mejor, pedir que el backend las exponga.
 */
export const BASE_RATE = 0.05
export const MIN_RATE = 0.02

/**
 * La misma fórmula que `calculateRate` del backend: la base menos los dos
 * descuentos, sin bajar del piso, redondeada a cuatro decimales.
 */
export function commissionRate(salesDiscount: number, priceDiscount: number): number {
  const rate = Math.max(BASE_RATE - salesDiscount - priceDiscount, MIN_RATE)
  return Math.round((rate + Number.EPSILON) * 10000) / 10000
}

/** Los rangos activos de un tipo, ordenados como se recorren (de menor a mayor). */
export function activeTiersInOrder(tiers: AdminCommissionTier[]): AdminCommissionTier[] {
  return tiers.filter((tier) => tier.isActive).sort((a, b) => a.minValue - b.minValue)
}

/**
 * Hueco o solape entre rangos consecutivos: el backend busca el rango por
 * `minValue <= valor < maxValue`, así que un hueco deja montos sin rango y un
 * solape hace que gane cualquiera de los dos. Devuelve el nombre del primer
 * rango con problema, o null si la escala está bien.
 */
export function findRangeProblem(tiers: AdminCommissionTier[]): { tier: AdminCommissionTier; kind: 'gap' | 'overlap' } | null {
  const ordered = activeTiersInOrder(tiers)
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!
    const current = ordered[index]!
    // Un rango sin tope debería ser el último: todo lo que venga después solapa.
    if (previous.maxValue === null) return { tier: current, kind: 'overlap' }
    if (previous.maxValue < current.minValue) return { tier: current, kind: 'gap' }
    if (previous.maxValue > current.minValue) return { tier: current, kind: 'overlap' }
  }
  return null
}

/** Una fila de la matriz de vista previa: un nivel de ventas con su comisión en cada rango de precio. */
export interface PreviewRow {
  salesTier: AdminCommissionTier
  cells: { priceTier: AdminCommissionTier; rate: number }[]
}

/** Matriz que resultaría de estos rangos, para verla antes de guardar. */
export function buildPreviewMatrix(
  salesTiers: AdminCommissionTier[],
  priceTiers: AdminCommissionTier[],
): PreviewRow[] {
  const prices = activeTiersInOrder(priceTiers)
  return activeTiersInOrder(salesTiers).map((salesTier) => ({
    salesTier,
    cells: prices.map((priceTier) => ({
      priceTier,
      rate: commissionRate(salesTier.discount, priceTier.discount),
    })),
  }))
}
