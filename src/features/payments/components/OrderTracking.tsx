import { useId, useState, type ReactNode } from 'react'
import { Check, MapPin, MessageCircle, PackageCheck, Scale, Truck } from 'lucide-react'
import { getHttpStatus } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusPill, type PillTone } from '@/features/admin/components/AdminUi'
import { useContactSeller } from '@/features/chat/hooks/useContactSeller'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { regionFlag, regionName } from '@/utils/locale'
import { cx } from '@/utils/cx'
import {
  useCancelOrderMutation,
  useConfirmDeliveryMutation,
  useOpenDisputeMutation,
  useShipOrderMutation,
} from '../hooks/usePaymentMutations'
import type {
  PaymentReceipt,
  ReceiptDispute,
  ShippingAddressPayload,
  ShippingStatus,
  TransactionStatus,
} from '../models/payment'
import { formatPaymentDate } from '../utils/paymentFormat'

/**
 * Seguimiento de un pedido ya pagado: en qué va el envío, a dónde se manda y
 * lo que cada parte puede hacer en cada paso (ver docs/FLUJO_COMPRAS_PAGOS.md
 * del backend).
 *
 * | Paso      | Vendedor                      | Comprador        |
 * |-----------|-------------------------------|------------------|
 * | paid      | marcar enviado, cancelar      | —                |
 * | shipped   | —                             | "Lo recibí"      |
 * | delivered | —                             | abrir un reclamo |
 */

// -----------------------------------------------------------------------------
// Estado
// -----------------------------------------------------------------------------

type OrderState = 'refunded' | 'paid' | 'shipped' | 'delivered' | 'legacy'

const STATE_LABEL: Record<OrderState, TranslationKey> = {
  refunded: 'order.status.refunded',
  paid: 'order.status.paid',
  shipped: 'order.status.shipped',
  delivered: 'order.status.delivered',
  legacy: 'order.status.legacy',
}

const STATE_TONE: Record<OrderState, PillTone> = {
  refunded: 'red',
  paid: 'amber',
  shipped: 'blue',
  delivered: 'teal',
  legacy: 'gray',
}

/** El pago manda: una compra reembolsada ya no "va" a ningún lado, aunque conserve el paso del envío. */
function orderState(paymentStatus: TransactionStatus, shippingStatus: ShippingStatus | null): OrderState {
  if (paymentStatus === 'refunded') return 'refunded'
  return shippingStatus ?? 'legacy'
}

/** Píldora con el estado del pedido, para el recibo y los listados. */
export function OrderStatusPill({
  paymentStatus,
  shippingStatus,
}: {
  paymentStatus: TransactionStatus
  shippingStatus: ShippingStatus | null
}) {
  const { t } = useLanguage()
  const state = orderState(paymentStatus, shippingStatus)
  return <StatusPill tone={STATE_TONE[state]}>{t(STATE_LABEL[state])}</StatusPill>
}

// -----------------------------------------------------------------------------
// Línea de tiempo
// -----------------------------------------------------------------------------

const STEPS: { status: ShippingStatus; label: TranslationKey; icon: typeof Check }[] = [
  { status: 'paid', label: 'order.step.paid', icon: Check },
  { status: 'shipped', label: 'order.step.shipped', icon: Truck },
  { status: 'delivered', label: 'order.step.delivered', icon: PackageCheck },
]

