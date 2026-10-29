import type { PaymentCardPayload, PaymentFailureReason } from '@/features/payments/models/payment'

/**
 * Mynted Pro (docs/GUIA_PRO_FRONTEND.md del backend).
 *
 * Hay un solo plan Pro con tres periodos. La renovación es MANUAL: no hay
 * cobro automático, pagar de nuevo extiende el tiempo. Se es Pro mientras
 * `endsAt` sea futuro; el backend lo calcula en cada respuesta, así que el
 * frontend nunca compara fechas para decidir si alguien es Pro: usa `isPro`.
 */

export const SUBSCRIPTION_PERIODS = ['monthly', 'semiannual', 'annual'] as const
export type SubscriptionPeriod = (typeof SUBSCRIPTION_PERIODS)[number]

export function isSubscriptionPeriod(value: unknown): value is SubscriptionPeriod {
  return typeof value === 'string' && (SUBSCRIPTION_PERIODS as readonly string[]).includes(value)
}

/** Periodo que se sugiere por defecto: el de mayor ahorro. */
export const RECOMMENDED_PERIOD: SubscriptionPeriod = 'annual'

/** Un periodo del plan (GET /subscriptions/plans). */
export interface SubscriptionPlan {
  period: SubscriptionPeriod
  /** Meses de calendario que cubre. */
  months: number
  /** Lo que se cobra, siempre en USD. */
  amount: number
  currency: string
  /** Mismo precio en la moneda del usuario (informativo). null si no hay tipo de cambio: se muestra `amount`. */
  displayAmount: number | null
  displayCurrency: string
  /** Ahorro (entero, %) frente a pagar el mensual esos mismos meses. 0 en el mensual. */
  savingsPercent: number
}

export interface SubscriptionPlansResponse {
  plan: string
  plans: SubscriptionPlan[]
}

/**
 * none: nunca pagó · active: vigente · cancelled: vigente pero canceló (sigue
 * siendo Pro hasta `endsAt`) · expired: `endsAt` ya pasó.
 */
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'expired'

/** GET /subscriptions/me (y respuesta de POST /subscriptions/cancel). */
export interface MySubscription {
  isPro: boolean
  status: SubscriptionStatus
  period: SubscriptionPeriod | null
  startsAt: string | null
  endsAt: string | null
  cancelAtPeriodEnd: boolean
  /** Redondea hacia arriba; 0 si no está vigente. */
  daysRemaining: number
}

export type SubscriptionPaymentStatus = 'completed' | 'failed'

/** Un pago de la suscripción (respuesta del checkout y fila del historial). */
export interface SubscriptionPayment {
  id: string
  status: SubscriptionPaymentStatus
  period: SubscriptionPeriod
  amount: number
  currency: string
  displayAmount: number | null
  displayCurrency: string | null
  exchangeRate: number | null
  gatewayReference: string | null
  cardBrand: string | null
  cardLast4: string | null
  cardHolderName: string | null
  /** Solo en pagos rechazados. */
  failureReason: PaymentFailureReason | null
  /** Tramo que cubre el pago (solo si fue aprobado). */
  coversFrom: string | null
  coversUntil: string | null
  createdAt: string
}

export interface SubscriptionPaymentsPage {
  data: SubscriptionPayment[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** POST /subscriptions/checkout. La tarjeta usa las mismas reglas que el pago de productos. */
export interface SubscriptionCheckoutPayload {
  period: SubscriptionPeriod
  card: PaymentCardPayload
}

/** Cuerpo del 402 del checkout de la suscripción. */
export interface SubscriptionDeclinedBody {
  statusCode: number
  paymentId: string
  failureReason: PaymentFailureReason | null
}
