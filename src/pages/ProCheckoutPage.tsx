import { useState } from 'react'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CalendarRange, CircleCheck, Sparkles } from 'lucide-react'
import { QueryErrorState, SignedOutState } from '@/components/errors/QueryErrorState'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CheckoutForm } from '@/features/payments/components/CheckoutForm'
import { PaymentNotice } from '@/features/payments/components/PaymentNotice'
import type { PaymentCardPayload } from '@/features/payments/models/payment'
import { formatPaymentDate, maskedCard } from '@/features/payments/utils/paymentFormat'
import { proLinkButtonClass } from '@/features/pro/components/PlanCard'
import { ProBadge } from '@/features/pro/components/ProBadge'
import {
  readSubscriptionCheckoutFailure,
  useMySubscription,
  useSubscriptionCheckout,
  useSubscriptionPlans,
  type SubscriptionCheckoutFailure,
} from '@/features/pro/hooks/useSubscription'
import {
  RECOMMENDED_PERIOD,
  SUBSCRIPTION_PERIODS,
  type MySubscription,
  type SubscriptionPayment,
  type SubscriptionPeriod,
  type SubscriptionPlan,
} from '@/features/pro/models/subscription'
import { FAILURE_MESSAGE, getPlanPrices, PERIOD_LABEL } from '@/features/pro/utils/subscriptionFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatPrice } from '@/utils/price'

const routeApi = getRouteApi('/pro/checkout')

/** El pago aprobado, y si extendió un Pro que ya estaba vigente (para el título). */
interface CheckoutSuccess {
  payment: SubscriptionPayment
  renewal: boolean
}

/**
 * /pro/checkout?period= — pago (o renovación) de Mynted Pro con la pasarela
 * simulada. Reutiliza el formulario de tarjeta del checkout de productos. Se
 * puede cambiar de periodo aquí mismo; el cobro siempre es en USD.
 */
