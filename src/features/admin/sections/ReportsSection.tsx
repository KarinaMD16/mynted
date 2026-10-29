import { useRef, useState } from 'react'
import { CheckCircle2, CircleSlash, ShieldAlert } from 'lucide-react'
import { ErrorState } from '@/components/errors/ErrorState'
import { ReportCard } from '@/features/reports/components/ReportCard'
import { ResolveReportDialog } from '@/features/reports/components/ResolveReportDialog'
import { useDismissReportMutation, useGlobalReports, useResolveReportMutation } from '@/features/reports/hooks/useReports'
import { REPORT_ITEM_LABEL, REPORT_REASON_LABEL } from '@/features/reports/models/report'
import type { Report, ReportItemType, ReportStatus, ResolveReportPayload } from '@/features/reports/models/report'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { formatRelativeTime } from '@/utils/relativeTime'
import { AdminPageFooter } from '../components/AdminPagination'
import { useAdminCommunities } from '../hooks/useAdminQueries'
import {
  DistributionList,
  FilterSelect,
  LoadErrorPanel,
  Panel,
  StatCard,
  StatCardSkeleton,
  StatusPill,
} from '../components/AdminUi'
import type { AdminTab } from '../models/admin'
import { ManageLink } from './UsersSection'

/** Cuántos reportes se piden por página. */
/** Opciones de "Mostrar N entradas". Son tarjetas, no filas: menos que en las tablas. */
const PAGE_SIZES = [10, 20, 50]

/** '' = sin filtrar, que es el valor que usan los selects. */
const STATUS_OPTIONS: { value: ReportStatus | ''; labelKey: TranslationKey }[] = [
  { value: '', labelKey: 'moderation.reports.tab.all' },
  { value: 'pending', labelKey: 'reports.status.pending' },
  { value: 'resolved', labelKey: 'reports.status.resolved' },
  { value: 'dismissed', labelKey: 'reports.status.dismissed' },
]


const TYPE_OPTIONS: { value: ReportItemType | ''; labelKey: TranslationKey }[] = [
  { value: '', labelKey: 'admin.reports.filter.allTypes' },
  { value: 'post', labelKey: 'reports.item.post' },
  { value: 'reply', labelKey: 'reports.item.reply' },
  { value: 'product', labelKey: 'reports.item.product' },
  { value: 'conversation', labelKey: 'reports.item.conversation' },
  { value: 'community', labelKey: 'reports.item.community' },
]

export function ReportsSection({ tab }: { tab: AdminTab }) {
  return tab === 'overview' ? <ReportsOverview /> : <ReportsManage />
}

/** Cuántos reportes pendientes recientes se muestran en el resumen. */
const LATEST_PENDING = 5

/** Los tipos, en el orden de los filtros; cada uno se cuenta por separado. */
const ITEM_TYPES = TYPE_OPTIONS.flatMap(({ value }) => (value ? [value] : []))

/**
 * Cuántos reportes hay de cada tipo, en total. El backend no agrupa, pero
 * cualquier página trae `pagination.total`: con una página de un elemento por
 * tipo alcanza. Son siempre las mismas cinco consultas, en el mismo orden.
 */
function useReportTotalsByType() {
  const post = useGlobalReports({ page: 1, limit: 1, itemType: 'post' })
  const reply = useGlobalReports({ page: 1, limit: 1, itemType: 'reply' })
  const product = useGlobalReports({ page: 1, limit: 1, itemType: 'product' })
  const conversation = useGlobalReports({ page: 1, limit: 1, itemType: 'conversation' })
  const community = useGlobalReports({ page: 1, limit: 1, itemType: 'community' })
  const byType: Record<ReportItemType, typeof post> = { post, reply, product, conversation, community }
  return {
    isLoading: ITEM_TYPES.some((type) => byType[type].isLoading),
    totals: ITEM_TYPES.map((type) => ({ type, value: byType[type].data?.pagination.total ?? 0 })),
  }
}

/**
 * Cuántos hay de cada estado, que es lo primero que se quiere saber, de qué
 * tipo son los reportes y cuáles esperan atención.
 */
