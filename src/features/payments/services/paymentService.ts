import myntedAPI from '@/api/apiConfig'
import type {
  AdminCommissionTier,
  AdminCommissionTierFilters,
  AdminCommissionTierPayload,
  AdminPaymentSummary,
  CheckoutPayload,
  CheckoutResult,
  CommissionEstimate,
  CommissionProfile,
  CommissionTiers,
  PaymentPeriodFilters,
  PaymentQuote,
  PaymentReceipt,
  PurchasePage,
  SalePage,
  SalesSummary,
} from '../models/payment'

/**
 * GET /payments/quote/:productId — precio, moneda y, si es un producto propio,
 * la comisión. Pide sesión. Se consulta al abrir el checkout para mostrar el
 * total antes de cobrar nada.
 */
export async function getQuote(productId: number): Promise<PaymentQuote> {
  const { data } = await myntedAPI.get<PaymentQuote>(`/payments/quote/${productId}`)
  return data
}

/**
 * POST /payments/checkout — cobra el producto con la pasarela simulada.
 *
 * La Idempotency-Key va en el header y es obligatoria (8–128 caracteres): el
 * backend guarda la transacción con esa clave, así que si la misma petición
 * llega dos veces (reintento por red, doble clic) solo se cobra una vez.
 * Repetir una clave que terminó en rechazo vuelve a responder el mismo 402,
 * por eso cada intento nuevo del usuario estrena clave (ver useCheckout).
 *
 * Respuestas que no son 200 y sí son parte del flujo normal:
 * - 402 con `{ transactionId, failureReason }` -> la tarjeta fue rechazada.
 * - 409 -> el producto ya no está disponible (alguien más lo compró).
 */
export async function checkout(payload: CheckoutPayload, idempotencyKey: string): Promise<CheckoutResult> {
  const { data } = await myntedAPI.post<CheckoutResult>('/payments/checkout', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

/** GET /payments/:id — recibo de una transacción propia (comprador o vendedor). */
export async function getReceipt(transactionId: string): Promise<PaymentReceipt> {
  const { data } = await myntedAPI.get<PaymentReceipt>(`/payments/${transactionId}`)
  return data
}

/** GET /payments/me/purchases — compras completadas, paginadas. */
export async function getMyPurchases(page: number, limit: number): Promise<PurchasePage> {
  const { data } = await myntedAPI.get<PurchasePage>('/payments/me/purchases', { params: { page, limit } })
  return data
}

/** GET /payments/me/sales — ventas completadas con su comisión, paginadas (solo vendedores). */
export async function getMySales(page: number, limit: number): Promise<SalePage> {
  const { data } = await myntedAPI.get<SalePage>('/payments/me/sales', { params: { page, limit } })
  return data
}

/**
 * GET /payments/me/sales/summary — bruto, comisiones y neto del periodo.
 * `from`/`to` son YYYY-MM-DD; sin ellos, el resumen es de todo el historial.
 */
export async function getMySalesSummary(filters: PaymentPeriodFilters): Promise<SalesSummary> {
  const { data } = await myntedAPI.get<SalesSummary>('/payments/me/sales/summary', { params: filters })
  return data
}

/** GET /commission-tiers?currency= — rangos activos de comisión (público). */
export async function getCommissionTiers(currency: string): Promise<CommissionTiers> {
  const { data } = await myntedAPI.get<CommissionTiers>('/commission-tiers', { params: { currency } })
  return data
}

/** GET /sellers/me/commission — nivel, progreso y matriz del vendedor. */
export async function getMyCommissionProfile(): Promise<CommissionProfile> {
  const { data } = await myntedAPI.get<CommissionProfile>('/sellers/me/commission')
  return data
}

/** GET /sellers/me/commission/estimate?amount= — comisión y neto para un precio. */
export async function estimateCommission(amount: number): Promise<CommissionEstimate> {
  const { data } = await myntedAPI.get<CommissionEstimate>('/sellers/me/commission/estimate', { params: { amount } })
  return data
}

// -----------------------------------------------------------------------------
// Administración (superadmin)
// -----------------------------------------------------------------------------

/** GET /admin/commission-tiers — todos los rangos, activos e inactivos. */
export async function getAdminCommissionTiers(filters: AdminCommissionTierFilters): Promise<AdminCommissionTier[]> {
  const { data } = await myntedAPI.get<AdminCommissionTier[]>('/admin/commission-tiers', { params: filters })
  return data
}

/** POST /admin/commission-tiers — crea un rango. */
export async function createAdminCommissionTier(payload: AdminCommissionTierPayload): Promise<AdminCommissionTier> {
  const { data } = await myntedAPI.post<AdminCommissionTier>('/admin/commission-tiers', payload)
  return data
}

/** PATCH /admin/commission-tiers/:id — edición parcial de un rango. */
export async function updateAdminCommissionTier(
  tierId: number,
  payload: Partial<AdminCommissionTierPayload>,
): Promise<AdminCommissionTier> {
  const { data } = await myntedAPI.patch<AdminCommissionTier>(`/admin/commission-tiers/${tierId}`, payload)
  return data
}

/**
 * DELETE /admin/commission-tiers/:id — no borra: desactiva el rango. Las
 * transacciones ya cobradas guardan su propia copia de la comisión, así que
 * desactivar un rango no cambia el historial.
 */
export async function deactivateAdminCommissionTier(tierId: number): Promise<AdminCommissionTier> {
  const { data } = await myntedAPI.delete<AdminCommissionTier>(`/admin/commission-tiers/${tierId}`)
  return data
}

/** GET /admin/payments/summary — comisiones cobradas por periodo, nivel y rango de precio. */
export async function getAdminPaymentSummary(filters: PaymentPeriodFilters): Promise<AdminPaymentSummary> {
  const { data } = await myntedAPI.get<AdminPaymentSummary>('/admin/payments/summary', { params: filters })
  return data
}
