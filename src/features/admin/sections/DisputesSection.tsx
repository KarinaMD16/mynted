import { useId, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CircleCheck, Eye, Scale, Undo2, XCircle } from 'lucide-react'
import { getHttpStatus } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { OrderStatusPill } from '@/features/payments/components/OrderTracking'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { cx } from '@/utils/cx'
import { formatShortDate } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import { FilterSelect, IconAction, LoadErrorPanel, Panel, StatCard, StatusPill, type PillTone } from '../components/AdminUi'
import { useAdminDisputes, useDisputeCount, useResolveDisputeMutation } from '../hooks/useAdminDisputes'
import type { AdminTab } from '../models/admin'
import { DISPUTE_STATUSES, type DisputeAction, type DisputeParty, type DisputeStatus, type PaymentDispute } from '../models/disputes'
import { ManageLink, OverviewSkeleton } from './UsersSection'

const STATUS_LABEL: Record<DisputeStatus, TranslationKey> = {
  open: 'admin.disputes.status.open',
  resolved_refund: 'admin.disputes.status.resolved_refund',
  resolved_closed: 'admin.disputes.status.resolved_closed',
}

const STATUS_TONE: Record<DisputeStatus, PillTone> = {
  open: 'amber',
  resolved_refund: 'violet',
  resolved_closed: 'gray',
}

/** Lo que acepta el backend en `resolution` (ver ResolvePaymentDisputeDto). */
const NOTE_MAX_LENGTH = 1000
/**
 * Tope del backend por página. El panel trae los reclamos de una vez (como el
 * resto de las tablas de Gestionar): alcanza mientras no haya más de 100 de un
 * mismo estado.
 */
const MANAGE_LIMIT = 100
const RECENT_OPEN = 5

function partyName(party: DisputeParty) {
  return party.displayName || party.username || party.id.slice(0, 8)
}

export function DisputesSection({ tab }: { tab: AdminTab }) {
  return tab === 'overview' ? <DisputesOverview /> : <DisputesManage />
}

