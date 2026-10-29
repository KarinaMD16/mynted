import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentKeys } from '@/features/payments/hooks/usePaymentQueries'
import type { DisputeAction, DisputesQuery } from '../models/disputes'
import { getDisputes, resolveDispute } from '../services/disputesService'

export const disputeKeys = {
  all: ['admin', 'disputes'] as const,
  list: (query: DisputesQuery) => [...disputeKeys.all, query] as const,
}

export function useAdminDisputes(query: DisputesQuery) {
  return useQuery({
    queryKey: disputeKeys.list(query),
    queryFn: () => getDisputes(query),
    placeholderData: keepPreviousData,
  })
}

/** Solo el total de un estado (para el resumen): pide una fila. */
export function useDisputeCount(status: DisputesQuery['status']) {
  const query = useAdminDisputes({ page: 1, limit: 1, status })
  return { ...query, data: query.data?.pagination.total }
}

export function useResolveDisputeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, resolution }: { id: string; action: DisputeAction; resolution: string }) =>
      resolveDispute(id, action, resolution),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all })
      // Un reembolso cambia el estado de la venta y de los totales del vendedor.
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-log'] })
    },
  })
}
