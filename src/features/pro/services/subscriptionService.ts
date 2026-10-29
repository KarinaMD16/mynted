import myntedAPI from '@/api/apiConfig'
import type {
  MySubscription,
  SubscriptionCheckoutPayload,
  SubscriptionPayment,
  SubscriptionPaymentsPage,
  SubscriptionPlansResponse,
} from '../models/subscription'

/** GET /subscriptions/plans — público. Los precios de referencia salen en la moneda de visualización. */
export async function getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
  const { data } = await myntedAPI.get<SubscriptionPlansResponse>('/subscriptions/plans')
  return data
}

/** GET /subscriptions/me — estado de la suscripción de quien mira. */
export async function getMySubscription(): Promise<MySubscription> {
  const { data } = await myntedAPI.get<MySubscription>('/subscriptions/me')
  return data
}

/** GET /subscriptions/me/payments — historial (más reciente primero, incluye rechazados). */
export async function getMySubscriptionPayments(page: number, limit: number): Promise<SubscriptionPaymentsPage> {
  const { data } = await myntedAPI.get<SubscriptionPaymentsPage>('/subscriptions/me/payments', { params: { page, limit } })
  return data
}

/**
 * POST /subscriptions/checkout — paga (o renueva) Pro con la pasarela simulada.
 *
 * `Idempotency-Key` es obligatoria (8–128 caracteres). La misma clave nunca
 * cobra dos veces: un reintento devuelve el mismo resultado. Un 402 trae
 * `{ paymentId, failureReason }`; tras un rechazo hay que estrenar clave.
 */
export async function checkoutSubscription(
  payload: SubscriptionCheckoutPayload,
  idempotencyKey: string,
): Promise<SubscriptionPayment> {
  const { data } = await myntedAPI.post<SubscriptionPayment>('/subscriptions/checkout', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

/**
 * POST /subscriptions/cancel — no reembolsa ni corta el acceso: marca
 * `cancelAtPeriodEnd` y sigue siendo Pro hasta `endsAt`. 409 si no hay Pro vigente.
 */
export async function cancelSubscription(): Promise<MySubscription> {
  const { data } = await myntedAPI.post<MySubscription>('/subscriptions/cancel')
  return data
}
