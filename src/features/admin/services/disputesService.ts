import myntedAPI from '@/api/apiConfig'
import type { DisputeAction, DisputesPage, DisputesQuery, PaymentDispute } from '../models/disputes'

/** GET /payments/disputes — [Superadmin] reclamos, más nuevos primero. Sin `status` trae todos. */
export async function getDisputes(query: DisputesQuery): Promise<DisputesPage> {
  const { data } = await myntedAPI.get<DisputesPage>('/payments/disputes', { params: query })
  return data
}

/**
 * PATCH /payments/disputes/:id/resolve — [Superadmin] `refund` devuelve el pago
 * (la venta deja de contar para el vendedor); `close` lo mantiene. `resolution`
 * es la explicación: queda en el registro de moderación y le llega al comprador.
 */
export async function resolveDispute(id: string, action: DisputeAction, resolution: string): Promise<PaymentDispute> {
  const { data } = await myntedAPI.patch<PaymentDispute>(`/payments/disputes/${id}/resolve`, { action, resolution })
  return data
}
