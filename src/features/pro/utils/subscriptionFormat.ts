import type { PaymentFailureReason } from '@/features/payments/models/payment'
import type { TranslationKey } from '@/i18n/translations/es'
import type { AppLanguage } from '@/utils/locale'
import { formatPrice } from '@/utils/price'
import type { SubscriptionPeriod, SubscriptionPlan, SubscriptionStatus } from '../models/subscription'

export const PERIOD_LABEL: Record<SubscriptionPeriod, TranslationKey> = {
  monthly: 'pro.period.monthly',
  semiannual: 'pro.period.semiannual',
  annual: 'pro.period.annual',
}

/** "/mes", "/6 meses", "/año": lo que cubre cada pago. */
export const PERIOD_PER: Record<SubscriptionPeriod, TranslationKey> = {
  monthly: 'pro.period.perMonthly',
  semiannual: 'pro.period.perSemiannual',
  annual: 'pro.period.perAnnual',
}

export const STATUS_LABEL: Record<SubscriptionStatus, TranslationKey> = {
  none: 'pro.status.none',
  active: 'pro.status.active',
  cancelled: 'pro.status.cancelled',
  expired: 'pro.status.expired',
}

export const STATUS_PILL: Record<SubscriptionStatus, string> = {
  none: 'bg-mynted-bg text-mynted-gray ring-1 ring-mynted-border',
  active: 'bg-[#e8faf2] text-[#0d8c66]',
  cancelled: 'bg-[#fff4d6] text-[#8a5a00]',
  expired: 'bg-[#fdecec] text-[#c62a2f]',
}

/** Por qué rechazó la pasarela (mismos textos que el checkout de productos). */
export const FAILURE_MESSAGE: Record<PaymentFailureReason, TranslationKey> = {
  card_declined: 'checkout.failure.cardDeclined',
  insufficient_funds: 'checkout.failure.insufficientFunds',
  expired_card: 'checkout.failure.expiredCard',
}

export interface PlanPrices {
  /** Lo que se muestra en grande: en la moneda del usuario si hay tipo de cambio. */
  main: string
  /** Lo que de verdad se cobra (USD). null si ya es lo mismo que `main`. */
  charged: string | null
  /** Equivalente por mes en la moneda de `main`. null en el mensual. */
  perMonth: string | null
}

/**
 * Precios de un plan para mostrar. `amount` (USD) es lo que se cobra;
 * `displayAmount` es informativo y puede venir null si no hay tipo de cambio
 * (entonces se muestra el monto en USD y nada más).
 */
export function getPlanPrices(plan: SubscriptionPlan, language: AppLanguage): PlanPrices {
  const hasDisplay = plan.displayAmount !== null && plan.displayCurrency !== plan.currency
  const mainAmount = hasDisplay ? (plan.displayAmount as number) : plan.amount
  const mainCurrency = hasDisplay ? plan.displayCurrency : plan.currency

  return {
    main: formatPrice(mainAmount, mainCurrency, language),
    charged: hasDisplay ? formatPrice(plan.amount, plan.currency, language) : null,
    perMonth: plan.months > 1 ? formatPrice(mainAmount / plan.months, mainCurrency, language) : null,
  }
}
