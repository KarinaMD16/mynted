import { useMemo, useState } from 'react'
import { Coins, Layers, Pencil, Percent, Plus, Receipt, Trash2 } from 'lucide-react'
import { AnimatedTabs } from '@/components/ui/AnimatedTabs'
import { Button } from '@/components/ui/Button'
import { CommissionTierDialog } from '@/features/payments/components/CommissionTierDialog'
import { PeriodFilter } from '@/features/payments/components/PeriodFilter'
import {
  useCreateCommissionTierMutation,
  useDeactivateCommissionTierMutation,
  useUpdateCommissionTierMutation,
} from '@/features/payments/hooks/usePaymentMutations'
import { useAdminCommissionTiers, useAdminPaymentSummary } from '@/features/payments/hooks/usePaymentQueries'
import type {
  AdminCommissionTier,
  AdminCommissionTierPayload,
  CommissionTierType,
  PaymentPeriodFilters,
} from '@/features/payments/models/payment'
import { buildPreviewMatrix, findRangeProblem } from '@/features/payments/utils/commissionMatrix'
import { formatRate } from '@/features/payments/utils/paymentFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import { SUPPORTED_CURRENCIES } from '@/utils/locale'
import { formatPrice } from '@/utils/price'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import { ConfirmDialog, FilterSelect, IconAction, LoadErrorPanel, Panel, StatCard, StatusPill } from '../components/AdminUi'
import type { AdminTab } from '../models/admin'
import { OverviewSkeleton } from './UsersSection'

/** Moneda con la que arrancan los rangos por precio (el mercado de lanzamiento). */
const DEFAULT_CURRENCY = 'CRC'

export function CommissionsSection({ tab }: { tab: AdminTab }) {
  return tab === 'overview' ? <CommissionsOverview /> : <CommissionsManage />
}

// -----------------------------------------------------------------------------
// Resumen: comisiones cobradas
// -----------------------------------------------------------------------------

/**
 * Lo que Mynted lleva cobrado en comisiones, por periodo, por nivel de
 * vendedor y por rango de precio (GET /admin/payments/summary).
 */
function CommissionsOverview() {
  const { t, language } = useLanguage()
  const [period, setPeriod] = useState<PaymentPeriodFilters>({})
  // Un rango al revés lo rechaza el backend; no se consulta hasta corregirlo.
  const isValidPeriod = !(period.from && period.to && period.from > period.to)
  const summary = useAdminPaymentSummary(period, isValidPeriod)

  if (summary.isError) return <LoadErrorPanel error={summary.error} onRetry={() => void summary.refetch()} />

  const totals = summary.data?.totalsByCurrency ?? []
  const transactions = totals.reduce((sum, row) => sum + row.transactionCount, 0)
  const money = (value: number, currency: string) => formatPrice(value, currency, language)

  return (
    <>
      <PeriodFilter value={period} onChange={setPeriod} />

      {summary.isLoading ? (
        <OverviewSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Receipt} label={t('admin.commissions.stats.transactions')} value={transactions} tone="violet" />
            {totals.map((row) => (
              <StatCard
                key={row.currency}
                icon={Coins}
                label={t('admin.commissions.stats.collected', { currency: row.currency })}
                value={money(row.commissions, row.currency)}
                tone="teal"
              />
            ))}
          </div>

          <Panel title={t('admin.commissions.bySalesTier')}>
            <GroupTable
              rows={(summary.data?.bySalesTier ?? []).map((row) => ({ ...row, label: row.salesTierName }))}
              labelHeader={t('commission.column.tier')}
            />
          </Panel>

          <Panel title={t('admin.commissions.byPriceTier')}>
            <GroupTable
              rows={(summary.data?.byPriceTier ?? []).map((row) => ({ ...row, label: row.priceTierName }))}
              labelHeader={t('sales.column.priceTier')}
            />
          </Panel>
        </>
      )}
    </>
  )
}

interface GroupRow {
  label: string
  currency: string
  transactionCount: number
  gross: number
  commissions: number
  sellerNet: number
}

