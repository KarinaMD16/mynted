import { useMemo, useState } from 'react'
import { Check, CheckCircle2, CircleSlash, ShieldAlert, X } from 'lucide-react'
import { CommunityLink, TargetLink } from '@/features/reports/components/ReportCard'
import { ResolveReportDialog } from '@/features/reports/components/ResolveReportDialog'
import { useDismissReportMutation, useGlobalReports, useResolveReportMutation } from '@/features/reports/hooks/useReports'
import {
  REPORT_ITEM_LABEL,
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_TONE,
} from '@/features/reports/models/report'
import type { Report, ReportItemType, ReportStatus, ResolveReportPayload } from '@/features/reports/models/report'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { formatRelativeTime } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import { useAdminCommunities } from '../hooks/useAdminQueries'
import {
  DistributionList,
  FilterSelect,
  IconAction,
  LoadErrorPanel,
  Panel,
  StatCard,
  StatCardSkeleton,
  StatusPill,
} from '../components/AdminUi'
import type { AdminTab } from '../models/admin'
import { ManageLink } from './UsersSection'

/** Cuántos reportes trae la tabla: el máximo que el backend da por página. */
const MANAGE_LIMIT = 100

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
 * Tabla de reportes con sus filtros y las acciones de cada uno.
 *
 * Arranca filtrado por pendientes: lo resuelto ya no pide nada y, si se
 * mostrara todo mezclado, lo que falta atender quedaría enterrado. Estado,
 * tipo y comunidad los filtra el backend; la búsqueda, el orden y las páginas,
 * la tabla (como en el resto del panel), sobre los más recientes que trae.
 */
function ReportsManage() {
  const { t, language } = useLanguage()
  const [status, setStatus] = useState<ReportStatus | ''>('pending')
  const [itemType, setItemType] = useState<ReportItemType | ''>('')
  const [communityId, setCommunityId] = useState('')

  const reports = useGlobalReports({
    page: 1,
    limit: MANAGE_LIMIT,
    ...(status && { status }),
    ...(itemType && { itemType }),
    ...(communityId && { communityId: Number(communityId) }),
  })
  const communities = useAdminCommunities()

  const resolve = useResolveReportMutation()
  const dismiss = useDismissReportMutation()
  // Se guarda el reporte y no solo su id: el diálogo necesita el tipo para
  // saber qué acciones puede ofrecer.
  const [resolving, setResolving] = useState<Report | null>(null)

  function handleResolve(payload: ResolveReportPayload) {
    if (resolving === null) return
    resolve.mutate({ reportId: resolving.id, payload }, { onSuccess: () => setResolving(null) })
  }

  const isBusy = resolve.isPending || dismiss.isPending
  const total = reports.data?.pagination.total ?? 0

  const columns = useMemo<AdminColumn<Report>[]>(
    () => [
      {
        id: 'type',
        header: t('admin.reports.columns.type'),
        sortValue: (row) => t(REPORT_ITEM_LABEL[row.itemType]),
        render: (row) => <StatusPill tone="gray">{t(REPORT_ITEM_LABEL[row.itemType])}</StatusPill>,
      },
      {
        id: 'content',
        header: t('admin.reports.columns.content'),
        render: (row) => <ReportedContent report={row} />,
      },
      {
        id: 'reason',
        header: t('admin.reports.columns.reason'),
        sortValue: (row) => t(REPORT_REASON_LABEL[row.reason]),
        render: (row) => <span className="whitespace-nowrap">{t(REPORT_REASON_LABEL[row.reason])}</span>,
      },
      {
        id: 'community',
        header: t('admin.reports.columns.community'),
        sortValue: (row) => row.community?.name ?? '',
        render: (row) => (
          <span className="whitespace-nowrap">
            <CommunityLink community={row.community} />
          </span>
        ),
      },
      {
        id: 'date',
        header: t('admin.reports.columns.date'),
        sortValue: (row) => row.createdAt,
        render: (row) => <span className="whitespace-nowrap">{formatRelativeTime(row.createdAt, language)}</span>,
      },
      {
        id: 'status',
        header: t('admin.reports.columns.status'),
        sortValue: (row) => row.status,
        render: (row) => (
          <StatusPill tone={REPORT_STATUS_TONE[row.status]}>{t(REPORT_STATUS_LABEL[row.status])}</StatusPill>
        ),
      },
    ],
    [t, language],
  )

  return (
    <>
      {total > MANAGE_LIMIT && (
        <p className="rounded-xl bg-white px-4 py-3 text-sm text-mynted-gray">
          {t('admin.reports.limitNotice', {
            shown: MANAGE_LIMIT.toLocaleString(language),
            total: total.toLocaleString(language),
          })}
        </p>
      )}

      <AdminDataTable
        rows={reports.data?.data}
        columns={columns}
        getRowId={(row) => row.id}
        getSearchText={(row) =>
          [row.excerpt?.title, row.excerpt?.text, row.community?.name, t(REPORT_REASON_LABEL[row.reason])]
            .filter(Boolean)
            .join(' ')
        }
        searchPlaceholder={t('admin.reports.searchPlaceholder')}
        isLoading={reports.isPending}
        error={reports.error}
        onRetry={() => void reports.refetch()}
        initialSort={{ id: 'date', direction: 'desc' }}
        toolbar={
          <>
            <FilterSelect<ReportStatus | ''>
              label={t('admin.reports.columns.status')}
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
            />
            <FilterSelect
              label={t('admin.reports.filter.type')}
              value={itemType}
              onChange={setItemType}
              options={TYPE_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))}
            />
            {/*
              El backend filtra por una comunidad concreta, pero no sabe pedir
              "solo los que no son de ninguna": los reportes de productos y de
              chats no pertenecen a ninguna comunidad y lo dice su columna.
            */}
            <FilterSelect
              label={t('admin.reports.filter.community')}
              value={communityId}
              onChange={setCommunityId}
              options={[
                { value: '', label: t('admin.reports.filter.allCommunities') },
                ...(communities.data ?? []).map((community) => ({
                  value: String(community.id),
                  label: community.name,
                })),
              ]}
            />
          </>
        }
        renderActions={(row) =>
          row.status === 'pending' ? (
            <>
              <IconAction
                icon={Check}
                tone="success"
                label={t('reports.action.resolve')}
                onPress={() => setResolving(row)}
                disabled={isBusy}
              />
              <IconAction
                icon={X}
                label={t('reports.action.dismiss')}
                onPress={() => dismiss.mutate(row.id)}
                disabled={isBusy}
              />
            </>
          ) : null
        }
      />

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

/** Lo reportado en una línea, con el enlace para abrirlo cuando se puede. */
function ReportedContent({ report }: { report: Report }) {
  const { t } = useLanguage()
  if (report.contentUnavailable || !report.excerpt) {
    return <span className="text-mynted-gray-light italic">{t('reports.contentUnavailable')}</span>
  }
  const text = report.excerpt.title ?? report.excerpt.text
  return (
    <span className="flex max-w-[320px] flex-col gap-0.5">
      <span className="line-clamp-2 text-mynted-ink [overflow-wrap:anywhere]" title={text ?? undefined}>
        {text}
      </span>
      <TargetLink report={report} />
    </span>
  )
}
