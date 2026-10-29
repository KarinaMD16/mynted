import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { FileText, Flag, Package, Scale, ScrollText, Store, UserRound, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import { formatRelativeTime, formatShortDate } from '@/utils/relativeTime'
import { AdminDataTable, type AdminColumn } from '../components/AdminDataTable'
import {
  DistributionList,
  FilterDate,
  FilterSelect,
  LoadErrorPanel,
  Panel,
  StatCard,
  StatCardSkeleton,
  StatusPill,
  type PillTone,
} from '../components/AdminUi'
import {
  useAdminCommunities,
  useAdminUsers,
  useAllModerationLog,
  useModerationLog,
  useModerationLogCount,
} from '../hooks/useAdminQueries'
import type { AdminCommunity, AdminTab, AdminUser } from '../models/admin'
import type { ModerationLogEntry } from '../models/moderationLog'
import { ManageLink } from './UsersSection'

/**
 * Cuántas acciones mira el resumen para el desglose. El endpoint no agrupa ni
 * filtra: el reparto es de las últimas N, no de toda la historia, y así lo
 * dice el título del panel.
 */
const SAMPLE_SIZE = 50

/**
 * Cómo se lee cada acción. Las claves son las del backend
 * (`MODERATION_ACTIONS`); si apareciera una nueva se muestra tal cual en vez
 * de romper, porque el registro es histórico y no se puede recortar.
 */
const ACTION_LABEL: Record<string, TranslationKey> = {
  content_hidden: 'admin.log.action.contentHidden',
  content_restored: 'admin.log.action.contentRestored',
  report_resolved: 'admin.log.action.reportResolved',
  report_dismissed: 'admin.log.action.reportDismissed',
  author_warned: 'admin.log.action.authorWarned',
  user_deactivated: 'admin.log.action.userDeactivated',
  user_reactivated: 'admin.log.action.userReactivated',
  user_soft_deleted: 'admin.log.action.userDeleted',
  seller_revoked: 'admin.log.action.sellerRevoked',
  seller_restored: 'admin.log.action.sellerRestored',
  product_deactivated: 'admin.log.action.productDeactivated',
  product_activated: 'admin.log.action.productActivated',
  product_soft_deleted: 'admin.log.action.productDeleted',
  community_deactivated: 'admin.log.action.communityDeactivated',
  community_activated: 'admin.log.action.communityActivated',
  community_made_public: 'admin.log.action.communityPublic',
  community_made_private: 'admin.log.action.communityPrivate',
  community_soft_deleted: 'admin.log.action.communityDeleted',
  community_member_removed: 'admin.log.action.memberRemoved',
  community_member_banned: 'admin.log.action.memberBanned',
  community_member_unbanned: 'admin.log.action.memberUnbanned',
  community_ownership_transferred: 'admin.log.action.ownershipTransferred',
  payment_dispute_refunded: 'admin.log.action.disputeRefunded',
  payment_dispute_closed: 'admin.log.action.disputeClosed',
}

/** Verde lo que devuelve algo, rojo lo que lo quita, gris lo que solo cierra. */
const ACTION_TONE: Record<string, PillTone> = {
  content_hidden: 'red',
  content_restored: 'teal',
  report_resolved: 'teal',
  report_dismissed: 'gray',
  author_warned: 'amber',
  user_deactivated: 'red',
  user_reactivated: 'teal',
  user_soft_deleted: 'red',
  seller_revoked: 'red',
  seller_restored: 'teal',
  product_deactivated: 'red',
  product_activated: 'teal',
  product_soft_deleted: 'red',
  community_deactivated: 'red',
  community_activated: 'teal',
  community_made_public: 'blue',
  community_made_private: 'amber',
  community_soft_deleted: 'red',
  community_member_removed: 'red',
  community_member_banned: 'red',
  community_member_unbanned: 'teal',
  community_ownership_transferred: 'blue',
  payment_dispute_refunded: 'violet',
  payment_dispute_closed: 'gray',
}

/**
 * Las 24 acciones se agrupan en siete áreas, cada una con su ícono: es lo que
 * permite recorrer el registro de un vistazo sin leer cada etiqueta.
 */
type LogArea = 'content' | 'reports' | 'accounts' | 'sellers' | 'products' | 'communities' | 'payments' | 'other'

const AREA_OF_PREFIX: [string, LogArea][] = [
  ['content_', 'content'],
  ['report_', 'reports'],
  ['author_', 'reports'],
  ['user_', 'accounts'],
  ['seller_', 'sellers'],
  ['product_', 'products'],
  ['community_', 'communities'],
  ['payment_', 'payments'],
]

/** Las áreas en el orden del filtro. */
const LOG_AREAS: LogArea[] = ['content', 'reports', 'accounts', 'sellers', 'products', 'communities', 'payments']

function areaOf(action: string): LogArea {
  return AREA_OF_PREFIX.find(([prefix]) => action.startsWith(prefix))?.[1] ?? 'other'
}

const AREA_LABEL: Record<LogArea, TranslationKey> = {
  content: 'admin.log.area.content',
  reports: 'admin.log.area.reports',
  accounts: 'admin.log.area.accounts',
  sellers: 'admin.log.area.sellers',
  products: 'admin.log.area.products',
  communities: 'admin.log.area.communities',
  payments: 'admin.log.area.payments',
  other: 'admin.log.area.other',
}

const AREA_ICON: Record<LogArea, ComponentType<{ className?: string }>> = {
  content: FileText,
  reports: Flag,
  accounts: UserRound,
  sellers: Store,
  products: Package,
  communities: UsersRound,
  payments: Scale,
  other: ScrollText,
}

/** Mismos tonos que las píldoras, pero para el círculo del ícono. */
const ICON_TONE: Record<PillTone, string> = {
  violet: 'bg-violet-50 text-violet-600',
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-mynted-bg text-mynted-gray',
  orange: 'bg-orange-50 text-mynted-orange',
  blue: 'bg-blue-50 text-mynted-blue-mid',
}

const TARGET_LABEL: Record<string, TranslationKey> = {
  report: 'admin.log.target.report',
  post: 'reports.item.post',
  reply: 'reports.item.reply',
  product: 'reports.item.product',
  user: 'admin.log.target.user',
  seller: 'admin.log.target.seller',
  community: 'reports.item.community',
  conversation: 'reports.item.conversation',
  community_profile: 'admin.log.target.communityMember',
  payment_dispute: 'admin.log.target.dispute',
}

/**
 * Lo que el panel ya tiene cargado (comunidades y cuentas, que usan otras
 * secciones y quedan en cache) sirve para ponerle nombre y enlace a cada
 * objetivo sin pedir nada por fila. Lo que no está ahí (un reporte, una
 * respuesta) se sigue mostrando por su número.
 */
interface LogLookups {
  communities: Map<number, AdminCommunity>
  users: Map<string, AdminUser>
  /** Objetivos (`tipo:id`) que ya no se pueden abrir; ver `findUnavailable`. */
  unavailable: Set<string>
}

function useLogLookups(entries: ModerationLogEntry[] | undefined): LogLookups {
  const communities = useAdminCommunities()
  const users = useAdminUsers()
  return useMemo(
    () => ({
      communities: new Map((communities.data ?? []).map((community) => [community.id, community])),
      users: new Map((users.data ?? []).map((user) => [user.id, user])),
      unavailable: findUnavailable(entries ?? []),
    }),
    [communities.data, users.data, entries],
  )
}

/**
 * Acciones que dejan el objetivo fuera de la vista pública (su página responde
 * 404, también para el superadmin) y las que lo devuelven.
 */
const REMOVES_TARGET = new Set(['content_hidden', 'product_deactivated', 'product_soft_deleted'])
const RESTORES_TARGET = new Set(['content_restored', 'product_activated'])

/**
 * Publicaciones y productos cuya última acción registrada los sacó de la vista:
 * enlazarlos lleva a un 404. Las entradas vienen de la más nueva a la más
 * vieja, así que manda la primera que se encuentra de cada objetivo. Solo se
 * mira lo cargado: con filtros puede faltar la acción que lo restauró.
 */
function findUnavailable(entries: ModerationLogEntry[]): Set<string> {
  const seen = new Set<string>()
  const unavailable = new Set<string>()
  for (const entry of entries) {
    if (!REMOVES_TARGET.has(entry.action) && !RESTORES_TARGET.has(entry.action)) continue
    const key = targetKeyOf(entry)
    if (seen.has(key)) continue
    seen.add(key)
    if (REMOVES_TARGET.has(entry.action)) unavailable.add(key)
  }
  return unavailable
}

function targetKeyOf(entry: ModerationLogEntry) {
  return `${entry.targetType}:${entry.targetId}`
}

/**
 * Sección "Registro" del panel (GET /moderation-log). Es de solo lectura: el
 * backend solo agrega filas, nunca las cambia ni las borra, así que acá no hay
 * acciones, solo historia.
 *
 * El resumen reparte las últimas acciones por área y por persona; "Gestionar"
 * es la tabla completa, con filtros.
 */
export function ModerationLogSection({ tab }: { tab: AdminTab }) {
  return tab === 'overview' ? <LogOverview /> : <LogTable />
}

function LogOverview() {
  const { t } = useLanguage()
  const log = useModerationLog(1, SAMPLE_SIZE)
  // "Hoy" no sale de la muestra: si hubo más de SAMPLE_SIZE acciones en el
  // día, contarlas ahí se quedaría corto. Se le pregunta el total al backend.
  const [todayStart] = useState(() => startOfDay(toDayString(new Date())))
  const today = useModerationLogCount({ from: todayStart })
  const lookups = useLogLookups(log.data?.data)

  const entries = useMemo(() => log.data?.data ?? [], [log.data])

  const byArea = useMemo(() => {
    const counts = new Map<LogArea, number>()
    for (const entry of entries) counts.set(areaOf(entry.action), (counts.get(areaOf(entry.action)) ?? 0) + 1)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([area, value]) => ({ label: t(AREA_LABEL[area]), value }))
  }, [entries, t])

  const actorCount = useMemo(() => new Set(entries.map((entry) => entry.actor.id)).size, [entries])

  if (log.isError) return <LoadErrorPanel error={log.error} onRetry={() => void log.refetch()} />
  if (log.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ScrollText} label={t('admin.log.stats.total')} value={log.data?.pagination.total} tone="violet" />
        <StatCard icon={Flag} label={t('admin.log.stats.today')} value={today.data} tone="orange" />
        <StatCard icon={UsersRound} label={t('admin.log.stats.actors')} value={actorCount} tone="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={t('admin.log.latestTitle')} action={<ManageLink section="moderationLog" />}>
          {entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-mynted-gray">{t('admin.table.empty')}</p>
          ) : (
            <ul className="flex flex-col">
              {entries.slice(0, 6).map((entry) => (
                <LogItem key={entry.id} entry={entry} lookups={lookups} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title={t('admin.log.byArea')}>
            <DistributionList items={byArea} emptyLabel={t('admin.table.empty')} />
          </Panel>
        </div>
      </div>
    </>
  )
}

/**
 * El registro en la tabla de siempre del panel. Quién actuó y el rango de
 * fechas los filtra el backend; buscar, ordenar, paginar y filtrar por área
 * siguen del lado del cliente, porque un área junta varias acciones y el
 * endpoint filtra por una sola.
 */
function LogTable() {
  const { t, language } = useLanguage()
  const [area, setArea] = useState<LogArea | ''>('')
  const [actorId, setActorId] = useState('')
  const [fromDay, setFromDay] = useState('')
  const [toDay, setToDay] = useState('')
  // Un rango al revés el backend lo rechaza (400): se avisa y no se manda.
  const isReversed = Boolean(fromDay && toDay && fromDay > toDay)
  const log = useAllModerationLog({
    ...(actorId && { actorUserId: actorId }),
    ...(!isReversed && fromDay && { from: startOfDay(fromDay) }),
    ...(!isReversed && toDay && { to: endOfDay(toDay) }),
  })
  const lookups = useLogLookups(log.data)

  /* Las opciones de "Quién" salen del registro, pero de una carga sin ese
     filtro: si no, al elegir a alguien la lista quedaría solo con esa persona.
     Se recalculan durante el render cuando cambian los datos. */
  const [actors, setActors] = useState<ModerationLogEntry['actor'][]>([])
  const [actorsSource, setActorsSource] = useState<ModerationLogEntry[]>()
  if (!actorId && !log.isPlaceholderData && log.data && log.data !== actorsSource) {
    setActorsSource(log.data)
    const byId = new Map<string, ModerationLogEntry['actor']>()
    for (const entry of log.data) byId.set(entry.actor.id, entry.actor)
    setActors([...byId.values()].sort((a, b) => a.username.localeCompare(b.username)))
  }

  const rows = useMemo(() => log.data?.filter((entry) => !area || areaOf(entry.action) === area), [log.data, area])

  const actionLabel = (entry: ModerationLogEntry) => {
    const key = ACTION_LABEL[entry.action]
    return key ? t(key) : entry.action
  }

  const columns: AdminColumn<ModerationLogEntry>[] = [
    {
      id: 'date',
      header: t('admin.log.columns.date'),
      sortValue: (entry) => new Date(entry.createdAt).getTime(),
      className: 'whitespace-nowrap',
      render: (entry) => (
        <time dateTime={entry.createdAt} className="flex flex-col">
          <span className="text-mynted-ink">{formatShortDate(entry.createdAt, language)}</span>
          <span className="text-xs tabular-nums">{formatClock(entry.createdAt, language)}</span>
        </time>
      ),
    },
    {
      id: 'action',
      header: t('admin.log.columns.action'),
      sortValue: actionLabel,
      render: (entry) => <ActionBadge entry={entry} />,
    },
    {
      id: 'target',
      header: t('admin.log.columns.target'),
      render: (entry) => {
        const community = entry.communityId !== null ? lookups.communities.get(entry.communityId) : undefined
        return (
          <div className="flex flex-col items-start gap-1">
            <LogTarget entry={entry} lookups={lookups} community={community} />
            {community && entry.targetType !== 'community' && (
              <span className="text-xs">
                {t('admin.log.inCommunity')} <CommunityName community={community} />
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actor',
      header: t('admin.log.columns.actor'),
      sortValue: (entry) => entry.actor.username,
      render: (entry) =>entry.actor.username,
    },
    {
      id: 'reason',
      header: t('admin.log.columns.reason'),
      className: 'max-w-64',
      render: (entry) => (entry.reason ? <LogReason reason={entry.reason} /> : '—'),
    },
  ]

  return (
    <AdminDataTable
      rows={rows}
      columns={columns}
      getRowId={(entry) => entry.id}
      getSearchText={(entry) => {
        const community = entry.communityId !== null ? lookups.communities.get(entry.communityId) : undefined
        const target = entry.targetType === 'community' ? lookups.communities.get(Number(entry.targetId))?.name : undefined
        const user = lookups.users.get(entry.targetId)?.username
        return [entry.actor.username, actionLabel(entry), entry.targetId, target, user, community?.name, entry.reason]
          .filter(Boolean)
          .join(' ')
      }}
      searchPlaceholder={t('admin.log.searchPlaceholder')}
      isLoading={log.isPending}
      error={log.error}
      onRetry={() => void log.refetch()}
      initialSort={{ id: 'date', direction: 'desc' }}
      toolbar={
        <>
          <FilterSelect<LogArea | ''>
            label={t('admin.log.filter.area')}
            value={area}
            onChange={setArea}
            options={[
              { value: '', label: t('admin.log.filter.allAreas') },
              ...LOG_AREAS.map((value) => ({ value, label: t(AREA_LABEL[value]) })),
            ]}
          />
          <FilterSelect
            label={t('admin.log.filter.actor')}
            value={actorId}
            onChange={setActorId}
            options={[
              { value: '', label: t('admin.log.filter.allActors') },
              ...actors.map((actor) => ({ value: actor.id, label: actor.username })),
            ]}
          />
          <FilterDate label={t('period.from')} value={fromDay} max={toDay || undefined} onChange={setFromDay} />
          <FilterDate label={t('period.to')} value={toDay} min={fromDay || undefined} onChange={setToDay} />
          {(fromDay || toDay) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromDay('')
                setToDay('')
              }}
            >
              {t('period.clear')}
            </Button>
          )}
          {isReversed && (
            <p role="alert" className="text-xs text-red-500">
              {t('period.reversed')}
            </p>
          )}
        </>
      }
    />
  )
}

/** Ícono del área y la acción, juntos: lo mismo en el resumen y en la tabla. */
function ActionBadge({ entry }: { entry: ModerationLogEntry }) {
  const { t } = useLanguage()
  const actionKey = ACTION_LABEL[entry.action]
  const tone = ACTION_TONE[entry.action] ?? 'gray'
  return (
    <span className="flex items-center gap-2">
      <StatusPill tone={tone}>
        {/* Una acción que el frontend no conozca se muestra cruda: es
            preferible a esconder una línea del registro. */}
        {actionKey ? t(actionKey) : entry.action}
      </StatusPill>
    </span>
  )
}

/**
 * Una acción en una línea: ícono del área, quién, qué hizo, sobre qué y
 * dónde; el motivo (si hay) debajo y cuándo a la derecha. La línea vertical
 * entre íconos une las acciones de la lista.
 */
function LogItem({
  entry,
  lookups,
}: {
  entry: ModerationLogEntry
  lookups: LogLookups
}) {
  const { t, language } = useLanguage()
  const actionKey = ACTION_LABEL[entry.action]
  const tone = ACTION_TONE[entry.action] ?? 'gray'
  const Icon = AREA_ICON[areaOf(entry.action)]
  const community = entry.communityId !== null ? lookups.communities.get(entry.communityId) : undefined
  // Si el objetivo ya es la comunidad, repetirla como contexto sobra.
  const showCommunity = community !== undefined && entry.targetType !== 'community'

  return (
    <li className="group relative flex gap-3 py-2.5">
      {/* Conector: se corta en el último elemento del bloque. */}
      <span aria-hidden="true" className="absolute top-11 bottom-0 left-4 w-px bg-mynted-border group-last:hidden" />
      <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ${ICON_TONE[tone]}`}>
        <Icon className="size-4" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            to="/users/$userId"
            params={{ userId: entry.actor.id }}
            className="font-semibold text-mynted-ink hover:text-mynted-blue hover:underline"
          >
            {entry.actor.username}
          </Link>
          <StatusPill tone={tone}>
            {/* Una acción que el frontend no conozca se muestra cruda: es
                preferible a esconder una línea del registro. */}
            {actionKey ? t(actionKey) : entry.action}
          </StatusPill>
          <LogTarget entry={entry} lookups={lookups} community={community} />
          {showCommunity && (
            <span className="text-xs text-mynted-gray">
              {t('admin.log.inCommunity')} <CommunityName community={community} />
            </span>
          )}
        </div>
        {entry.reason && <LogReason reason={entry.reason} />}
      </div>

      <time dateTime={entry.createdAt} className="shrink-0 pt-1.5 text-xs text-mynted-gray tabular-nums">
        {formatRelativeTime(entry.createdAt, language)}
      </time>
    </li>
  )
}


const TARGET_CHIP = 'rounded-full bg-mynted-bg px-2.5 py-1 text-xs font-medium text-mynted-ink'
const TARGET_LINK = `${TARGET_CHIP} transition-colors hover:bg-mynted-border hover:text-mynted-blue`

/**
 * Sobre qué se actuó. Con nombre y enlace cuando el panel lo conoce; si no
 * (un reporte, una respuesta, una cuenta ya eliminada), tipo y número.
 */
function LogTarget({
  entry,
  lookups,
  community,
}: {
  entry: ModerationLogEntry
  lookups: LogLookups
  community: AdminCommunity | undefined
}) {
  const { t } = useLanguage()
  const targetKey = TARGET_LABEL[entry.targetType]
  const fallback = `${targetKey ? t(targetKey) : entry.targetType} #${entry.targetId}`
  const numericId = Number(entry.targetId)
  const isUnavailable = lookups.unavailable.has(targetKeyOf(entry))

  let content: ReactNode = <span className={TARGET_CHIP}>{fallback}</span>

  if (entry.targetType === 'community') {
    const target = lookups.communities.get(numericId)
    if (target) content = <CommunityName community={target} chip />
  } else if (entry.targetType === 'user' || entry.targetType === 'seller') {
    const user = lookups.users.get(entry.targetId)
    if (user) {
      content = (
        <Link to="/users/$userId" params={{ userId: user.id }} className={TARGET_LINK}>
          {user.username}
        </Link>
      )
    }
  } else if (entry.targetType === 'product' && Number.isInteger(numericId) && !isUnavailable) {
    content = (
      <Link to="/products/$productId" params={{ productId: entry.targetId }} className={TARGET_LINK}>
        {fallback}
      </Link>
    )
  } else if (entry.targetType === 'post' && community && !community.deletedAt && !isUnavailable) {
    content = (
      <Link
        to="/communities/$slug/posts/$postId"
        params={{ slug: community.slug, postId: entry.targetId }}
        className={TARGET_LINK}
      >
        {fallback}
      </Link>
    )
  }

  return content
}

/** Una comunidad eliminada ya no tiene página: se nombra sin enlace. */
function CommunityName({ community, chip = false }: { community: AdminCommunity; chip?: boolean }) {
  if (community.deletedAt) {
    return <span className={chip ? TARGET_CHIP : 'font-medium text-mynted-ink'}>{community.name}</span>
  }
  return (
    <Link
      to="/communities/$slug"
      params={{ slug: community.slug }}
      className={chip ? TARGET_LINK : 'font-medium text-mynted-blue hover:underline'}
    >
      {community.name}
    </Link>
  )
}

/**
 * El motivo que quedó guardado. Al desactivar una cuenta el backend oculta su
 * contenido con un motivo automático (`USER_DEACTIVATED_HIDDEN_REASON`), que
 * es una constante y no algo que alguien escribió: se traduce en vez de
 * mostrar el código crudo.
 */
const AUTOMATIC_REASON = 'user_deactivated'

function LogReason({ reason }: { reason: string }) {
  const { t } = useLanguage()

  if (reason === AUTOMATIC_REASON) {
    return <p className="text-xs text-mynted-gray">{t('admin.log.reason.userDeactivated')}</p>
  }

  return <p className="text-xs text-mynted-gray italic">«{reason}»</p>
}

// ---------------------------------------------------------------------------
// Fechas
// ---------------------------------------------------------------------------

/** La fecha en hora local como YYYY-MM-DD, el formato del `<input type="date">`. */
function toDayString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Un día del `<input type="date">` (YYYY-MM-DD) como el instante en que empieza, en hora local. */
function startOfDay(day: string) {
  return new Date(`${day}T00:00:00`).toISOString()
}

/** El último instante de ese día en hora local: `to` es inclusivo. */
function endOfDay(day: string) {
  return new Date(`${day}T23:59:59.999`).toISOString()
}

function formatClock(isoDate: string, language: AppLanguage) {
  return new Intl.DateTimeFormat(INTL_LOCALES[language], { hour: '2-digit', minute: '2-digit' }).format(new Date(isoDate))
}
