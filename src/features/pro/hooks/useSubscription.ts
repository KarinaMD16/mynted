import { useRef } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { getHttpStatus } from '@/api/apiError'
import type { PaymentFailureReason } from '@/features/payments/models/payment'
import type {
  MySubscription,
  SubscriptionCheckoutPayload,
  SubscriptionDeclinedBody,
  SubscriptionPaymentsPage,
  SubscriptionPeriod,
} from '../models/subscription'
import {
  cancelSubscription,
  checkoutSubscription,
  getMySubscription,
  getMySubscriptionPayments,
  getSubscriptionPlans,
} from '../services/subscriptionService'
import { invalidateProState, proKeys } from './proKeys'

const PAYMENTS_PAGE_SIZE = 10

/** Planes y precios. Casi no cambian: se piden una vez y se refrescan al cambiar de moneda. */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: proKeys.plans(),
    queryFn: getSubscriptionPlans,
    staleTime: 10 * 60 * 1000,
  })
}

/** Estado de la suscripción de quien mira. Solo con sesión. */
export function useMySubscription(enabled = true) {
  return useQuery({
    queryKey: proKeys.subscription(),
    queryFn: getMySubscription,
    enabled,
    // `daysRemaining` y el vencimiento se calculan al pedirlo: no conviene que quede viejo mucho rato.
    staleTime: 60 * 1000,
  })
}

function nextPaymentsPage(lastPage: SubscriptionPaymentsPage) {
  const { page, totalPages } = lastPage.pagination
  return page < totalPages ? page + 1 : undefined
}

/** Historial de pagos de la suscripción (incluye rechazados), con "Ver más". */
export function useMySubscriptionPayments(enabled = true) {
  return useInfiniteQuery({
    queryKey: proKeys.payments(),
    queryFn: ({ pageParam }) => getMySubscriptionPayments(pageParam, PAYMENTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPaymentsPage,
    enabled,
  })
}

/** Por qué no se completó el pago de la suscripción (sección 2 de la guía). */
export type SubscriptionCheckoutFailure =
  /** 402: la pasarela rechazó la tarjeta. Se reintenta con otra (y otra clave). */
  | { kind: 'declined'; reason: PaymentFailureReason | null }
  /** 400: la pasarela no aceptó los datos de la tarjeta. */
  | { kind: 'invalidCard' }
  /** 401: la sesión venció. */
  | { kind: 'unauthenticated' }
  /** 409: la clave de idempotencia chocó con otra operación. Basta con reintentar. */
  | { kind: 'conflict' }
  /** 503: la pasarela no respondió. No se cobró nada. */
  | { kind: 'gatewayDown' }
  | { kind: 'unknown' }

export function readSubscriptionCheckoutFailure(error: unknown): SubscriptionCheckoutFailure {
  switch (getHttpStatus(error)) {
    case 402: {
      const body = axios.isAxiosError<SubscriptionDeclinedBody>(error) ? error.response?.data : undefined
      return { kind: 'declined', reason: body && typeof body === 'object' ? (body.failureReason ?? null) : null }
    }
    case 400:
      return { kind: 'invalidCard' }
    case 401:
      return { kind: 'unauthenticated' }
    case 409:
      return { kind: 'conflict' }
    case 503:
      return { kind: 'gatewayDown' }
    default:
      return { kind: 'unknown' }
  }
}

/**
 * Pago (o renovación) de Pro.
 *
 * Igual que el checkout de productos (ver useCheckoutMutation): una clave de
 * idempotencia por intento del usuario. Se estrena una nueva cuando el backend
 * responde —aprobado o rechazado, esa clave ya quedó consumida— y se conserva
 * si la petición se cortó sin respuesta, para que el reintento sea el MISMO
 * intento y no cobre dos veces. Si el usuario cambia de periodo con una clave
 * pendiente, también se estrena una (el backend respondería 409).
 */
export function useSubscriptionCheckout() {
  const queryClient = useQueryClient()
  const keyRef = useRef<string>(crypto.randomUUID())
  const periodRef = useRef<SubscriptionPeriod | null>(null)

  return useMutation({
    mutationFn: (payload: SubscriptionCheckoutPayload) => {
      if (periodRef.current !== null && periodRef.current !== payload.period) keyRef.current = crypto.randomUUID()
      periodRef.current = payload.period
      return checkoutSubscription(payload, keyRef.current)
    },
    onSettled: (_data, error) => {
      const answered = error === null || getHttpStatus(error) !== undefined
      if (answered) {
        keyRef.current = crypto.randomUUID()
        periodRef.current = null
      }
      // Un rechazo también queda en el historial.
      if (answered) void queryClient.invalidateQueries({ queryKey: proKeys.payments() })
    },
    onSuccess: () => invalidateProState(queryClient),
  })
}

/** Cancelar: marca `cancelAtPeriodEnd` y sigue siendo Pro hasta `endsAt`. */
export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (subscription: MySubscription) => {
      queryClient.setQueryData(proKeys.subscription(), subscription)
    },
  })
}
