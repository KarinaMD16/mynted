/** Porcentaje de descuento como número válido (> 0), o null si no hay descuento. */
export function discountOf(discountPercent: number | string | null | undefined): number | null {
  const value = Number(discountPercent)
  return Number.isFinite(value) && value > 0 ? value : null
}
