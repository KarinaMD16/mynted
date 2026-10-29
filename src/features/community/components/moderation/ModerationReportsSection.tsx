import { useState } from 'react'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { AdminPageFooter } from '@/features/admin/components/AdminPagination'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'
import { ReportCard } from '@/features/reports/components/ReportCard'
import { ReportStatusTabs } from '@/features/reports/components/ReportStatusTabs'
import { ResolveReportDialog } from '@/features/reports/components/ResolveReportDialog'
import {
  useCommunityReports,
  useDismissCommunityReportMutation,
  useModerationStats,
  useResolveCommunityReportMutation,
} from '@/features/reports/hooks/useReports'
import type { Report, ReportStatus, ResolveReportPayload } from '@/features/reports/models/report'
import { useLanguage } from '@/i18n/LanguageContext'

/** Cuántos reportes se piden por página. */
const PAGE_SIZE = 10

/**
 * Sección "Reportes" de la moderación de una comunidad (tarea 1142). Es el
 * mismo material que el listado global del panel, pero acotado a la comunidad
 * y para su equipo: dueño y moderadores.
 *
 * Arranca en "Pendientes" porque es lo único que pide una decisión; lo cerrado
 * se consulta desde las otras pestañas.
 */
export function ModerationReportsSection({ community }: { community: CommunityDetail }) {
  const { t, language } = useLanguage()
  const [status, setStatus] = useState<ReportStatus | ''>('pending')
  const [page, setPage] = useState(1)
  // Se guarda el reporte y no solo su id: el diálogo necesita el tipo para
  // saber qué acciones puede ofrecer.
  const [resolving, setResolving] = useState<Report | null>(null)

  const stats = useModerationStats(community.id)
  const reports = useCommunityReports(community.id, { page, limit: PAGE_SIZE, ...(status && { status }) })
  const resolve = useResolveCommunityReportMutation(community.id)
  const dismiss = useDismissCommunityReportMutation(community.id)

  const counts = reports.data?.counts
  const items = reports.data?.data ?? []
  const number = (value: number | undefined) => value?.toLocaleString(language) ?? '—'

  function handleResolve(payload: ResolveReportPayload) {
    if (resolving === null) return
    resolve.mutate({ reportId: resolving.id, payload }, { onSuccess: () => setResolving(null) })
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('moderation.tabs.reports')}</h2>
        <p className="text-sm text-mynted-gray">{t('moderation.reports.subtitle')}</p>
      </header>

      {/* Sin "miembros activos": la cabecera de la página ya muestra los miembros. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label={t('moderation.reports.stats.pending')} value={number(stats.data?.pendingReports)} highlight={(stats.data?.pendingReports ?? 0) > 0} />
        <MiniStat label={t('moderation.reports.stats.resolvedToday')} value={number(stats.data?.resolvedToday)} />
        <MiniStat label={t('moderation.reports.stats.moderators')} value={number(stats.data?.activeModerators)} />
      </div>

      <ReportStatusTabs
        value={status}
        counts={counts}
        onChange={(value) => {
          setStatus(value)
          // La página actual puede no existir con el filtro nuevo.
          setPage(1)
        }}
      />

      {reports.isError ? (
        <QueryErrorState
          error={reports.error}
          onRetry={() => void reports.refetch()}
          variant="compact"
          texts={{
            forbidden: { description: t('moderation.forbiddenDescription') },
            error: { description: t('moderation.reports.loadError') },
          }}
        />
      ) : reports.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-mynted-bg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ErrorState
          kind="empty"
          variant="compact"
          title={t('moderation.reports.empty.title')}
          description={t('moderation.reports.empty.body')}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              communitySlug={community.slug}
              showStatus={status === ''}
              isBusy={resolve.isPending || dismiss.isPending}
              onResolve={() => setResolving(report)}
              onDismiss={() => dismiss.mutate(report.id)}
            />
          ))}

          {reports.data && (
            <AdminPageFooter
              page={page}
              limit={PAGE_SIZE}
              total={reports.data.pagination.total}
              totalPages={reports.data.pagination.totalPages}
              onChange={setPage}
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
    </div>
  )
}

function MiniStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-mynted-border px-4 py-3">
      <p className={`font-heading text-xl font-semibold ${highlight ? 'text-red-600' : 'text-mynted-ink'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-mynted-gray">{label}</p>
    </div>
  )
}
