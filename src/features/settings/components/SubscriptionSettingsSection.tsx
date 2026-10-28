import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CalendarClock, CircleCheck, CircleX, Sparkles } from 'lucide-react'
import { getHttpStatus } from '@/api/apiError'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPaymentDate, formatPaymentDateShort, maskedCard } from '@/features/payments/utils/paymentFormat'
import { proLinkButtonClass } from '@/features/pro/components/PlanCard'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { useCancelSubscription, useMySubscription, useMySubscriptionPayments } from '@/features/pro/hooks/useSubscription'
import type { MySubscription, SubscriptionPayment } from '@/features/pro/models/subscription'
import { FAILURE_MESSAGE, PERIOD_LABEL, STATUS_LABEL, STATUS_PILL } from '@/features/pro/utils/subscriptionFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { formatPrice } from '@/utils/price'
import { SettingsCard, SettingsReadOnlyRow } from './SettingsCard'

/**
 * Pestaña "Suscripción" de /settings: estado de Mynted Pro, renovar,
 * cancelar y el historial de pagos. Es el destino del aviso "pago confirmado".
 */
export function SubscriptionSettingsSection() {
  const { t } = useLanguage()
  const subscription = useMySubscription()

  if (subscription.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <div className="h-56 animate-pulse rounded-2xl bg-white" />
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      </div>
    )
  }

  if (subscription.isError) {
    return (
      <QueryErrorState
        error={subscription.error}
        onRetry={() => void subscription.refetch()}
        texts={{ error: { description: t('settings.subscription.loadError') } }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PlanStatusCard subscription={subscription.data} />
      {subscription.data.status !== 'none' && <PaymentsHistoryCard />}
    </div>
  )
}

function PlanStatusCard({ subscription }: { subscription: MySubscription }) {
  const { t, language } = useLanguage()
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const endsAt = formatPaymentDate(subscription.endsAt, language)

  if (subscription.status === 'none') {
    return (
      <SettingsCard title={t('settings.subscription.title')} description={t('settings.subscription.noneDescription')}>
        <div className="flex flex-col items-start gap-4 rounded-xl bg-mynted-bg p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ProBadge size="md" className="mt-0.5" />
            <p className="text-sm text-mynted-ink">{t('settings.subscription.noneBody')}</p>
          </div>
          <Link
            to="/pro"
            className={cx(proLinkButtonClass, 'h-10 shrink-0 bg-mynted-orange text-white hover:bg-mynted-orange-hover')}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {t('pro.plans.ctaJoin')}
          </Link>
        </div>
      </SettingsCard>
    )
  }

  const message =
    subscription.status === 'active'
      ? t(subscription.daysRemaining === 1 ? 'pro.current.activeOne' : 'pro.current.active', { date: endsAt, days: subscription.daysRemaining })
      : subscription.status === 'cancelled'
        ? t('pro.current.cancelled', { date: endsAt })
        : t('pro.current.expired', { date: endsAt })

  return (
    <SettingsCard title={t('settings.subscription.title')} description={t('settings.subscription.description')}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <ProBadge size="md" className={cx(!subscription.isPro && 'opacity-40 grayscale')} />
          <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_PILL[subscription.status])}>
            {t(STATUS_LABEL[subscription.status])}
          </span>
        </div>
        <p className="text-sm text-mynted-ink" role="status">
          {message}
        </p>

        <div className="flex flex-col gap-3 border-t border-mynted-border pt-4">
          {subscription.period && (
            <SettingsReadOnlyRow label={t('settings.subscription.period')} value={t(PERIOD_LABEL[subscription.period])} />
          )}
          <SettingsReadOnlyRow label={t('settings.subscription.startsAt')} value={formatPaymentDate(subscription.startsAt, language)} />
          <SettingsReadOnlyRow
            label={t(subscription.isPro ? 'settings.subscription.endsAt' : 'settings.subscription.endedAt')}
            value={endsAt}
          />
          {subscription.isPro && (
            <SettingsReadOnlyRow
              label={t('settings.subscription.daysRemaining')}
              value={t(subscription.daysRemaining === 1 ? 'settings.subscription.dayOne' : 'settings.subscription.days', { count: subscription.daysRemaining })}
            />
          )}
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-mynted-bg px-3 py-2.5 text-xs text-mynted-ink">
          <CalendarClock className="mt-px size-4 shrink-0 text-mynted-orange" aria-hidden="true" />
          {t(subscription.isPro ? 'settings.subscription.manualRenewActive' : 'settings.subscription.manualRenewExpired')}
        </p>

        <div className="flex flex-col-reverse gap-2 border-t border-mynted-border pt-5 sm:flex-row sm:justify-end">
          {/* Cancelar solo tiene sentido con Pro vigente y sin cancelar (si no, el backend da 409). */}
          {subscription.status === 'active' && (
            <Button type="button" variant="destructive-secondary" size="md" onClick={() => setIsCancelOpen(true)}>
              {t('settings.subscription.cancel')}
            </Button>
          )}
          <Link
            to="/pro"
            className={cx(proLinkButtonClass, 'h-10 bg-mynted-orange text-white hover:bg-mynted-orange-hover')}
          >
            {t(subscription.status === 'expired' ? 'pro.plans.ctaRenew' : 'pro.plans.ctaExtend')}
          </Link>
        </div>
      </div>

      <CancelSubscriptionDialog open={isCancelOpen} endsAt={endsAt} onClose={() => setIsCancelOpen(false)} />
    </SettingsCard>
  )
}