function DisputesOverview() {
  const { t } = useLanguage()
  const open = useDisputeCount('open')
  const refunded = useDisputeCount('resolved_refund')
  const closed = useDisputeCount('resolved_closed')
  const recent = useAdminDisputes({ page: 1, limit: RECENT_OPEN, status: 'open' })
  const [selected, setSelected] = useState<PaymentDispute | null>(null)

  const error = open.error ?? refunded.error ?? closed.error ?? recent.error
  if (error) {
    return (
      <LoadErrorPanel
        error={error}
        onRetry={() => {
          void open.refetch()
          void refunded.refetch()
          void closed.refetch()
          void recent.refetch()
        }}
      />
    )
  }
  if (open.isPending || refunded.isPending || closed.isPending || recent.isPending) return <OverviewSkeleton />

  const total = (open.data ?? 0) + (refunded.data ?? 0) + (closed.data ?? 0)
  const openList = recent.data?.data ?? []

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Scale} label={t('admin.disputes.stats.open')} value={open.data} tone="orange" />
        <StatCard icon={Undo2} label={t('admin.disputes.stats.refunded')} value={refunded.data} tone="violet" />
        <StatCard icon={XCircle} label={t('admin.disputes.stats.closed')} value={closed.data} tone="gray" />
        <StatCard icon={CircleCheck} label={t('admin.disputes.stats.total')} value={total} tone="teal" />
      </div>

      <Panel title={t('admin.disputes.openTitle')} action={<ManageLink section="disputes" />}>
        {openList.length === 0 ? (
          <p className="py-6 text-center text-sm text-mynted-gray">{t('admin.disputes.openEmpty')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-mynted-border">
            {openList.map((dispute) => (
              <li key={dispute.id}>
                <button
                  type="button"
                  onClick={() => setSelected(dispute)}
                  className="flex w-full items-start justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-mynted-bg"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-mynted-ink">{dispute.product.title}</span>
                    <span className="line-clamp-1 text-sm text-mynted-gray">{dispute.reason}</span>
                  </span>
                  <span className="shrink-0 text-xs text-mynted-gray">{partyName(dispute.buyer)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <DisputeDialog dispute={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function DisputesManage() {
  const { t, language } = useLanguage()
  // Por defecto los abiertos: es lo que hay que atender.
  const [status, setStatus] = useState<DisputeStatus | ''>('open')
  const query = useAdminDisputes({ page: 1, limit: MANAGE_LIMIT, status: status || undefined })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Del listado vigente, para que tras resolver el diálogo muestre el estado nuevo.
  const selected = query.data?.data.find((dispute) => dispute.id === selectedId) ?? null

  const columns = useMemo<AdminColumn<PaymentDispute>[]>(
    () => [
      {
        id: 'product',
        header: t('admin.disputes.columns.product'),
        sortValue: (row) => row.product.title,
        render: (row) => (
          <span className="block max-w-[220px] truncate font-medium text-mynted-ink" title={row.product.title}>
            {row.product.title}
          </span>
        ),
      },
      {
        id: 'buyer',
        header: t('admin.disputes.columns.buyer'),
        sortValue: (row) => partyName(row.buyer),
        render: (row) => partyName(row.buyer),
      },
      {
        id: 'seller',
        header: t('admin.disputes.columns.seller'),
        sortValue: (row) => partyName(row.seller),
        render: (row) => partyName(row.seller),
      },
      {
        id: 'reason',
        header: t('admin.disputes.columns.reason'),
        render: (row) => (
          <span className="line-clamp-2 max-w-[260px] text-mynted-gray" title={row.reason}>
            {row.reason}
          </span>
        ),
      },
      {
        id: 'order',
        header: t('admin.disputes.columns.order'),
        render: (row) => <OrderStatusPill paymentStatus={row.paymentStatus} shippingStatus={row.shippingStatus} />,
      },
      {
        id: 'opened',
        header: t('admin.disputes.columns.opened'),
        sortValue: (row) => row.createdAt,
        render: (row) => <span className="whitespace-nowrap">{formatShortDate(row.createdAt, language)}</span>,
      },
      {
        id: 'status',
        header: t('admin.disputes.columns.status'),
        sortValue: (row) => DISPUTE_STATUSES.indexOf(row.status),
        render: (row) => <StatusPill tone={STATUS_TONE[row.status]}>{t(STATUS_LABEL[row.status])}</StatusPill>,
      },
    ],
    [t, language],
  )

  return (
    <>
      <AdminDataTable
        rows={query.data?.data}
        columns={columns}
        getRowId={(row) => row.id}
        getSearchText={(row) => `${row.product.title} ${partyName(row.buyer)} ${partyName(row.seller)} ${row.reason}`}
        searchPlaceholder={t('admin.disputes.searchPlaceholder')}
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        initialSort={{ id: 'opened', direction: 'desc' }}
        toolbar={
          <FilterSelect<DisputeStatus | ''>
            label={t('admin.disputes.columns.status')}
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: t('admin.disputes.filterAll') },
              ...DISPUTE_STATUSES.map((value) => ({ value, label: t(STATUS_LABEL[value]) })),
            ]}
          />
        }
        renderActions={(row) => (
          <IconAction icon={Eye} label={t('admin.disputes.view')} onPress={() => setSelectedId(row.id)} />
        )}
      />

      <DisputeDialog dispute={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}

/** El 409 es "ya se resolvió" o "ya estaba reembolsada"; el resto, un fallo genérico. */
function resolveErrorKey(error: unknown): TranslationKey {
  if (getHttpStatus(error) === 409) return 'admin.disputes.error.alreadyResolved'
  if (getHttpStatus(error) === 404) return 'admin.disputes.error.notFound'
  return 'admin.disputes.error.generic'
}

/** Detalle del reclamo y, si sigue abierto, la decisión: reembolsar o cerrar, con una explicación obligatoria. */
function DisputeDialog({ dispute, onClose }: { dispute: PaymentDispute | null; onClose: () => void }) {
  const { t, language } = useLanguage()
  const noteId = useId()
  const resolve = useResolveDisputeMutation()
  const [action, setAction] = useState<DisputeAction>('refund')
  const [note, setNote] = useState('')
  const [attempted, setAttempted] = useState(false)

  // Al abrir otro reclamo el formulario arranca limpio (se ajusta en el render, no en un efecto).
  const [openedFor, setOpenedFor] = useState(dispute?.id)
  if (dispute?.id !== openedFor) {
    setOpenedFor(dispute?.id)
    if (dispute) {
      setAction('refund')
      setNote('')
      setAttempted(false)
      resolve.reset()
    }
  }

  const trimmed = note.trim()
  const isOpen = dispute?.status === 'open'

  function handleResolve() {
    setAttempted(true)
    if (!dispute || trimmed === '' || resolve.isPending) return
    // Resuelto, se cierra: el resumen guarda una copia del reclamo que seguiría diciendo "abierto".
    resolve.mutate({ id: dispute.id, action, resolution: trimmed }, { onSuccess: onClose })
  }

  return (
    <Dialog open={dispute !== null} onOpenChange={(open) => !open && !resolve.isPending && onClose()}>
      <DialogContent className="max-w-lg">
        {dispute && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{t('admin.disputes.detail.title', { product: dispute.product.title })}</DialogTitle>
              <DialogDescription>
                {t('admin.disputes.detail.parties', { buyer: partyName(dispute.buyer), seller: partyName(dispute.seller) })}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={STATUS_TONE[dispute.status]}>{t(STATUS_LABEL[dispute.status])}</StatusPill>
                <OrderStatusPill paymentStatus={dispute.paymentStatus} shippingStatus={dispute.shippingStatus} />
                <span className="text-xs text-mynted-gray">
                  {t('admin.disputes.detail.openedAt', { date: formatShortDate(dispute.createdAt, language) })}
                </span>
              </div>

              <section className="flex flex-col gap-1">
                <h3 className="text-[13px] font-semibold text-mynted-ink">{t('admin.disputes.detail.reason')}</h3>
                <p className="rounded-xl bg-mynted-bg px-3.5 py-2.5 whitespace-pre-line text-mynted-ink">{dispute.reason}</p>
              </section>

              <p className="text-xs text-mynted-gray">
                {t('admin.disputes.detail.transaction')}: <span className="font-mono">{dispute.transactionId}</span> ·{' '}
                <Link
                  to="/products/$productId"
                  params={{ productId: String(dispute.product.id) }}
                  className="font-medium text-mynted-blue hover:underline"
                >
                  {t('admin.disputes.detail.viewProduct')}
                </Link>
              </p>

              {!isOpen && (
                <section className="flex flex-col gap-1">
                  <h3 className="text-[13px] font-semibold text-mynted-ink">{t('admin.disputes.detail.resolution')}</h3>
                  <p className="rounded-xl bg-mynted-bg px-3.5 py-2.5 whitespace-pre-line text-mynted-ink">
                    {dispute.resolutionNote || '—'}
                  </p>
                  {dispute.resolvedAt && (
                    <span className="text-xs text-mynted-gray">
                      {t('admin.disputes.detail.resolvedAt', { date: formatShortDate(dispute.resolvedAt, language) })}
                    </span>
                  )}
                </section>
              )}

              {isOpen && (
                <section className="flex flex-col gap-3 border-t border-mynted-border pt-4">
                  <h3 className="text-[13px] font-semibold text-mynted-ink">{t('admin.disputes.resolve.title')}</h3>
                  <div role="radiogroup" aria-label={t('admin.disputes.resolve.title')} className="grid gap-2 sm:grid-cols-2">
                    <ActionChoice
                      selected={action === 'refund'}
                      onSelect={() => setAction('refund')}
                      title={t('admin.disputes.resolve.refund')}
                      hint={t('admin.disputes.resolve.refundHint')}
                    />
                    <ActionChoice
                      selected={action === 'close'}
                      onSelect={() => setAction('close')}
                      title={t('admin.disputes.resolve.close')}
                      hint={t('admin.disputes.resolve.closeHint')}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={noteId} className="text-[13px] font-medium text-mynted-ink">
                      {t('admin.disputes.resolve.noteLabel')}
                    </label>
                    <textarea
                      id={noteId}
                      rows={3}
                      value={note}
                      maxLength={NOTE_MAX_LENGTH}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={t('admin.disputes.resolve.notePlaceholder')}
                      aria-invalid={attempted && trimmed === ''}
                      className={cx(
                        'w-full resize-y rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none transition-shadow placeholder:text-mynted-gray-light focus:ring-2 focus:ring-mynted-orange/20',
                        attempted && trimmed === '' ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange',
                      )}
                    />
                    {attempted && trimmed === '' ? (
                      <span className="text-xs text-red-500">{t('admin.disputes.resolve.noteRequired')}</span>
                    ) : (
                      <span className="text-xs text-mynted-gray">{t('admin.disputes.resolve.noteHint')}</span>
                    )}
                  </div>
                </section>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" onClick={onClose} disabled={resolve.isPending} variant="secondary" size="md">
                {t(isOpen ? 'profile.edit.cancel' : 'admin.disputes.detail.close')}
              </Button>
              {isOpen && (
                <Button
                  type="button"
                  onClick={handleResolve}
                  variant={action === 'refund' ? 'destructive' : 'primary'}
                  size="md"
                  isLoading={resolve.isPending}
                >
                  {t(action === 'refund' ? 'admin.disputes.resolve.confirmRefund' : 'admin.disputes.resolve.confirmClose')}
                </Button>
              )}
            </DialogFooter>

            {resolve.isError && (
              <p className="mt-3 text-sm text-red-500" role="alert">
                {t(resolveErrorKey(resolve.error))}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ActionChoice({
  selected,
  onSelect,
  title,
  hint,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        'flex flex-col gap-1 rounded-xl border px-3.5 py-3 text-left transition-colors',
        selected ? 'border-mynted-orange bg-orange-50' : 'border-mynted-border bg-white hover:bg-mynted-bg',
      )}
    >
      <span className="text-sm font-semibold text-mynted-ink">{title}</span>
      <span className="text-xs text-mynted-gray">{hint}</span>
    </button>
  )
}
