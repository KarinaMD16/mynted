import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/Button'
import { StatusPill, type PillTone } from '@/features/admin/components/AdminUi'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { formatRelativeTime } from '@/utils/relativeTime'
import { REPORT_ITEM_LABEL as ITEM_LABEL, REPORT_REASON_LABEL as REASON_LABEL } from '../models/report'
import type { Report, ReportStatus } from '../models/report'

const STATUS_LABEL: Record<ReportStatus, TranslationKey> = {
  pending: 'reports.status.pending',
  resolved: 'reports.status.resolved',
  dismissed: 'reports.status.dismissed',
}

const STATUS_TONE: Record<ReportStatus, PillTone> = {
  pending: 'amber',
  resolved: 'teal',
  dismissed: 'gray',
}

/**
 * Un reporte, con lo necesario para decidir sin abrirlo: qué se reportó, por
 * qué, quién lo reportó y un pedazo del contenido.
 *
 * Sirve igual para el listado global del panel y para el de una comunidad: la
 * comunidad solo se muestra si viene (en el listado de una comunidad sobra).
 * Las acciones se reciben como props para que cada pantalla use su endpoint.
 */
export function ReportCard({
  report,
  onResolve,
  onDismiss,
  isBusy = false,
  communitySlug,
  showStatus = true,
}: {
  report: Report
  onResolve: () => void
  onDismiss: () => void
  isBusy?: boolean
  /**
   * Con el listado filtrado por un estado, todas las tarjetas dirían lo
   * mismo: la pestaña ya lo dice, así que el estado se muestra solo en "Todos".
   */
  showStatus?: boolean
  /**
   * El listado de una comunidad no manda la comunidad en cada reporte (sobra:
   * son todos de la misma), pero hace falta para armar el enlace a una
   * publicación, que va por slug.
   */
  communitySlug?: string
}) {
  const { t, language } = useLanguage()
  const isPending = report.status === 'pending'

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-mynted-border bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        {showStatus && <StatusPill tone={STATUS_TONE[report.status]}>{t(STATUS_LABEL[report.status])}</StatusPill>}
        <span className="rounded-full bg-mynted-bg px-2.5 py-1 text-xs font-medium text-mynted-ink">
          {t(ITEM_LABEL[report.itemType])}
        </span>
        <span className="text-xs text-mynted-gray">{t(REASON_LABEL[report.reason])}</span>
        <span className="ml-auto text-xs text-mynted-gray">{formatRelativeTime(report.createdAt, language)}</span>
      </div>

      <ReportExcerptBlock report={report} communitySlug={communitySlug} />

      {/* Los reportes son anónimos: el backend no dice quién reportó.
          `community` solo viene en el listado global. Sin comunidad son los
          reportes de productos y de chats, que no viven en ninguna. Si lo
          reportado es la comunidad, "Ver la comunidad" ya lleva ahí. */}
      {report.community !== undefined && report.itemType !== 'community' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mynted-gray">
          <CommunityLink community={report.community} />
        </div>
      )}

      {isPending && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onResolve} disabled={isBusy}>
            {t('reports.action.resolve')}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={onDismiss} disabled={isBusy}>
            {t('reports.action.dismiss')}
          </Button>
        </div>
      )}
    </article>
  )
}

/** El contenido reportado, o el aviso de que ya no está. */
function ReportExcerptBlock({ report, communitySlug }: { report: Report; communitySlug?: string }) {
  const { t } = useLanguage()

  if (report.contentUnavailable || !report.excerpt) {
    return (
      <p className="rounded-xl bg-mynted-bg px-3.5 py-2.5 text-sm text-mynted-gray">{t('reports.contentUnavailable')}</p>
    )
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-mynted-bg px-3.5 py-2.5">
      {report.excerpt.title && <p className="text-sm font-semibold text-mynted-ink">{report.excerpt.title}</p>}
      {report.excerpt.text && <p className="line-clamp-3 text-sm text-mynted-gray">{report.excerpt.text}</p>}
      <TargetLink report={report} communitySlug={communitySlug} />
    </div>
  )
}

/**
 * Enlace al contenido reportado, cuando se puede armar.
 *
 * Un producto se abre por su id. Una publicación necesita además el slug de la
 * comunidad, que solo viene en el listado global. Una respuesta no se puede
 * enlazar: el backend manda el id de la respuesta, no el de la publicación que
 * la contiene, y sin eso no hay ruta. Un chat no tiene vista pública.
 */
function TargetLink({ report, communitySlug }: { report: Report; communitySlug?: string }) {
  const { t } = useLanguage()
  // El listado global trae la comunidad en el reporte; el de una comunidad la
  // pasa por prop, salvo que esa comunidad esté dada de baja.
  const slug = report.community ? (report.community.deletedAt ? undefined : report.community.slug) : communitySlug

  if (report.itemType === 'product') {
    return (
      <Link
        to="/products/$productId"
        params={{ productId: String(report.itemId) }}
        className="w-fit text-xs font-semibold text-mynted-blue hover:underline"
      >
        {t('reports.openProduct')}
      </Link>
    )
  }

  // Una comunidad reportada se abre por su slug; el reporte guarda su id en
  // `itemId`, así que el slug sale de la comunidad del reporte o de la prop.
  if (report.itemType === 'community' && slug) {
    return (
      <Link
        to="/communities/$slug"
        params={{ slug }}
        className="w-fit text-xs font-semibold text-mynted-blue hover:underline"
      >
        {t('reports.openCommunity')}
      </Link>
    )
  }

  if (report.itemType === 'post' && slug) {
    return (
      <Link
        to="/communities/$slug/posts/$postId"
        params={{ slug, postId: String(report.itemId) }}
        className="w-fit text-xs font-semibold text-mynted-blue hover:underline"
      >
        {t('reports.openPost')}
      </Link>
    )
  }

  return null
}

function CommunityLink({ community }: { community: Report['community'] }) {
  const { t } = useLanguage()

  if (!community) return <span>{t('reports.noCommunity')}</span>

  // Una comunidad dada de baja ya no abre: se muestra el nombre sin enlace.
  if (community.deletedAt) return <span>{community.name}</span>

  return (
    <Link to="/communities/$slug" params={{ slug: community.slug }} className="font-semibold text-mynted-blue hover:underline">
      {community.name}
    </Link>
  )
}
