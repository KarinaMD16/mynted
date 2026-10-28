import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ImagePlus, Palette, Rocket, Sparkles } from 'lucide-react'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { formatPaymentDate } from '@/features/payments/utils/paymentFormat'
import { AvatarFrame } from '@/features/pro/components/AvatarFrame'
import { PlanCard, proLinkButtonClass } from '@/features/pro/components/PlanCard'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { SkinnedGoose } from '@/features/pro/components/SkinnedGoose'
import { useMySubscription, useSubscriptionPlans } from '@/features/pro/hooks/useSubscription'
import { RECOMMENDED_PERIOD, SUBSCRIPTION_PERIODS, type MySubscription, type SubscriptionStatus } from '@/features/pro/models/subscription'
import { STATUS_LABEL, STATUS_PILL } from '@/features/pro/utils/subscriptionFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { cx } from '@/utils/cx'

const CTA_LABEL: Record<SubscriptionStatus, TranslationKey> = {
  none: 'pro.plans.ctaJoin',
  active: 'pro.plans.ctaExtend',
  cancelled: 'pro.plans.ctaExtend',
  expired: 'pro.plans.ctaRenew',
}

const BENEFITS: { icon: ReactNode; title: TranslationKey; body: TranslationKey }[] = [
  { icon: <Sparkles className="size-5" />, title: 'pro.benefits.badgeTitle', body: 'pro.benefits.badgeBody' },
  { icon: <Palette className="size-5" />, title: 'pro.benefits.cosmeticsTitle', body: 'pro.benefits.cosmeticsBody' },
  { icon: <ImagePlus className="size-5" />, title: 'pro.benefits.bannerTitle', body: 'pro.benefits.bannerBody' },
  { icon: <Rocket className="size-5" />, title: 'pro.benefits.featuredTitle', body: 'pro.benefits.featuredBody' },
]

const FAQ: { question: TranslationKey; answer: TranslationKey }[] = [
  { question: 'pro.faq.renewQ', answer: 'pro.faq.renewA' },
  { question: 'pro.faq.expireQ', answer: 'pro.faq.expireA' },
  { question: 'pro.faq.cancelQ', answer: 'pro.faq.cancelA' },
  { question: 'pro.faq.currencyQ', answer: 'pro.faq.currencyA' },
]

/**
 * /pro — planes de Mynted Pro (GET /subscriptions/plans, público) y, con
 * sesión, el estado de la suscripción (GET /subscriptions/me). Cada plan lleva
 * al pago en /pro/checkout?period=. Es también el destino de los avisos
 * "tu Pro está por vencer" y "tu Pro venció".
 */