export function OrderTimeline({ receipt }: { receipt: PaymentReceipt }) {
  const { t, language } = useLanguage()
  const current = receipt.shippingStatus
  if (current === null) {
    return <p className="rounded-xl bg-mynted-bg px-3.5 py-2.5 text-sm text-mynted-gray">{t('order.legacyHint')}</p>
  }

  const reached = STEPS.findIndex((step) => step.status === current)
  const dates: Record<ShippingStatus, string | null> = {
    paid: receipt.date,
    shipped: receipt.shippedAt,
    delivered: receipt.deliveredAt,
  }
  const isRefunded = receipt.status === 'refunded'

  return (
    <div className="flex flex-col gap-3">
      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const done = index <= reached
          const Icon = step.icon
          const date = dates[step.status]
          return (
            <li key={step.status} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cx(
                  'grid size-9 place-items-center rounded-full',
                  done ? (isRefunded ? 'bg-mynted-gray-light text-white' : 'bg-emerald-600 text-white') : 'bg-mynted-bg text-mynted-gray',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className={cx('text-xs font-semibold', done ? 'text-mynted-ink' : 'text-mynted-gray')}>{t(step.label)}</span>
              {done && date && <span className="text-[11px] text-mynted-gray">{formatPaymentDate(date, language)}</span>}
            </li>
          )
        })}
      </ol>

      {isRefunded && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{t('order.refundedHint')}</p>}

      {(receipt.trackingNumber || receipt.carrier) && (
        <dl className="flex flex-col gap-1.5 rounded-xl bg-mynted-bg px-3.5 py-2.5 text-sm">
          {receipt.carrier && (
            <div className="flex justify-between gap-3">
              <dt className="text-mynted-gray">{t('order.carrier')}</dt>
              <dd className="text-mynted-ink">{receipt.carrier}</dd>
            </div>
          )}
          {receipt.trackingNumber && (
            <div className="flex justify-between gap-3">
              <dt className="text-mynted-gray">{t('order.trackingNumber')}</dt>
              <dd className="font-mono text-mynted-ink">{receipt.trackingNumber}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Dirección
// -----------------------------------------------------------------------------

/** La dirección tal como quedó guardada en la compra (no cambia si después cambia el perfil). */
export function ShippingAddressCard({ address }: { address: ShippingAddressPayload }) {
  const { t, language } = useLanguage()
  const place = [address.city, address.province].filter(Boolean).join(', ')

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-mynted-border p-3.5 text-sm">
      <h2 className="flex items-center gap-1.5 font-heading text-sm font-semibold text-mynted-ink">
        <MapPin className="size-4 text-mynted-gray" aria-hidden="true" />
        {t('order.addressTitle')}
      </h2>
      <address className="flex flex-col gap-0.5 not-italic text-mynted-ink">
        <span className="font-medium">{address.fullName}</span>
        <span>{address.line1}</span>
        {address.line2 && <span>{address.line2}</span>}
        <span>
          {place}
          {address.postalCode ? ` ${address.postalCode}` : ''}
        </span>
        <span>
          {regionFlag(address.country)} {regionName(address.country, language)}
        </span>
        <span className="text-mynted-gray">{address.phone}</span>
      </address>
      {address.notes && (
        <p className="rounded-lg bg-mynted-bg px-3 py-2 text-xs text-mynted-gray">
          {t('order.addressNotes')}: {address.notes}
        </p>
      )}
    </section>
  )
}

// -----------------------------------------------------------------------------
// Acciones
// -----------------------------------------------------------------------------

type ActionKind = 'ship' | 'cancel' | 'deliver' | 'dispute'

/**
 * Lo que puede hacer quien mira en este paso. El backend vuelve a validar
 * todo (responde 409 si el estado ya cambió), así que acá solo se decide qué
 * botones ofrecer.
 */
export function OrderActions({ receipt, isSellerView }: { receipt: PaymentReceipt; isSellerView: boolean }) {
  const { t } = useLanguage()
  const { contact, isOpening } = useContactSeller()
  const [open, setOpen] = useState<ActionKind | null>(null)
  // Hasta que vuelve el recibo con el reclamo nuevo, se recuerda el que se acaba de abrir.
  const [disputeSent, setDisputeSent] = useState(false)
  const dispute = receipt.dispute ?? null

  const isActive = receipt.status === 'completed'
  const status = receipt.shippingStatus
  const canShip = isSellerView && isActive && status === 'paid' && receipt.shippingAddress !== null
  const canCancel = isSellerView && isActive && status === 'paid'
  const canConfirm = !isSellerView && isActive && status === 'shipped'
  const canDispute = !isSellerView && isActive && status === 'delivered' && !dispute && !disputeSent

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {canShip && (
          <Button type="button" onClick={() => setOpen('ship')}>
            <Truck className="size-4" aria-hidden="true" />
            {t('order.action.ship')}
          </Button>
        )}
        {canConfirm && (
          <Button type="button" onClick={() => setOpen('deliver')}>
            <PackageCheck className="size-4" aria-hidden="true" />
            {t('order.action.deliver')}
          </Button>
        )}
        {/* Escribirle al vendedor abre el chat del producto, el mismo de "Contactar". */}
        {!isSellerView && (
          <Button type="button" variant="secondary" onClick={() => contact(receipt.product.id)} isLoading={isOpening}>
            <MessageCircle className="size-4" aria-hidden="true" />
            {t('order.action.contactSeller')}
          </Button>
        )}
        {canCancel && (
          <Button type="button" variant="destructive-secondary" onClick={() => setOpen('cancel')}>
            {t('order.action.cancel')}
          </Button>
        )}
        {canDispute && (
          <Button type="button" variant="destructive-secondary" onClick={() => setOpen('dispute')}>
            {t('order.action.dispute')}
          </Button>
        )}
      </div>

      {dispute && <DisputeCard dispute={dispute} />}
      {disputeSent && !dispute && <p className="rounded-xl bg-mynted-bg px-3.5 py-2.5 text-center text-sm text-mynted-gray">{t('order.disputeSent')}</p>}

      <ShipDialog open={open === 'ship'} transactionId={receipt.id} onClose={() => setOpen(null)} />
      <CancelDialog open={open === 'cancel'} transactionId={receipt.id} onClose={() => setOpen(null)} />
      <DeliverDialog open={open === 'deliver'} transactionId={receipt.id} onClose={() => setOpen(null)} />
      <DisputeDialog
        open={open === 'dispute'}
        transactionId={receipt.id}
        onClose={() => setOpen(null)}
        onSent={() => setDisputeSent(true)}
      />
    </div>
  )
}

const DISPUTE_STATUS: Record<ReceiptDispute['status'], { label: TranslationKey; tone: PillTone }> = {
  open: { label: 'order.disputeInfo.open', tone: 'orange' },
  resolved_refund: { label: 'order.disputeInfo.refunded', tone: 'violet' },
  resolved_closed: { label: 'order.disputeInfo.closed', tone: 'gray' },
}

/** El reclamo de la compra: lo que se contó y, cuando se resuelve, qué se decidió y por qué. */
function DisputeCard({ dispute }: { dispute: ReceiptDispute }) {
  const { t, language } = useLanguage()
  const status = DISPUTE_STATUS[dispute.status]
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-mynted-border p-4 text-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-mynted-ink">
          <Scale className="size-4 text-mynted-gray" aria-hidden="true" />
          {t('order.disputeInfo.title')}
        </h2>
        <StatusPill tone={status.tone}>{t(status.label)}</StatusPill>
      </header>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-mynted-gray">
          {t('order.disputeInfo.opened', { date: formatPaymentDate(dispute.createdAt, language) })}
        </p>
        <p className="rounded-lg bg-mynted-bg px-3 py-2 text-mynted-ink">{dispute.reason}</p>
      </div>
      {dispute.status === 'open' ? (
        <p className="text-mynted-gray">{t('order.disputeInfo.pending')}</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-mynted-gray">
            {t('order.disputeInfo.resolved', { date: formatPaymentDate(dispute.resolvedAt, language) })}
          </p>
          {dispute.resolutionNote && (
            <p className="rounded-lg bg-mynted-bg px-3 py-2 text-mynted-ink">{dispute.resolutionNote}</p>
          )}
        </div>
      )}
    </section>
  )
}

const TRACKING_MAX = 120
const CARRIER_MAX = 100
const REASON_MAX = 1000

/** El error de una acción, en palabras: el backend explica en español y a veces con las tildes rotas. */
function actionErrorKey(error: unknown, conflictKey: TranslationKey = 'order.error.conflict'): TranslationKey {
  switch (getHttpStatus(error)) {
    case 409:
      return conflictKey
    case 403:
      return 'order.error.forbidden'
    default:
      return 'order.error.generic'
  }
}

function ShipDialog({ open, transactionId, onClose }: { open: boolean; transactionId: string; onClose: () => void }) {
  const { t } = useLanguage()
  const ship = useShipOrderMutation()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    if (open) {
      setTrackingNumber('')
      setCarrier('')
      setAttempted(false)
      ship.reset()
    }
  }
  // El backend lo deja vacío, pero sin guía quien compró no puede seguir el paquete.
  const missingTracking = trackingNumber.trim() === ''

  return (
    <ActionDialog
      open={open}
      title={t('order.ship.title')}
      description={t('order.ship.description')}
      confirmLabel={t('order.action.ship')}
      isPending={ship.isPending}
      errorKey={ship.isError ? actionErrorKey(ship.error) : null}
      onClose={onClose}
      onConfirm={() => {
        setAttempted(true)
        if (missingTracking) return
        ship.mutate(
          { transactionId, trackingNumber: trackingNumber.trim(), carrier: carrier.trim() || null },
          { onSuccess: onClose },
        )
      }}
    >
      <Field label={t('order.ship.carrier')}>
        {(id) => (
          <input
            id={id}
            value={carrier}
            maxLength={CARRIER_MAX}
            onChange={(event) => setCarrier(event.target.value)}
            placeholder={t('order.ship.carrierPlaceholder')}
            className={inputClass}
          />
        )}
      </Field>
      <Field
        label={t('order.ship.trackingNumber')}
        error={attempted && missingTracking ? t('order.ship.trackingRequired') : undefined}
      >
        {(id) => (
          <input
            id={id}
            value={trackingNumber}
            maxLength={TRACKING_MAX}
            onChange={(event) => setTrackingNumber(event.target.value)}
            aria-invalid={attempted && missingTracking}
            className={cx(inputClass, attempted && missingTracking && 'border-red-400')}
          />
        )}
      </Field>
    </ActionDialog>
  )
}

