import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ImagePlus, Palette, Rocket, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Accordion } from '@/components/ui/Accordion'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
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

        {subscription.data && status !== 'none' && (
          <ScrollReveal>
            <CurrentPlanNotice subscription={subscription.data} />
          </ScrollReveal>
        )}

        <section aria-labelledby="pro-plans-title" className="flex flex-col gap-6">
          <ScrollReveal className="flex flex-col gap-1">
            {/* scroll-mt: al llegar con "Ver planes" el título no queda tapado por el header fijo. */}
            <h2 id="pro-plans-title" className="scroll-mt-28 font-heading text-[26px] font-semibold text-mynted-ink">
              {t('pro.plans.title')}
            </h2>
            <p className="text-sm text-mynted-gray">{t('pro.plans.subtitle')}</p>
          </ScrollReveal>

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
              <ul className="grid items-stretch gap-5 pt-3 md:grid-cols-3">
                {sortedPlans.map((plan, index) => (
                  // eager: si los planes ya se ven al cargar, entran de una vez (escalonados).
                  <StaggerItem key={plan.period} index={index} eager className="flex *:w-full">
                    <PlanCard
                      plan={plan}
                      highlighted={plan.period === RECOMMENDED_PERIOD}
                      ctaLabel={t(CTA_LABEL[status])}
                      isLoggedIn={isLoggedIn}
                    />
                  </StaggerItem>
                ))}
              </ul>
              <ScrollReveal>
                <p className="text-xs text-mynted-gray">{t('pro.plans.footnote')}</p>
              </ScrollReveal>
            </>
          )}
        </section>

        <section aria-labelledby="pro-benefits-title" className="flex flex-col gap-6">
          <ScrollReveal>
            <h2 id="pro-benefits-title" className="font-heading text-[26px] font-semibold text-mynted-ink">
              {t('pro.benefits.title')}
            </h2>
          </ScrollReveal>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, index) => (
              <StaggerItem
                key={benefit.title}
                index={index}
                className="group flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-5 transition-[border-color,box-shadow] duration-300 hover:border-mynted-orange/40 hover:shadow-[0_12px_30px_-14px_rgba(253,133,82,0.45)]"
              >
                <span
                  className="flex size-10 items-center justify-center rounded-xl bg-mynted-orange/10 text-mynted-orange transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                  aria-hidden="true"
                >
                  {benefit.icon}
                </span>
                <h3 className="font-heading text-base font-semibold text-mynted-ink">{t(benefit.title)}</h3>
                <p className="text-sm text-mynted-gray">{t(benefit.body)}</p>
              </StaggerItem>
            ))}
          </ul>
          <ScrollReveal>
            <p className="text-sm text-mynted-gray">{t('pro.benefits.freeStaysFree')}</p>
          </ScrollReveal>
        </section>

        <section aria-labelledby="pro-faq-title" className="flex flex-col gap-4">
          <ScrollReveal>
            <h2 id="pro-faq-title" className="font-heading text-[26px] font-semibold text-mynted-ink">
              {t('pro.faq.title')}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <Accordion
              items={FAQ.map((item) => ({ id: item.question, title: t(item.question), content: t(item.answer) }))}
            />
          </ScrollReveal>
        </section>
      </main>
    </div>
  )
}

/** Cabecera de la página: qué es Pro, con un avatar de ejemplo (marco neón y ganso astronauta). */
const HERO_EASE = [0.22, 1, 0.36, 1] as const

function ProHero() {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()

  /** Entrada escalonada de cada pieza del hero al cargar (solo fundido con "reducir movimiento"). */
  const enter = (index: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: HERO_EASE, delay: reduceMotion ? 0 : 0.1 + index * 0.1 },
  })

  function goToPlans() {
    document
      .getElementById('pro-plans-title')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section
      aria-labelledby="pro-hero-title"
      className="relative overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-12 sm:py-14"
      style={{ background: 'linear-gradient(150deg, #0b1437 0%, #1b1450 55%, #3a1747 100%)' }}
    >
      {/* Luces del fondo: se desplazan despacio, en bucle. */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-24 -left-16 size-72 rounded-full bg-mynted-orange/35 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, 24, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-10 -bottom-28 size-80 rounded-full bg-mynted-blue/40 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -36, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-xl flex-col items-start gap-4">
          <motion.div {...enter(0)}>
            <ProBadge size="md" />
          </motion.div>
          <motion.h1
            id="pro-hero-title"
            className="font-heading text-[32px] leading-tight font-semibold sm:text-[40px]"
            {...enter(1)}
          >
            {t('pro.hero.title')}
          </motion.h1>
          <motion.p className="text-base text-white/80" {...enter(2)}>
            {t('pro.hero.subtitle')}
          </motion.p>
          <motion.button
            type="button"
            onClick={goToPlans}
            className={cx(proLinkButtonClass, 'cursor-pointer bg-mynted-orange text-white hover:bg-mynted-orange-hover')}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            {...enter(3)}
          >
            {t('pro.hero.cta')}
          </motion.button>
        </div>

        <motion.div
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center self-center"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: HERO_EASE, delay: reduceMotion ? 0 : 0.25 }}
        >
          {/* El ganso astronauta "flota" suavemente. */}
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [0, 1.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AvatarFrame frame={{ code: 'frame_neon', assetUrl: null }} size="lg" className="size-40 sm:size-48">
              <span className="flex size-full items-center justify-center rounded-full border-4 border-[#1b1450] bg-white/95">
                <SkinnedGoose skin={{ code: 'goose_astronaut', assetUrl: null }} className="size-[78%]" />
              </span>
            </AvatarFrame>
          </motion.div>
        </motion.div>
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
