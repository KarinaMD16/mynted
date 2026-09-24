import { useState, type ReactNode } from 'react'
import axios from 'axios'
import { Building2, Check, Eye, EyeOff, LoaderCircle, MapPin, Wallet, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { useLastDefined } from '@/hooks/useLastDefined'
import { formatShortDate } from '@/utils/relativeTime'
import { Avatar, StatusPill } from './AdminUi'
import { useSellerDecisionMutation, useSellerRequest } from '../hooks/useAdminQueries'
import type { SellerDecision, SellerPaymentInfo, SellerRequestDetail } from '../models/admin'

/**
 * Diálogo con los datos de una solicitud de vendedor pendiente
 * (GET /users/seller-request/:id), para revisarlos antes de decidir. Desde
 * acá se aprueba o se rechaza con PATCH /users/:id/seller-status; al
 * terminar, la fila de la tabla y el contador de la barra lateral se
 * actualizan solos (ver useSellerDecisionMutation).
 */
export function SellerRequestDialog({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const { t } = useLanguage()
  // Durante la animación de cierre userId ya es null: se siguen mostrando los datos de la última solicitud.
  const shownUserId = useLastDefined(userId)
  const requestQuery = useSellerRequest(shownUserId)
  const decision = useSellerDecisionMutation()
  const [pendingDecision, setPendingDecision] = useState<SellerDecision | null>(null)

  const isNotPending = axios.isAxiosError(requestQuery.error) && requestQuery.error.response?.status === 404

  function decide(status: SellerDecision) {
    if (!userId) return
    setPendingDecision(status)
    decision.mutate(
      { userId, status },
      {
        onSuccess: () => close(),
        onSettled: () => setPendingDecision(null),
      },
    )
  }

  function close() {
    decision.reset()
    onClose()
  }

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && !decision.isPending && close()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('admin.sellerRequest.title')}</DialogTitle>
          <DialogDescription>{t('admin.sellerRequest.subtitle')}</DialogDescription>
        </DialogHeader>

        {requestQuery.isPending && (
          <div className="mt-6 flex flex-col gap-3" aria-busy="true">
            <div className="h-24 animate-pulse rounded-xl bg-mynted-bg" />
            <div className="h-16 animate-pulse rounded-xl bg-mynted-bg" />
            <div className="h-28 animate-pulse rounded-xl bg-mynted-bg" />
          </div>
        )}

        {requestQuery.isError && (
          <div className="mt-6 rounded-xl border border-mynted-border px-4 py-6 text-center" role="alert">
            <p className="text-sm font-semibold text-mynted-ink">
              {isNotPending ? t('admin.sellerRequest.notPending') : t('admin.table.loadError')}
            </p>
            {!isNotPending && (
              <>
                <p className="mt-1 text-sm text-mynted-gray">{getApiErrorMessage(requestQuery.error)}</p>
                <button
                  type="button"
                  onClick={() => void requestQuery.refetch()}
                  className="mt-4 rounded-lg border border-mynted-border bg-white px-4 py-2 text-sm font-semibold text-mynted-ink hover:cursor-pointer hover:bg-mynted-bg"
                >
                  {t('communities.list.retry')}
                </button>
              </>
            )}
          </div>
        )}

        {requestQuery.data && <RequestDetails request={requestQuery.data} />}

        {requestQuery.data && (
          <div className="mt-6 flex flex-col gap-3">
            {decision.isError && (
              <p className="text-sm text-red-500" role="alert">
                {getApiErrorMessage(decision.error)}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                disabled={decision.isPending}
                className="rounded-xl border border-mynted-border bg-white px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('profile.edit.close')}
              </button>
              <button
                type="button"
                onClick={() => decide('rejected')}
                disabled={decision.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:cursor-pointer hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingDecision === 'rejected' ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
                {t('admin.sellers.reject')}
              </button>
              <button
                type="button"
                onClick={() => decide('approved')}
                disabled={decision.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingDecision === 'approved' ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                {t('admin.sellerRequest.approve')}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RequestDetails({ request }: { request: SellerRequestDetail }) {
  const { t, language } = useLanguage()
  const { user } = request

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* Tienda */}
      <section className="rounded-xl border border-mynted-border p-4">
        <SectionTitle>{t('admin.sellerRequest.shop')}</SectionTitle>
        <p className="mt-2 font-heading text-lg font-semibold text-mynted-ink">{request.displayName}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-mynted-gray">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {request.location}
        </p>
        <p className="mt-3 text-sm whitespace-pre-line text-mynted-ink">{request.description}</p>
      </section>

      {/* Solicitante */}
      <section className="rounded-xl border border-mynted-border p-4">
        <SectionTitle>{t('admin.sellerRequest.applicant')}</SectionTitle>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={user.photoUrl} name={user.username} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-mynted-ink">{user.username}</p>
              <p className="truncate text-sm text-mynted-gray">{user.email}</p>
            </div>
          </div>
          <span className="shrink-0 text-xs text-mynted-gray">
            {t('admin.review.requestedOn', {
              date: formatShortDate(user.sellerRequestedAt ?? user.updatedAt, language),
            })}
          </span>
        </div>
      </section>

      {/* Pago */}
      <section className="rounded-xl border border-mynted-border p-4">
        <SectionTitle>{t('admin.sellerRequest.payment')}</SectionTitle>
        {request.paymentInfo ? (
          <PaymentDetails payment={request.paymentInfo} />
        ) : (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('admin.sellerRequest.paymentMissing')}
          </p>
        )}
      </section>
    </div>
  )
}

function PaymentDetails({ payment }: { payment: SellerPaymentInfo }) {
  const { t } = useLanguage()
  const isBank = payment.type === 'bank_account'
  const Icon = isBank ? Building2 : Wallet

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div>
        <StatusPill tone={isBank ? 'blue' : 'violet'}>
          <Icon className="mr-1.5 size-3.5" aria-hidden="true" />
          {isBank ? t('profile.becomeSeller.paymentTypeBank') : t('profile.becomeSeller.paymentTypePaypal')}
        </StatusPill>
      </div>
      <dl className="flex flex-col gap-2.5">
        <DetailRow label={t('profile.becomeSeller.ownerFullNameLabel')}>{payment.ownerFullName}</DetailRow>
        <DetailRow label={isBank ? t('profile.becomeSeller.bankNameLabel') : t('profile.becomeSeller.paypalNameLabel')}>
          {payment.name}
        </DetailRow>
        <DetailRow
          label={isBank ? t('profile.becomeSeller.bankNumberLabel') : t('profile.becomeSeller.paypalEmailLabel')}
        >
          {/* El correo de PayPal no es tan sensible como un número de cuenta: se muestra completo. */}
          {isBank ? <MaskedValue value={payment.number} /> : payment.number}
        </DetailRow>
      </dl>
    </div>
  )
}

/**
 * Número de cuenta oculto por defecto (solo los últimos 4 dígitos), por si
 * hay alguien mirando la pantalla; se revela con un botón.
 */
function MaskedValue({ value }: { value: string }) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)
  const masked = value.length > 4 ? `•••• ${value.slice(-4)}` : value

  return (
    <span className="flex items-center gap-2">
      <code className="rounded bg-mynted-bg px-1.5 py-0.5 text-xs break-all text-mynted-ink">
        {visible ? value : masked}
      </code>
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t('admin.sellerRequest.hideNumber') : t('admin.sellerRequest.showNumber')}
        title={visible ? t('admin.sellerRequest.hideNumber') : t('admin.sellerRequest.showNumber')}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-mynted-gray hover:bg-mynted-bg hover:text-mynted-ink"
      >
        {visible ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
      </button>
    </span>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-[0.12em] text-mynted-gray uppercase [:lang(ko)_&]:tracking-normal">
      {children}
    </h3>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 text-sm">
      <dt className="text-mynted-gray">{label}</dt>
      <dd className="min-w-0 text-mynted-ink">{children}</dd>
    </div>
  )
}