/** Bruto, comisión y neto de un grupo (nivel o rango), una fila por moneda. */
function GroupTable({ rows, labelHeader }: { rows: GroupRow[]; labelHeader: string }) {
  const { t, language } = useLanguage()
  if (rows.length === 0) return <p className="text-sm text-mynted-gray">{t('admin.table.empty')}</p>

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-mynted-border text-xs font-semibold text-mynted-gray">
            <th scope="col" className="px-3 py-2 text-left">{labelHeader}</th>
            <th scope="col" className="px-3 py-2 text-left">{t('admin.commissions.column.currency')}</th>
            <th scope="col" className="px-3 py-2 text-right">{t('admin.commissions.column.transactions')}</th>
            <th scope="col" className="px-3 py-2 text-right">{t('sales.column.gross')}</th>
            <th scope="col" className="px-3 py-2 text-right">{t('sales.column.commission')}</th>
            <th scope="col" className="px-3 py-2 text-right">{t('admin.commissions.column.sellerNet')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.label}-${row.currency}`} className="border-b border-mynted-border last:border-0">
              <td className="px-3 py-2 font-medium text-mynted-ink">{row.label}</td>
              <td className="px-3 py-2 text-mynted-gray">{row.currency}</td>
              <td className="px-3 py-2 text-right tabular-nums text-mynted-gray">{row.transactionCount}</td>
              <td className="px-3 py-2 text-right tabular-nums text-mynted-gray">{formatPrice(row.gross, row.currency, language)}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-mynted-ink">
                {formatPrice(row.commissions, row.currency, language)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-mynted-gray">
                {formatPrice(row.sellerNet, row.currency, language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Gestionar: rangos de comisión
// -----------------------------------------------------------------------------

/**
 * Alta, edición y baja de rangos, en dos pestañas: por cantidad de ventas (el
 * nivel del vendedor) y por precio del artículo, que sí van por moneda.
 *
 * Debajo va la matriz que resultaría de los rangos activos, para ver el efecto
 * de un cambio sin tener que hacer una venta de prueba.
 */
function CommissionsManage() {
  const { t } = useLanguage()
  const [type, setType] = useState<CommissionTierType>('sales')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  // Las dos listas se piden siempre: la matriz necesita las dos.
  const salesTiers = useAdminCommissionTiers({ type: 'sales' })
  const priceTiers = useAdminCommissionTiers({ type: 'price', currency })

  const [editing, setEditing] = useState<AdminCommissionTier | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deactivating, setDeactivating] = useState<AdminCommissionTier | null>(null)

  const create = useCreateCommissionTierMutation()
  const update = useUpdateCommissionTierMutation()
  const deactivate = useDeactivateCommissionTierMutation()

  const current = type === 'sales' ? salesTiers : priceTiers
  const columns = useTierColumns(type)
  const isDialogOpen = isCreating || editing !== null

  function closeDialog() {
    setIsCreating(false)
    setEditing(null)
    create.reset()
    update.reset()
  }

  function handleSubmit(payload: AdminCommissionTierPayload) {
    if (editing) update.mutate({ tierId: editing.id, payload }, { onSuccess: closeDialog })
    else create.mutate(payload, { onSuccess: closeDialog })
  }

  return (
    <>
      <AnimatedTabs
        items={[
          { id: 'sales', label: t('admin.commissions.tab.sales') },
          { id: 'price', label: t('admin.commissions.tab.price') },
        ]}
        value={type}
        onChange={setType}
        ariaLabel={t('admin.commissions.tab.label')}
      />

      <AdminDataTable
        rows={current.data}
        columns={columns}
        getRowId={(row) => row.id}
        getSearchText={(row) => `${row.name} ${row.currency ?? ''}`}
        isLoading={current.isLoading}
        error={current.error}
        onRetry={() => void current.refetch()}
        initialSort={{ id: 'min', direction: 'asc' }}
        toolbar={
          type === 'price' ? (
            <FilterSelect
              label={t('admin.commissions.column.currency')}
              value={currency}
              onChange={setCurrency}
              options={SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: code }))}
            />
          ) : undefined
        }
        primaryAction={
          <Button type="button" onClick={() => setIsCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            {t('admin.commissions.add')}
          </Button>
        }
        renderActions={(row) => (
          <>
            <IconAction icon={Pencil} label={t('admin.commissions.edit')} onPress={() => setEditing(row)} />
            <IconAction
              icon={Trash2}
              label={t('admin.commissions.deactivate')}
              onPress={() => setDeactivating(row)}
              disabled={!row.isActive}
              disabledReason={t('admin.commissions.alreadyInactive')}
            />
          </>
        )}
      />

      <MatrixPreview salesTiers={salesTiers.data ?? []} priceTiers={priceTiers.data ?? []} currency={currency} />

      <CommissionTierDialog
        open={isDialogOpen}
        tier={editing}
        type={type}
        currency={currency}
        isPending={create.isPending || update.isPending}
        error={editing ? update.error : create.error}
        onSubmit={handleSubmit}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={deactivating !== null}
        title={t('admin.commissions.confirm.title')}
        description={t('admin.commissions.confirm.body', { name: deactivating?.name ?? '' })}
        confirmLabel={t('admin.commissions.deactivate')}
        isPending={deactivate.isPending}
        error={deactivate.error}
        onConfirm={() => {
          if (deactivating) deactivate.mutate(deactivating.id, { onSuccess: () => setDeactivating(null) })
        }}
        onClose={() => setDeactivating(null)}
      />
    </>
  )
}

/** Columnas de la tabla de rangos. Cambian poco entre los dos tipos: solo cómo se lee el rango. */
function useTierColumns(type: CommissionTierType): AdminColumn<AdminCommissionTier>[] {
  const { t, language } = useLanguage()

  return [
    {
      id: 'name',
      header: t('admin.commissions.column.name'),
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-mynted-ink">{row.name}</span>,
    },
    {
      id: 'min',
      header: t('admin.commissions.column.range'),
      sortValue: (row) => row.minValue,
      render: (row) => {
        const format = (value: number) =>
          type === 'price' && row.currency ? formatPrice(value, row.currency, language) : String(value)
        return (
          <span className="tabular-nums text-mynted-gray">
            {row.maxValue === null
              ? t('commission.range.fromOnly', { min: format(row.minValue) })
              : t('commission.range.fromTo', { min: format(row.minValue), max: format(row.maxValue) })}
          </span>
        )
      },
    },
    {
      id: 'discount',
      header: t('admin.commissions.column.discount'),
      sortValue: (row) => row.discount,
      render: (row) => <span className="tabular-nums">−{formatRate(row.discount, language)}</span>,
    },
    {
      id: 'status',
      header: t('admin.commissions.column.status'),
      sortValue: (row) => (row.isActive ? 1 : 0),
      render: (row) => (
        <StatusPill tone={row.isActive ? 'teal' : 'gray'}>
          {t(row.isActive ? 'admin.commissions.active' : 'admin.commissions.inactive')}
        </StatusPill>
      ),
    },
  ]
}

/**
 * La matriz que resulta de los rangos activos. Es una cuenta del navegador
 * (ver commissionMatrix.ts), así que sirve para ver un cambio antes de
 * guardarlo; lo que se cobra lo calcula el backend.
 */
function MatrixPreview({
  salesTiers,
  priceTiers,
  currency,
}: {
  salesTiers: AdminCommissionTier[]
  priceTiers: AdminCommissionTier[]
  currency: string
}) {
  const { t, language } = useLanguage()
  const matrix = useMemo(() => buildPreviewMatrix(salesTiers, priceTiers), [salesTiers, priceTiers])
  const salesProblem = useMemo(() => findRangeProblem(salesTiers), [salesTiers])
  const priceProblem = useMemo(() => findRangeProblem(priceTiers), [priceTiers])

  return (
    <Panel title={t('admin.commissions.preview.title')}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-mynted-gray">{t('admin.commissions.preview.hint', { currency })}</p>

        {[salesProblem, priceProblem].map(
          (problem, index) =>
            problem && (
              <p key={index} role="alert" className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                {t(problem.kind === 'gap' ? 'admin.commissions.preview.gap' : 'admin.commissions.preview.overlap', {
                  name: problem.tier.name,
                })}
              </p>
            ),
        )}

        {matrix.length === 0 || matrix[0]!.cells.length === 0 ? (
          <p className="text-sm text-mynted-gray">{t('admin.commissions.preview.empty')}</p>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="text-xs font-semibold text-mynted-gray">
                  <th scope="col" className="px-2.5 py-2 text-left">{t('commission.column.tier')}</th>
                  {matrix[0]!.cells.map((cell) => (
                    <th key={cell.priceTier.id} scope="col" className="px-2.5 py-2 text-right text-mynted-ink">
                      {cell.priceTier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.salesTier.id} className="border-t border-mynted-border">
                    <th scope="row" className="px-2.5 py-2 text-left font-medium text-mynted-ink">
                      {row.salesTier.name}
                    </th>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.priceTier.id}
                        className="px-2.5 py-2 text-right tabular-nums text-mynted-gray"
                      >
                        {formatRate(cell.rate, language)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="flex items-start gap-2 text-xs text-mynted-gray">
          <Percent className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t('admin.commissions.preview.formula')}
        </p>
        <p className="flex items-start gap-2 text-xs text-mynted-gray">
          <Layers className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t('admin.commissions.preview.disclaimer')}
        </p>
      </div>
    </Panel>
  )
}