function CancelDialog({ open, transactionId, onClose }: { open: boolean; transactionId: string; onClose: () => void }) {
  const { t } = useLanguage()
  const cancel = useCancelOrderMutation()
  const [reason, setReason] = useState('')
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    if (open) {
      setReason('')
      cancel.reset()
    }
  }

  return (
    <ActionDialog
      open={open}
      title={t('order.cancel.title')}
      description={t('order.cancel.description')}
      confirmLabel={t('order.action.cancel')}
      tone="danger"
      isPending={cancel.isPending}
      errorKey={cancel.isError ? actionErrorKey(cancel.error) : null}
      onClose={onClose}
      onConfirm={() => cancel.mutate({ transactionId, reason: reason.trim() || null }, { onSuccess: onClose })}
    >
      <Field label={t('order.cancel.reason')}>
        {(id) => (
          <textarea
            id={id}
            rows={3}
            value={reason}
            maxLength={REASON_MAX}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('order.cancel.reasonPlaceholder')}
            className={cx(inputClass, 'resize-y')}
          />
        )}
      </Field>
    </ActionDialog>
  )
}

function DeliverDialog({ open, transactionId, onClose }: { open: boolean; transactionId: string; onClose: () => void }) {
  const { t } = useLanguage()
  const deliver = useConfirmDeliveryMutation()
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    if (open) deliver.reset()
  }

  return (
    <ActionDialog
      open={open}
      title={t('order.deliver.title')}
      description={t('order.deliver.description')}
      confirmLabel={t('order.action.deliver')}
      isPending={deliver.isPending}
      errorKey={deliver.isError ? actionErrorKey(deliver.error) : null}
      onClose={onClose}
      onConfirm={() => deliver.mutate(transactionId, { onSuccess: onClose })}
    />
  )
}