/**
 * Confirmación de cancelar. No reembolsa ni corta el acceso: sigue siendo Pro
 * hasta `endsAt`. Como la renovación ya es manual, sirve para dejar constancia
 * y para que los avisos de vencimiento no pidan renovar.
 */
function CancelSubscriptionDialog({ open, endsAt, onClose }: { open: boolean; endsAt: string; onClose: () => void }) {
  const { t } = useLanguage()
  const cancel = useCancelSubscription()

  function close() {
    cancel.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('settings.subscription.cancelTitle')}</DialogTitle>
          <DialogDescription>{t('settings.subscription.cancelBody', { date: endsAt })}</DialogDescription>
        </DialogHeader>
        {cancel.isError && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {getHttpStatus(cancel.error) === 409 ? t('settings.subscription.cancelConflict') : t('settings.subscription.cancelError')}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" size="md" disabled={cancel.isPending} onClick={close}>
            {t('settings.subscription.keep')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="md"
            isLoading={cancel.isPending}
            onClick={() => cancel.mutate(undefined, { onSuccess: close })}
          >
            {t('settings.subscription.confirmCancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentsHistoryCard() {
  const { t } = useLanguage()
  const payments = useMySubscriptionPayments()
  const items = payments.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <SettingsCard title={t('settings.subscription.historyTitle')} description={t('settings.subscription.historyDescription')}>
      {payments.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-16 animate-pulse rounded-xl bg-mynted-bg" />
          ))}
        </div>
      ) : payments.isError ? (
        <QueryErrorState error={payments.error} onRetry={() => void payments.refetch()} variant="compact" />
      ) : items.length === 0 ? (
        <p className="text-sm text-mynted-gray">{t('settings.subscription.historyEmpty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col divide-y divide-mynted-border rounded-xl border border-mynted-border">
            {items.map((payment) => (
              <li key={payment.id}>
                <PaymentRow payment={payment} />
              </li>
            ))}
          </ul>
          {payments.hasNextPage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-center"
              isLoading={payments.isFetchingNextPage}
              onClick={() => void payments.fetchNextPage()}
            >
              {t('settings.subscription.loadMore')}
            </Button>
          )}
        </div>
      )}
    </SettingsCard>
  )
}

/** Un pago: fecha, periodo, tarjeta, tramo que cubrió (o por qué se rechazó) y monto. */
function PaymentRow({ payment }: { payment: SubscriptionPayment }) {
  const { t, language } = useLanguage()
  const isCompleted = payment.status === 'completed'

  const detail = isCompleted
    ? t('settings.subscription.coverage', {
        from: formatPaymentDateShort(payment.coversFrom, language),
        until: formatPaymentDateShort(payment.coversUntil, language),
      })
    : payment.failureReason
      ? t(FAILURE_MESSAGE[payment.failureReason])
      : t('checkout.failure.generic')

  return (
    <article className="flex items-center gap-3 px-4 py-3">
      <span
        className={cx(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          isCompleted ? 'bg-[#e8faf2] text-[#0d8c66]' : 'bg-[#fdecec] text-[#c62a2f]',
        )}
        aria-hidden="true"
      >
        {isCompleted ? <CircleCheck className="size-4" /> : <CircleX className="size-4" />}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-mynted-ink">
          {t(PERIOD_LABEL[payment.period])}
          <span className={cx('text-xs font-medium', isCompleted ? 'text-[#0d8c66]' : 'text-[#c62a2f]')}>
            {t(isCompleted ? 'settings.subscription.paymentCompleted' : 'settings.subscription.paymentFailed')}
          </span>
        </p>
        <p className="truncate text-xs text-mynted-gray">{detail}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-mynted-gray">
          <time dateTime={payment.createdAt}>{formatPaymentDateShort(payment.createdAt, language)}</time>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{maskedCard(payment.cardLast4)}</span>
        </p>
      </div>

      <span className={cx('shrink-0 font-heading text-sm font-semibold', isCompleted ? 'text-mynted-ink' : 'text-mynted-gray line-through')}>
        {formatPrice(payment.amount, payment.currency, language)}
      </span>
    </article>
  )
}