function ReportsOverview() {
  const { t, language } = useLanguage()
  // Los contadores vienen con cualquier consulta, así que la misma página
  // corta de pendientes sirve para las dos cosas.
  const reports = useGlobalReports({ page: 1, limit: LATEST_PENDING, status: 'pending' })
  const byType = useReportTotalsByType()

  const typeItems = byType.totals
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ label: t(REPORT_ITEM_LABEL[item.type]), value: item.value }))

  if (reports.isError) return <LoadErrorPanel error={reports.error} onRetry={() => void reports.refetch()} />

  if (reports.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  const counts = reports.data?.counts
  const latest = reports.data?.data ?? []

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ShieldAlert}
          label={t('reports.status.pending')}
          value={counts?.pending}
          tone={(counts?.pending ?? 0) > 0 ? 'red' : 'gray'}
        />
        <StatCard icon={CheckCircle2} label={t('reports.status.resolved')} value={counts?.resolved} tone="teal" />
        <StatCard icon={CircleSlash} label={t('reports.status.dismissed')} value={counts?.dismissed} tone="gray" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={t('admin.reports.latestPending')} action={<ManageLink section="reports" />}>
          {latest.length === 0 ? (
            <p className="py-6 text-center text-sm text-mynted-gray">{t('admin.reports.noPending')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mynted-border">
              {latest.map((report) => (
                <li key={report.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-2 text-xs text-mynted-gray">
                      <StatusPill tone="gray">{t(REPORT_ITEM_LABEL[report.itemType])}</StatusPill>
                      {t(REPORT_REASON_LABEL[report.reason])}
                      {report.community && <span>· {report.community.name}</span>}
                    </p>
                    <p className="truncate text-sm text-mynted-ink">
                      {report.contentUnavailable || !report.excerpt
                        ? t('reports.contentUnavailable')
                        : (report.excerpt.title ?? report.excerpt.text)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-mynted-gray">{formatRelativeTime(report.createdAt, language)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('admin.reports.byType')}>
          {byType.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-mynted-bg" />
          ) : (
            <DistributionList items={typeItems} emptyLabel={t('admin.table.empty')} />
          )}
        </Panel>
      </div>
    </>
  )
}

/**
 * El listado con sus filtros y las acciones de cada reporte.
 *
 * Arranca filtrado por pendientes: lo resuelto ya no pide nada y, si se
 * mostrara todo mezclado, lo que falta atender quedaría enterrado.
 */
function ReportsManage() {
  const { t, language } = useLanguage()
  const [status, setStatus] = useState<ReportStatus | ''>('pending')
  const [itemType, setItemType] = useState<ReportItemType | ''>('')
  const [communityId, setCommunityId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const listTop = useRef<HTMLDivElement>(null)

  const filters = {
    page,
    limit: pageSize,
    ...(status && { status }),
    ...(itemType && { itemType }),
    ...(communityId && { communityId: Number(communityId) }),
  }
  const reports = useGlobalReports(filters)
  const communities = useAdminCommunities()

  const resolve = useResolveReportMutation()
  const dismiss = useDismissReportMutation()
  // Se guarda el reporte y no solo su id: el diálogo necesita el tipo para
  // saber qué acciones puede ofrecer.
  const [resolving, setResolving] = useState<Report | null>(null)

  /** Cambiar un filtro vuelve a la primera página: la actual puede no existir. */
  function changeFilter(apply: () => void) {
    apply()
    setPage(1)
  }

  function handleResolve(payload: ResolveReportPayload) {
    if (resolving === null) return
    resolve.mutate({ reportId: resolving.id, payload }, { onSuccess: () => setResolving(null) })
  }

  /** Al cambiar de página se vuelve al principio: si no, se queda abajo del todo. */
  function changePage(next: number) {
    setPage(next)
    listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const items = reports.data?.data ?? []

  return (
    <>
      {/*
        Los tres filtros son selects, como en las tablas del resto del panel
        (misma barra que AdminDataTable). El de estado lleva el contador de
        cada uno, que viene con cualquier página.
      */}
      <div ref={listTop} className="scroll-mt-20 rounded-2xl border border-mynted-border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterSelect
            label={t('admin.table.show')}
            value={String(pageSize)}
            onChange={(value) => changeFilter(() => setPageSize(Number(value)))}
            options={PAGE_SIZES.map((size) => ({ value: String(size), label: size.toLocaleString(language) }))}
          />
          <FilterSelect<ReportStatus | ''>
            label={t('admin.sellers.columns.status')}
            value={status}
            onChange={(value) => changeFilter(() => setStatus(value))}
            options={STATUS_OPTIONS.map(({ value, labelKey }) => {
              return { value, label:  `${t(labelKey)} ` }
            })}
          />
          <FilterSelect
            label={t('admin.reports.filter.type')}
            value={itemType}
            onChange={(value) => changeFilter(() => setItemType(value))}
            options={TYPE_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
          />
          {/*
            El backend filtra por una comunidad concreta, pero no sabe pedir
            "solo los que no son de ninguna": los reportes de productos y de
            chats no pertenecen a ninguna comunidad y se marcan en la tarjeta.
          */}
          <FilterSelect
            label={t('admin.reports.filter.community')}
            value={communityId}
            onChange={(value) => changeFilter(() => setCommunityId(value))}
            options={[
              { value: '', label: t('admin.reports.filter.allCommunities') },
              ...(communities.data ?? []).map((community) => ({
                value: String(community.id),
                label: community.name,
              })),
            ]}
          />
        </div>
      </div>

      {reports.isError ? (
        <LoadErrorPanel error={reports.error} onRetry={() => void reports.refetch()} />
      ) : reports.isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ErrorState kind="empty" variant="compact" title={t('admin.reports.empty.title')} description={t('admin.reports.empty.body')} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              showStatus={status === ''}
              isBusy={resolve.isPending || dismiss.isPending}
              onResolve={() => setResolving(report)}
              onDismiss={() => dismiss.mutate(report.id)}
            />
          ))}

          {reports.data && (
            <AdminPageFooter
              page={page}
              limit={pageSize}
              total={reports.data.pagination.total}
              totalPages={reports.data.pagination.totalPages}
              onChange={changePage}
            />
          )}
        </div>
      )}

      <ResolveReportDialog
        open={resolving !== null}
        report={resolving}
        isPending={resolve.isPending}
        error={resolve.error}
        onConfirm={handleResolve}
        onClose={() => setResolving(null)}
      />
    </>
  )
}
