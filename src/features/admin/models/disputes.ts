import type { ShippingStatus, TransactionStatus } from '@/features/payments/models/payment'

/**
 * Reclamos comerciales de una compra (GET /payments/disputes, solo
 * superadmin). Los abre quien compró desde su recibo y los resuelve el
 * superadmin: reembolsando o cerrando sin reembolso.
 */
export const DISPUTE_STATUSES = ['open', 'resolved_refund', 'resolved_closed'] as const
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

/** `refund` devuelve el pago; `close` lo mantiene. */
export type DisputeAction = 'refund' | 'close'

/** Comprador o vendedor. `displayName` es el nombre de la tienda si vende. */
export interface DisputeParty {
  id: string
  username?: string
  displayName?: string
}

export interface PaymentDispute {
  id: string
  transactionId: string
  status: DisputeStatus
  /** Lo que escribió quien compró al abrirlo. */
  reason: string
  /** La acción con la que se resolvió; null mientras está abierto. */
  resolution: DisputeAction | null
  /** La explicación de quien lo resolvió. */
  resolutionNote: string | null
  createdAt: string
  resolvedAt: string | null
  paymentStatus: TransactionStatus
  shippingStatus: ShippingStatus | null
  buyer: DisputeParty
  seller: DisputeParty
  product: { id: number; title: string }
}

export interface DisputesQuery {
  page: number
  /** 1–100 (el backend no acepta más). */
  limit: number
  status?: DisputeStatus
}

export interface DisputesPage {
  data: PaymentDispute[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
