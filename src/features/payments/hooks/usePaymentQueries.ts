import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  estimateCommission,
  getAdminCommissionTiers,
  getAdminPaymentSummary,
  getCommissionTiers,
  getMyCommissionProfile,
  getMyPurchases,
  getMySales,
  getMySalesSummary,
  getQuote,
  getReceipt,
} from '../services/paymentService'
import type {
  AdminCommissionTierFilters,
  PaymentPeriodFilters,
  PurchasePage,
  SalePage,
} from '../models/payment'

export const paymentKeys = {
  all: ['payments'] as const,
  quote: (productId: number) => [...paymentKeys.all, 'quote', productId] as const,
  receipt: (transactionId: string) => [...paymentKeys.all, 'receipt', transactionId] as const,
  purchases: () => [...paymentKeys.all, 'purchases'] as const,
  sales: () => [...paymentKeys.all, 'sales'] as const,
  salesSummary: (filters: PaymentPeriodFilters) => [...paymentKeys.all, 'sales-summary', filters] as const,
  commissionTiers: (currency: string) => [...paymentKeys.all, 'commission-tiers', currency] as const,
  commissionProfile: () => [...paymentKeys.all, 'commission-profile'] as const,
  commissionEstimate: (amount: number) => [...paymentKeys.all, 'commission-estimate', amount] as const,
  adminTiers: (filters: AdminCommissionTierFilters) => [...paymentKeys.all, 'admin-tiers', filters] as const,
  adminSummary: (filters: PaymentPeriodFilters) => [...paymentKeys.all, 'admin-summary', filters] as const,
}

const HISTORY_PAGE_SIZE = 10

/**
 * Cotización del producto al abrir el checkout: precio, moneda y, si es un
 * producto propio, la comisión. No se cachea mucho a propósito — es el monto
 * que la persona está a punto de pagar.
 */
export function usePaymentQuote(productId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.quote(productId ?? 0),
    queryFn: () => getQuote(productId ?? 0),
    enabled: enabled && productId !== undefined,
    staleTime: 0,
  })
}

/**
 * Recibo de una transacción. Es inmutable una vez cobrada, así que no hace
 * falta revalidarlo al volver a la pestaña.
 */
export function usePaymentReceipt(transactionId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.receipt(transactionId ?? ''),
    queryFn: () => getReceipt(transactionId ?? ''),
    enabled: Boolean(transactionId),
    staleTime: Infinity,
  })
}

function nextPurchasePage(last: PurchasePage) {
  return last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined
}

/** "Mis compras": compras completadas, con "Cargar más". */
export function useMyPurchases(enabled = true) {
  return useInfiniteQuery({
    queryKey: paymentKeys.purchases(),
    queryFn: ({ pageParam }) => getMyPurchases(pageParam, HISTORY_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextPurchasePage,
    enabled,
  })
}

/** "Mis ventas": ventas completadas con su comisión. Solo vendedores (403 si no). */
export function useMySales(enabled = true) {
  return useInfiniteQuery({
    queryKey: paymentKeys.sales(),
    queryFn: ({ pageParam }) => getMySales(pageParam, HISTORY_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last: SalePage) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
    enabled,
  })
}

/** Bruto, comisiones y neto del periodo elegido en "Mis ventas". */
export function useMySalesSummary(filters: PaymentPeriodFilters, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.salesSummary(filters),
    queryFn: () => getMySalesSummary(filters),
    enabled,
  })
}

const TIERS_STALE_TIME = 10 * 60 * 1000

/** Rangos activos de comisión (público). Cambian poco: se cachean 10 minutos. */
export function useCommissionTiers(currency: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.commissionTiers(currency ?? ''),
    queryFn: () => getCommissionTiers(currency ?? ''),
    enabled: enabled && Boolean(currency),
    staleTime: TIERS_STALE_TIME,
  })
}

/** Nivel, progreso al siguiente y matriz de comisión del vendedor autenticado. */
export function useMyCommissionProfile(enabled = true) {
  return useQuery({
    queryKey: paymentKeys.commissionProfile(),
    queryFn: getMyCommissionProfile,
    enabled,
  })
}

/**
 * Comisión y neto para un precio, mientras se publica un producto. Quien lo
 * use debe pasar el monto ya "debounceado": cada valor distinto es una query
 * nueva (ver useCommissionPreview).
 */
export function useCommissionEstimate(amount: number | null, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.commissionEstimate(amount ?? 0),
    queryFn: () => estimateCommission(amount ?? 0),
    enabled: enabled && amount !== null && amount > 0,
    staleTime: TIERS_STALE_TIME,
  })
}

/** Rangos de comisión del panel de administración (incluye los inactivos). */
export function useAdminCommissionTiers(filters: AdminCommissionTierFilters, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.adminTiers(filters),
    queryFn: () => getAdminCommissionTiers(filters),
    enabled,
  })
}

/** Comisiones cobradas por periodo, nivel y rango de precio (superadmin). */
export function useAdminPaymentSummary(filters: PaymentPeriodFilters, enabled = true) {
  return useQuery({
    queryKey: paymentKeys.adminSummary(filters),
    queryFn: () => getAdminPaymentSummary(filters),
    enabled,
  })
}
