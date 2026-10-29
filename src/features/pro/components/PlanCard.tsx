import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import type { SubscriptionPlan } from '../models/subscription'
import { getPlanPrices, PERIOD_LABEL, PERIOD_PER } from '../utils/subscriptionFormat'

export const proLinkButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-xs transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid'

interface PlanCardProps {
  plan: SubscriptionPlan
  /** El plan recomendado: borde naranja y etiqueta "Mejor precio". */
  highlighted?: boolean
  ctaLabel: string
  /** Sin sesión el botón lleva a iniciar sesión en vez de al pago. */
  isLoggedIn: boolean
}

/** Tarjeta de un periodo del plan Pro, con su precio, el ahorro y el botón para pagarlo. */
export function PlanCard({ plan, highlighted = false, ctaLabel, isLoggedIn }: PlanCardProps) {
  const { t, language } = useLanguage()
  const prices = getPlanPrices(plan, language)
  const titleId = `pro-plan-${plan.period}`

  return (
    <article
      aria-labelledby={titleId}
      className={cx(
        'relative flex flex-col gap-5 rounded-2xl bg-white p-6',
        highlighted
          ? 'border-2 border-mynted-orange shadow-[0_16px_40px_-12px_rgba(253,133,82,0.45)]'
          : 'border border-mynted-border',
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-mynted-orange px-3 py-1 text-xs font-semibold text-white shadow-xs">
          {t('pro.plans.bestValue')}
        </span>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 id={titleId} className="font-heading text-lg font-semibold text-mynted-ink">
          {t(PERIOD_LABEL[plan.period])}
        </h3>
        {plan.savingsPercent > 0 && (
          <span className="rounded-full bg-[#e8faf2] px-2.5 py-1 text-xs font-semibold text-[#0d8c66]">
            {t('pro.plans.save', { percent: plan.savingsPercent })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-heading text-[32px] leading-none font-semibold text-mynted-ink">{prices.main}</span>
          <span className="text-sm text-mynted-gray">{t(PERIOD_PER[plan.period])}</span>
        </p>
        <p className="min-h-5 text-sm text-mynted-gray">
          {prices.perMonth ? t('pro.plans.perMonth', { amount: prices.perMonth }) : t('pro.plans.flexible')}
        </p>
        {prices.charged && <p className="text-xs text-mynted-gray-light">{t('pro.plans.chargedAs', { amount: prices.charged })}</p>}
      </div>

      <ul className="flex flex-col gap-2 text-sm text-mynted-ink">
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t(plan.months === 1 ? 'pro.plans.coversOne' : 'pro.plans.covers', { months: plan.months })}
        </li>
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('pro.plans.allBenefits')}
        </li>
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t('pro.plans.noAutoRenew')}
        </li>
      </ul>

      {isLoggedIn ? (
        <Link
          to="/pro/checkout"
          search={{ period: plan.period }}
          className={cx(
            proLinkButtonClass,
            'mt-auto w-full',
            highlighted
              ? 'bg-mynted-orange text-white hover:bg-mynted-orange-hover'
              : 'border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg',
          )}
        >
          {ctaLabel}
        </Link>
      ) : (
        <Link
          to="/login"
          className={cx(proLinkButtonClass, 'mt-auto w-full border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg')}
        >
          {t('pro.plans.signInToBuy')}
        </Link>
      )}
    </article>
  )
}
