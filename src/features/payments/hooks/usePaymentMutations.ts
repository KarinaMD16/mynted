import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { getHttpStatus } from '@/api/apiError'
import { productKeys } from '@/features/products/hooks/useProductMutations'
import {
  checkout,
  createAdminCommissionTier,
  deactivateAdminCommissionTier,
  updateAdminCommissionTier,
} from '../services/paymentService'
import type {
  AdminCommissionTierPayload,
  CheckoutPayload,
  PaymentDeclinedBody,
  PaymentFailureReason,
} from '../models/payment'
import { paymentKeys } from './usePaymentQueries'

/**
 * Por qué no se completó un checkout. Solo `declined` y `soldOut` son parte
 * del flujo normal: el resto son errores que el usuario no puede resolver
 * cambiando de tarjeta.
 */
export type CheckoutFailure =
  /** 402: la pasarela rechazó la tarjeta. Se puede reintentar con otra. */
  | { kind: 'declined'; reason: PaymentFailureReason | null; transactionId: string | null }
  /** 409: el producto ya no está a la venta (alguien se adelantó). */
  | { kind: 'soldOut' }
  /** 400: el backend no aceptó los datos de la tarjeta. */
  | { kind: 'invalidCard' }
  /** 404: el producto ya no existe. */
  | { kind: 'notFound' }
  /** 401: la sesión venció. */
  | { kind: 'unauthenticated' }
  /** 503: la pasarela no respondió. No se cobró nada. */
  | { kind: 'gatewayDown' }
  | { kind: 'unknown' }

/** Lee el cuerpo del 402, que trae la razón del rechazo y la transacción fallida. */
function readDeclinedBody(error: unknown): PaymentDeclinedBody | null {
  if (!axios.isAxiosError<PaymentDeclinedBody>(error)) return null
  const body = error.response?.data
  return body && typeof body === 'object' ? body : null
}

/**
 * Traduce el error de POST /payments/checkout a algo que la pantalla pueda
 * mostrar (ver CheckoutPage).
 *
 * El 409 se trata siempre como "ya se vendió": el backend también lo usa para
 * los choques de idempotencia, pero cada intento del usuario estrena una clave
 * nueva (ver useCheckout), así que ese caso no puede darse desde acá.
 */
export function readCheckoutFailure(error: unknown): CheckoutFailure {
  switch (getHttpStatus(error)) {
    case 402: {
      const body = readDeclinedBody(error)
      return { kind: 'declined', reason: body?.failureReason ?? null, transactionId: body?.transactionId ?? null }
    }
    case 409:
      return { kind: 'soldOut' }
    case 400:
      return { kind: 'invalidCard' }
    case 404:
      return { kind: 'notFound' }
    case 401:
      return { kind: 'unauthenticated' }
    case 503:
      return { kind: 'gatewayDown' }
    default:
      return { kind: 'unknown' }
  }
}

/**
 * Clave de idempotencia de un intento de pago.
 *
 * El backend la exige en cada checkout y guarda la transacción con ella, así
 * que la misma clave nunca cobra dos veces: si la petición se reintenta sola
 * (red inestable, el interceptor de refresh de sesión) el cobro sigue siendo
 * uno solo.
 *
 * El intento termina cuando el backend responde: aprobado o rechazado, esa
 * clave queda consumida —repetirla devolvería el mismo resultado—, así que el
 * siguiente intento del usuario estrena una. Por eso la clave se renueva al
 * salir de la mutación, no al mandar la petición.
 */
function newIdempotencyKey(): string {
  // UUID v4 (36 caracteres, dentro del rango de 8–128 que pide el backend).
  return crypto.randomUUID()
}

/**
 * Cobro de un producto. Devuelve la mutación de TanStack Query más la clave
 * del intento en curso, que se reutiliza mientras la petición esté viva.
 *
 * El componente no debe llamar `mutate` dos veces seguidas: el botón se
 * deshabilita con `isPending` (ver 1087). Aun así, si llegaran dos peticiones,
 * la clave compartida hace que el backend cobre una sola vez.
 */
export function useCheckoutMutation() {
  const queryClient = useQueryClient()
  const keyRef = useRef<string>(newIdempotencyKey())

  return useMutation({
    mutationFn: (payload: CheckoutPayload) => checkout(payload, keyRef.current),
    onSettled: (_data, error) => {
      // Si no hubo respuesta del backend (red caída, petición cortada a medias)
      // no se sabe si el cobro entró: se conserva la clave para que el
      // siguiente envío sea el MISMO intento y el backend no cobre de nuevo.
      const answered = error === null || getHttpStatus(error) !== undefined
      if (answered) keyRef.current = newIdempotencyKey()
    },
    onSuccess: () => {
      // El producto queda vendido y el historial cambia: los listados que ya
      // están en cache dejan de ser ciertos.
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

// -----------------------------------------------------------------------------
// Administración de rangos (superadmin)
// -----------------------------------------------------------------------------

/**
 * Cambiar un rango cambia la comisión que pagarán las próximas ventas, así que
 * invalida todo lo que muestra comisiones: la matriz del vendedor, los rangos
 * públicos y las estimaciones.
 */
function useInvalidateCommissions() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
}

export function useCreateCommissionTierMutation() {
  const invalidate = useInvalidateCommissions()
  return useMutation({
    mutationFn: (payload: AdminCommissionTierPayload) => createAdminCommissionTier(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateCommissionTierMutation() {
  const invalidate = useInvalidateCommissions()
  return useMutation({
    mutationFn: ({ tierId, payload }: { tierId: number; payload: Partial<AdminCommissionTierPayload> }) =>
      updateAdminCommissionTier(tierId, payload),
    onSuccess: invalidate,
  })
}

/** No borra el rango: lo desactiva (el historial ya cobrado no cambia). */
export function useDeactivateCommissionTierMutation() {
  const invalidate = useInvalidateCommissions()
  return useMutation({
    mutationFn: (tierId: number) => deactivateAdminCommissionTier(tierId),
    onSuccess: invalidate,
  })
}