export default function ProCheckoutPage() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const { period: periodParam } = routeApi.useSearch()
  const period = periodParam ?? RECOMMENDED_PERIOD

  const { isLoggedIn, isLoading: isLoadingUser } = useCurrentUser()
  const plans = useSubscriptionPlans()
  const subscription = useMySubscription(isLoggedIn)
  const checkout = useSubscriptionCheckout()

  const [failure, setFailure] = useState<SubscriptionCheckoutFailure | null>(null)
  const [success, setSuccess] = useState<CheckoutSuccess | null>(null)

  const plan = plans.data?.plans.find((item) => item.period === period)

  function selectPeriod(next: SubscriptionPeriod) {
    if (checkout.isPending) return
    setFailure(null)
    void navigate({ to: '/pro/checkout', search: { period: next }, replace: true })
  }

  function handlePay(card: PaymentCardPayload) {
    if (!plan || checkout.isPending) return
    setFailure(null)
    const wasPro = subscription.data?.isPro ?? false
    checkout.mutate(
      { period: plan.period, card },
      {
        onSuccess: (payment) => {
          setSuccess({ payment, renewal: wasPro })
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
        onError: (error) => {
          const next = readSubscriptionCheckoutFailure(error)
          if (next.kind === 'unauthenticated') void navigate({ to: '/login' })
          else setFailure(next)
        },
      },
    )
  }

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        {!success && (
          <div className="flex flex-col items-start gap-2">
            <Link
              to="/pro"
              className="flex items-center gap-1.5 rounded-md text-sm font-medium text-mynted-gray outline-none hover:text-mynted-ink focus-visible:outline-2 focus-visible:outline-mynted-blue-mid"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t('pro.checkout.backToPlans')}
            </Link>
            <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('pro.checkout.title')}</h1>
          </div>
        )}

        {!isLoggedIn && !isLoadingUser ? (
          <SignedOutState description={t('pro.checkout.signedOut')} />
        ) : success ? (
          <SuccessPanel success={success} />
        ) : plans.isError ? (
          <QueryErrorState
            error={plans.error}
            onRetry={() => void plans.refetch()}
            texts={{ error: { description: t('pro.plans.loadError') } }}
          />
        ) : plans.isPending || isLoadingUser || !plan ? (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]" aria-busy="true">
            <div className="h-[460px] animate-pulse rounded-2xl bg-white" />
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : (
          <div className="grid items-start gap-6 md:grid-cols-[1fr_320px]">
            {/* En móvil el resumen va arriba: primero qué se paga, después la tarjeta. Desde md, a la derecha. */}
            <PlanSummary
              plans={plans.data.plans}
              plan={plan}
              subscription={subscription.data}
              onSelect={selectPeriod}
              disabled={checkout.isPending}
              className="md:order-2"
            />

            <CheckoutForm
              onPay={handlePay}
              isPaying={checkout.isPending}
              submitLabel={t('pro.checkout.pay', { amount: formatPrice(plan.amount, plan.currency, language) })}
            >
              {failure && <FailureNotice failure={failure} />}
            </CheckoutForm>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Qué se paga: selector de periodo, total en USD (lo que se cobra), el monto
 * de referencia en la moneda del usuario y desde cuándo cuenta.
 */
function PlanSummary({
  plans,
  plan,
  subscription,
  onSelect,
  disabled,
  className,
}: {
  plans: SubscriptionPlan[]
  plan: SubscriptionPlan
  subscription: MySubscription | undefined
  onSelect: (period: SubscriptionPeriod) => void
  disabled: boolean
  className?: string
}) {
  const { t, language } = useLanguage()
  const total = formatPrice(plan.amount, plan.currency, language)
  const prices = getPlanPrices(plan, language)
  const ordered = [...plans].sort((a, b) => SUBSCRIPTION_PERIODS.indexOf(a.period) - SUBSCRIPTION_PERIODS.indexOf(b.period))

  // Con Pro vigente el periodo se suma desde el vencimiento actual (no se pierde ningún día).
  const startsNote = subscription?.isPro
    ? t('pro.checkout.extendsFrom', { date: formatPaymentDate(subscription.endsAt, language) })
    : t(plan.months === 1 ? 'pro.checkout.startsTodayOne' : 'pro.checkout.startsToday', { months: plan.months })

  return (
    <aside className={cx('flex h-fit flex-col gap-4 rounded-2xl border border-mynted-border bg-white p-5', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('pro.checkout.summaryTitle')}</h2>
        <ProBadge size="sm" />
      </div>

      <fieldset className="flex flex-col gap-2" disabled={disabled}>
        <legend className="mb-2 text-sm font-semibold text-mynted-ink">{t('pro.checkout.periodLabel')}</legend>
        {ordered.map((option) => {
          const selected = option.period === plan.period
          const optionPrices = getPlanPrices(option, language)
          return (
            <label
              key={option.period}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mynted-blue-mid',
                selected ? 'border-mynted-orange bg-mynted-orange/5' : 'border-mynted-border hover:border-mynted-orange/50',
                disabled && 'cursor-not-allowed opacity-70',
              )}
            >
              <input
                type="radio"
                name="pro-period"
                value={option.period}
                checked={selected}
                onChange={() => onSelect(option.period)}
                className="size-4 accent-mynted-orange"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold text-mynted-ink">{t(PERIOD_LABEL[option.period])}</span>
                <span className="text-xs text-mynted-gray">{optionPrices.main}</span>
              </span>
              {option.savingsPercent > 0 && (
                <span className="shrink-0 rounded-full bg-[#e8faf2] px-2 py-0.5 text-[11px] font-semibold text-[#0d8c66]">
                  {t('pro.plans.save', { percent: option.savingsPercent })}
                </span>
              )}
            </label>
          )
        })}
      </fieldset>

      <dl className="flex flex-col gap-2 border-t border-mynted-border pt-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-semibold text-mynted-ink">{t('checkout.summary.total')}</dt>
          <dd className="font-heading text-xl font-semibold text-mynted-ink">{total}</dd>
        </div>
        {prices.charged && (
          <p className="text-xs text-mynted-gray">{t('pro.checkout.approx', { amount: prices.main })}</p>
        )}
      </dl>

      <p className="flex items-start gap-2 rounded-xl bg-mynted-bg px-3 py-2.5 text-xs text-mynted-ink">
        <CalendarRange className="mt-px size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
        <span>
          {startsNote} {t('pro.checkout.noAutoRenew')}
        </span>
      </p>
    </aside>
  )
}

function FailureNotice({ failure }: { failure: SubscriptionCheckoutFailure }) {
  const { t } = useLanguage()

  switch (failure.kind) {
    case 'declined':
      return (
        <PaymentNotice
          tone="error"
          message={failure.reason ? t(FAILURE_MESSAGE[failure.reason]) : t('checkout.failure.generic')}
          hint={t('checkout.failure.retryHint')}
        />
      )
    case 'invalidCard':
      return <PaymentNotice tone="error" message={t('checkout.failure.invalidCard')} />
    case 'conflict':
      return <PaymentNotice tone="warning" message={t('pro.checkout.conflict')} hint={t('checkout.failure.notCharged')} />
    case 'gatewayDown':
      return <PaymentNotice tone="error" message={t('checkout.failure.gatewayDown')} hint={t('checkout.failure.notCharged')} />
    default:
      return <PaymentNotice tone="error" message={t('checkout.failure.generic')} hint={t('checkout.failure.notCharged')} />
  }
}

/** Pago aprobado: qué tramo cubre, con qué se pagó y a dónde ir ahora. */
function SuccessPanel({ success }: { success: CheckoutSuccess }) {
  const { t, language } = useLanguage()
  const { payment, renewal } = success

  return (
    <section
      aria-labelledby="pro-success-title"
      className="flex flex-col items-center gap-6 rounded-2xl border border-mynted-border bg-white px-6 py-10 text-center sm:px-10"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-[#e8faf2] text-[#0d8c66]" aria-hidden="true">
        <CircleCheck className="size-8" />
      </span>

      <div className="flex flex-col items-center gap-2">
        <h1 id="pro-success-title" className="font-heading text-[26px] font-semibold text-mynted-ink">
          {t(renewal ? 'pro.success.renewedTitle' : 'pro.success.title')}
        </h1>
        <p className="max-w-md text-sm text-mynted-gray">
          {t('pro.success.covers', {
            from: formatPaymentDate(payment.coversFrom, language),
            until: formatPaymentDate(payment.coversUntil, language),
          })}
        </p>
      </div>

      <dl className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-mynted-bg p-4 text-left text-sm">
        <dt className="text-mynted-gray">{t('pro.success.plan')}</dt>
        <dd className="text-right font-semibold text-mynted-ink">{t(PERIOD_LABEL[payment.period])}</dd>
        <dt className="text-mynted-gray">{t('pro.success.amount')}</dt>
        <dd className="text-right font-semibold text-mynted-ink">{formatPrice(payment.amount, payment.currency, language)}</dd>
        <dt className="text-mynted-gray">{t('pro.success.card')}</dt>
        <dd className="text-right font-mono text-mynted-ink">{maskedCard(payment.cardLast4)}</dd>
        {payment.gatewayReference && (
          <>
            <dt className="text-mynted-gray">{t('pro.success.reference')}</dt>
            <dd className="text-right font-mono text-mynted-ink">{payment.gatewayReference}</dd>
          </>
        )}
      </dl>

      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <Link
          to="/settings"
          search={{ tab: 'appearance' }}
          className={cx(proLinkButtonClass, 'flex-1 bg-mynted-orange text-white hover:bg-mynted-orange-hover')}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {t('pro.success.customize')}
        </Link>
        <Link
          to="/settings"
          search={{ tab: 'subscription' }}
          className={cx(proLinkButtonClass, 'flex-1 border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg')}
        >
          {t('pro.success.viewSubscription')}
        </Link>
      </div>
    </section>
  )
}