function DisputeDialog({
  open,
  transactionId,
  onClose,
  onSent,
}: {
  open: boolean
  transactionId: string
  onClose: () => void
  onSent: () => void
}) {
  const { t } = useLanguage()
  const dispute = useOpenDisputeMutation()
  const [reason, setReason] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [openedFor, setOpenedFor] = useState(open)
  if (open !== openedFor) {
    setOpenedFor(open)
    if (open) {
      setReason('')
      setAttempted(false)
      dispute.reset()
    }
  }
  const isEmpty = reason.trim() === ''
  // Un 409 acá es que ya hay un reclamo (uno por compra): se da por enviado.
  const alreadyOpen = dispute.isError && getHttpStatus(dispute.error) === 409

  return (
    <ActionDialog
      open={open}
      title={t('order.dispute.title')}
      description={t('order.dispute.description')}
      confirmLabel={t('order.dispute.submit')}
      tone="danger"
      isPending={dispute.isPending}
      errorKey={dispute.isError ? actionErrorKey(dispute.error, 'order.dispute.alreadyOpen') : null}
      onClose={() => {
        if (alreadyOpen) onSent()
        onClose()
      }}
      onConfirm={() => {
        setAttempted(true)
        if (isEmpty) return
        dispute.mutate(
          { transactionId, reason: reason.trim() },
          {
            onSuccess: () => {
              onSent()
              onClose()
            },
          },
        )
      }}
    >
      <Field label={t('order.dispute.reason')} error={attempted && isEmpty ? t('order.dispute.reasonRequired') : undefined}>
        {(id) => (
          <textarea
            id={id}
            rows={4}
            value={reason}
            maxLength={REASON_MAX}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('order.dispute.reasonPlaceholder')}
            aria-invalid={attempted && isEmpty}
            className={cx(inputClass, 'resize-y', attempted && isEmpty && 'border-red-400')}
          />
        )}
      </Field>
    </ActionDialog>
  )
}

const inputClass =
  'w-full rounded-[10px] border border-mynted-border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none transition-shadow placeholder:text-mynted-gray-light focus:border-mynted-orange focus:ring-2 focus:ring-mynted-orange/20'

function Field({ label, error, children }: { label: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-mynted-ink">
        {label}
      </label>
      {children(id)}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  isPending,
  errorKey,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  tone?: 'primary' | 'danger'
  isPending: boolean
  errorKey: TranslationKey | null
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isPending && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!isPending) onConfirm()
          }}
          className="mt-4 flex flex-col gap-4"
        >
          {children}
          <DialogFooter>
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isPending}>
              {t('profile.edit.cancel')}
            </Button>
            <Button type="submit" variant={tone === 'danger' ? 'destructive' : 'primary'} size="md" isLoading={isPending}>
              {confirmLabel}
            </Button>
          </DialogFooter>
          {errorKey && (
            <p className="text-sm text-red-500" role="alert">
              {t(errorKey)}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