export default function ProPage() {
  const { t } = useLanguage()
  const { isLoggedIn } = useCurrentUser()
  const plans = useSubscriptionPlans()
  const subscription = useMySubscription(isLoggedIn)
  const status: SubscriptionStatus = subscription.data?.status ?? 'none'

  // El orden de la guía (mensual → anual), por si el backend los manda en otro.
  const sortedPlans = [...(plans.data?.plans ?? [])].sort(
    (a, b) => SUBSCRIPTION_PERIODS.indexOf(a.period) - SUBSCRIPTION_PERIODS.indexOf(b.period),
  )

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-12 pt-6 pb-24')}>
        <ProHero />

        {subscription.data && status !== 'none' && <CurrentPlanNotice subscription={subscription.data} />}

        <section aria-labelledby="pro-plans-title" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 id="pro-plans-title" className="font-heading text-[26px] font-semibold text-mynted-ink">
              {t('pro.plans.title')}
            </h2>
            <p className="text-sm text-mynted-gray">{t('pro.plans.subtitle')}</p>
          </div>

          {plans.isPending ? (
            <div className="grid gap-5 md:grid-cols-3" aria-busy="true">
              {SUBSCRIPTION_PERIODS.map((period) => (
                <div key={period} className="h-[380px] animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : plans.isError ? (
            <QueryErrorState
              error={plans.error}
              onRetry={() => void plans.refetch()}
              texts={{ error: { description: t('pro.plans.loadError') } }}
            />
          ) : (
            <>
              <div className="grid items-stretch gap-5 pt-3 md:grid-cols-3">
                {sortedPlans.map((plan) => (
                  <PlanCard
                    key={plan.period}
                    plan={plan}
                    highlighted={plan.period === RECOMMENDED_PERIOD}
                    ctaLabel={t(CTA_LABEL[status])}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
              <p className="text-xs text-mynted-gray">{t('pro.plans.footnote')}</p>
            </>
          )}
        </section>

        <section aria-labelledby="pro-benefits-title" className="flex flex-col gap-6">
          <h2 id="pro-benefits-title" className="font-heading text-[26px] font-semibold text-mynted-ink">
            {t('pro.benefits.title')}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-mynted-orange/10 text-mynted-orange" aria-hidden="true">
                  {benefit.icon}
                </span>
                <h3 className="font-heading text-base font-semibold text-mynted-ink">{t(benefit.title)}</h3>
                <p className="text-sm text-mynted-gray">{t(benefit.body)}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-mynted-gray">{t('pro.benefits.freeStaysFree')}</p>
        </section>

        <section aria-labelledby="pro-faq-title" className="flex flex-col gap-4">
          <h2 id="pro-faq-title" className="font-heading text-[26px] font-semibold text-mynted-ink">
            {t('pro.faq.title')}
          </h2>
          <div className="flex flex-col divide-y divide-mynted-border rounded-2xl border border-mynted-border bg-white">
            {FAQ.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-mynted-ink outline-none focus-visible:underline">
                  {t(item.question)}
                  <ChevronDown className="size-4 shrink-0 text-mynted-gray transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-2 text-sm text-mynted-gray">{t(item.answer)}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

/** Cabecera de la página: qué es Pro, con un avatar de ejemplo (marco neón y ganso astronauta). */
function ProHero() {
  const { t } = useLanguage()

  return (
    <section
      aria-labelledby="pro-hero-title"
      className="relative overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-12 sm:py-14"
      style={{ background: 'linear-gradient(150deg, #0b1437 0%, #1b1450 55%, #3a1747 100%)' }}
    >
      <div aria-hidden="true" className="absolute -top-24 -left-16 size-72 rounded-full bg-mynted-orange/35 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-10 -bottom-28 size-80 rounded-full bg-mynted-blue/40 blur-3xl" />

      <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-xl flex-col items-start gap-4">
          <ProBadge size="md" />
          <h1 id="pro-hero-title" className="font-heading text-[32px] leading-tight font-semibold sm:text-[40px]">
            {t('pro.hero.title')}
          </h1>
          <p className="text-base text-white/80">{t('pro.hero.subtitle')}</p>
          <button
            type="button"
            onClick={() => document.getElementById('pro-plans-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className={cx(proLinkButtonClass, 'cursor-pointer bg-mynted-orange text-white hover:bg-mynted-orange-hover')}
          >
            {t('pro.hero.cta')}
          </button>
        </div>

        <div aria-hidden="true" className="flex shrink-0 items-center justify-center self-center">
          <AvatarFrame frame={{ code: 'frame_neon', assetUrl: null }} size="lg" className="size-40 sm:size-48">
            <span className="flex size-full items-center justify-center rounded-full border-4 border-[#1b1450] bg-white/95">
              <SkinnedGoose skin={{ code: 'goose_astronaut', assetUrl: null }} className="size-[78%]" />
            </span>
          </AvatarFrame>
        </div>
      </div>
    </section>
  )
}

/** Estado de la suscripción de quien mira, con el enlace a gestionarla. */
function CurrentPlanNotice({ subscription }: { subscription: MySubscription }) {
  const { t, language } = useLanguage()
  const date = formatPaymentDate(subscription.endsAt, language)
  const text =
    subscription.status === 'active'
      ? t(subscription.daysRemaining === 1 ? 'pro.current.activeOne' : 'pro.current.active', { date, days: subscription.daysRemaining })
      : subscription.status === 'cancelled'
        ? t('pro.current.cancelled', { date })
        : t('pro.current.expired', { date })

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1.5">
        <span className={cx('w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_PILL[subscription.status])}>
          {t(STATUS_LABEL[subscription.status])}
        </span>
        <p className="text-sm text-mynted-ink">{text}</p>
      </div>
      <Link
        to="/settings"
        search={{ tab: 'subscription' }}
        className={cx(proLinkButtonClass, 'h-10 shrink-0 border border-mynted-border bg-white text-mynted-ink hover:bg-mynted-bg')}
      >
        {t('pro.current.manage')}
      </Link>
    </div>
  )
}
