import { useDeferredValue, useState } from 'react'
import { Ban, Crown, Search, Shield, ShieldOff, UserMinus } from 'lucide-react'
import { ErrorState } from '@/components/errors/ErrorState'
import { getHttpStatus } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { AdminPageFooter } from '@/features/admin/components/AdminPagination'
import {
  Avatar,
  ConfirmDialog,
  ConfirmWithReasonDialog,
  FilterSelect,
  IconAction,
  StatusPill,
  type PillTone,
} from '@/features/admin/components/AdminUi'
import { useCommunityBans, useCommunityMemberActions, useCommunityMembers } from '@/features/community/hooks/useCommunityMembers'
import type { CommunityDetail } from '@/features/community/models/communityDTOs'
import type { CommunityBan, CommunityMember, CommunityMemberRole } from '@/features/community/models/communityMembers'
import { hintClasses } from '@/features/community/types/DEFAULT_VALUES'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { cx } from '@/utils/cx'
import { formatShortDate } from '@/utils/relativeTime'

/** Quién está mirando el panel: decide qué acciones se ofrecen (el backend vuelve a validar). */
export type MembersViewerRole = 'owner' | 'moderator' | 'superadmin'

const PAGE_SIZE = 20

const ROLE_LABEL: Record<CommunityMemberRole, TranslationKey> = {
  owner: 'moderation.members.role.owner',
  moderator: 'moderation.members.role.moderator',
  member: 'moderation.members.role.member',
}

const ROLE_TONE: Record<CommunityMemberRole, PillTone> = {
  owner: 'orange',
  moderator: 'violet',
  member: 'gray',
}

type MemberActionKind = 'promote' | 'demote' | 'transfer' | 'expel' | 'ban'

/** Título, texto y botón del diálogo de cada acción. */
const ACTION_TEXT: Record<MemberActionKind, { title: TranslationKey; description: TranslationKey; confirm: TranslationKey }> = {
  promote: {
    title: 'moderation.members.promote.title',
    description: 'moderation.members.promote.description',
    confirm: 'moderation.members.action.promote',
  },
  demote: {
    title: 'moderation.members.demote.title',
    description: 'moderation.members.demote.description',
    confirm: 'moderation.members.action.demote',
  },
  transfer: {
    title: 'moderation.members.transfer.title',
    description: 'moderation.members.transfer.description',
    confirm: 'moderation.members.action.transfer',
  },
  expel: {
    title: 'moderation.members.expel.title',
    description: 'moderation.members.expel.description',
    confirm: 'moderation.members.action.expel',
  },
  ban: {
    title: 'moderation.members.ban.title',
    description: 'moderation.members.ban.description',
    confirm: 'moderation.members.action.ban',
  },
}

type PendingAction =
  | { kind: 'promote' | 'demote' | 'transfer'; member: CommunityMember }
  | { kind: 'expel' | 'ban'; member: CommunityMember }
  | { kind: 'unban'; ban: CommunityBan }

/** El error de una acción, en el idioma de quien mira: el backend responde solo en español. */
function actionErrorKey(error: unknown): TranslationKey {
  switch (getHttpStatus(error)) {
    case 403:
      return 'moderation.members.error.forbidden'
    case 404:
      return 'moderation.members.error.notFound'
    case 409:
      return 'moderation.members.error.conflict'
    default:
      return 'moderation.members.error.generic'
  }
}

/**
 * Pestaña "Miembros" de la moderación: quién está en la comunidad, con su
 * actividad, y lo que el equipo puede hacer con cada uno.
 *
 * | Quién mira  | Moderadores    | Expulsar / bloquear        | Transferir |
 * |-------------|----------------|----------------------------|------------|
 * | Dueño       | nombrar/quitar | a cualquiera menos a sí    | sí         |
 * | Superadmin  | nombrar/quitar | a cualquiera menos al dueño| no         |
 * | Moderador   | —              | solo a miembros comunes    | no         |
 */
export function ModerationMembersSection({
  community,
  viewerRole,
  currentUserId,
}: {
  community: CommunityDetail
  viewerRole: MembersViewerRole
  currentUserId: string | undefined
}) {
  const { t } = useLanguage()
  const [view, setView] = useState<'members' | 'bans'>('members')

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-mynted-ink">{t('moderation.tabs.members')}</h2>
          <p className={hintClasses}>{t('moderation.members.subtitle')}</p>
        </div>
        <div className="flex rounded-xl bg-mynted-bg p-1" role="tablist">
          {(['members', 'bans'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cx(
                'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                view === id ? 'bg-white text-mynted-ink shadow-sm' : 'text-mynted-gray hover:text-mynted-ink',
              )}
            >
              {t(id === 'members' ? 'moderation.members.view.members' : 'moderation.members.view.bans')}
            </button>
          ))}
        </div>
      </div>

      {view === 'members' ? (
        <MembersList community={community} viewerRole={viewerRole} currentUserId={currentUserId} />
      ) : (
        <BansList community={community} />
      )}
    </section>
  )
}

function MembersList({
  community,
  viewerRole,
  currentUserId,
}: {
  community: CommunityDetail
  viewerRole: MembersViewerRole
  currentUserId: string | undefined
}) {
  const { t, language } = useLanguage()
  const [page, setPage] = useState(1)
  const [role, setRole] = useState<CommunityMemberRole | ''>('')
  const [search, setSearch] = useState('')
  // La búsqueda va al servidor: se espera a que deje de escribir un instante.
  const deferredSearch = useDeferredValue(search.trim())
  const members = useCommunityMembers(community.id, {
    page,
    limit: PAGE_SIZE,
    ...(role && { role }),
    ...(deferredSearch && { search: deferredSearch }),
  })
  const actions = useCommunityMemberActions(community.id)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const rows = members.data?.data ?? []
  const pagination = members.data?.pagination

  const canManageRoles = viewerRole === 'owner' || viewerRole === 'superadmin'
  const canAct = (member: CommunityMember) =>
    member.userId !== currentUserId &&
    member.role !== 'owner' &&
    (viewerRole !== 'moderator' || member.role === 'member')

  const mutationFor = (kind: PendingAction['kind']) =>
    ({
      promote: actions.addModerator,
      demote: actions.removeModerator,
      transfer: actions.transfer,
      expel: actions.expel,
      ban: actions.ban,
      unban: actions.unban,
    })[kind]
  const active = pending ? mutationFor(pending.kind) : null
  const translatedError = active?.isError ? new Error(t(actionErrorKey(active.error))) : null

  function open(next: PendingAction) {
    mutationFor(next.kind).reset()
    setPending(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">{t('moderation.members.search')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mynted-gray" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('moderation.members.search')}
            className="h-9 w-full rounded-lg border border-mynted-border bg-white pr-3 pl-9 text-sm text-mynted-ink outline-none placeholder:text-mynted-gray-light focus:border-mynted-orange"
          />
        </label>
        <FilterSelect<CommunityMemberRole | ''>
          label={t('moderation.members.filter.role')}
          value={role}
          onChange={(next) => {
            setRole(next)
            setPage(1)
          }}
          options={[
            { value: '', label: t('moderation.members.filter.all') },
            { value: 'owner', label: t(ROLE_LABEL.owner) },
            { value: 'moderator', label: t(ROLE_LABEL.moderator) },
            { value: 'member', label: t(ROLE_LABEL.member) },
          ]}
        />
      </div>

      {members.isPending && (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-mynted-bg" />
          ))}
        </div>
      )}

      {members.isError && (
        <ErrorState kind="error" variant="compact" description={t('moderation.members.loadError')}>
          <Button type="button" size="sm" variant="secondary" onClick={() => void members.refetch()}>
            {t('communities.list.retry')}
          </Button>
        </ErrorState>
      )}

      {members.isSuccess && rows.length === 0 && (
        <ErrorState kind="empty" variant="compact" description={t('moderation.members.empty')} />
      )}

      {rows.length > 0 && (
        <ul className={cx('flex flex-col gap-2.5', members.isPlaceholderData && 'opacity-60')}>
          {rows.map((member) => {
            const actable = canAct(member)
            return (
              <li key={member.communityProfileId} className="flex flex-wrap items-center gap-3 rounded-xl border border-mynted-border bg-white px-3.5 py-2.5">
                <Avatar src={member.photoUrl} name={member.displayName || member.username} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-mynted-ink">{member.displayName || member.username}</span>
                    <StatusPill tone={ROLE_TONE[member.role]}>{t(ROLE_LABEL[member.role])}</StatusPill>
                    {member.userId === currentUserId && <span className="text-xs text-mynted-gray">{t('moderation.members.you')}</span>}
                  </p>
                  <p className="truncate text-xs text-mynted-gray">
                    @{member.username} · {t('moderation.members.joined', { date: formatShortDate(member.joinedAt, language) })}
                  </p>
                  <p className="text-xs text-mynted-gray">
                    {t('moderation.members.activity', { posts: member.postCount, replies: member.replyCount })}
                    {member.hiddenContentCount > 0 && (
                      <span className="font-semibold text-red-600"> · {t('moderation.members.hidden', { count: member.hiddenContentCount })}</span>
                    )}
                  </p>
                </div>

                {actable && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    {canManageRoles &&
                      (member.role === 'member' ? (
                        <IconAction icon={Shield} label={t('moderation.members.action.promote')} onPress={() => open({ kind: 'promote', member })} />
                      ) : (
                        <IconAction icon={ShieldOff} label={t('moderation.members.action.demote')} onPress={() => open({ kind: 'demote', member })} />
                      ))}
                    {viewerRole === 'owner' && (
                      <IconAction icon={Crown} label={t('moderation.members.action.transfer')} onPress={() => open({ kind: 'transfer', member })} />
                    )}
                    <IconAction icon={UserMinus} label={t('moderation.members.action.expel')} tone="danger" onPress={() => open({ kind: 'expel', member })} />
                    <IconAction icon={Ban} label={t('moderation.members.action.ban')} tone="danger" onPress={() => open({ kind: 'ban', member })} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <AdminPageFooter page={page} limit={PAGE_SIZE} total={pagination.total} totalPages={pagination.totalPages} onChange={setPage} />
      )}

      {pending && (pending.kind === 'promote' || pending.kind === 'demote' || pending.kind === 'transfer') && (
        <ConfirmDialog
          open
          title={t(ACTION_TEXT[pending.kind].title, { name: pending.member.displayName || pending.member.username })}
          description={t(ACTION_TEXT[pending.kind].description)}
          confirmLabel={t(ACTION_TEXT[pending.kind].confirm)}
          tone={pending.kind === 'demote' ? 'danger' : 'primary'}
          isPending={active?.isPending ?? false}
          error={translatedError}
          onClose={() => setPending(null)}
          onConfirm={() => {
            const done = { onSuccess: () => setPending(null) }
            const profileId = pending.member.communityProfileId
            if (pending.kind === 'promote') actions.addModerator.mutate(profileId, done)
            else if (pending.kind === 'demote') actions.removeModerator.mutate(profileId, done)
            else actions.transfer.mutate(profileId, done)
          }}
        />
      )}

      {pending && (pending.kind === 'expel' || pending.kind === 'ban') && (
        <ConfirmWithReasonDialog
          open
          title={t(ACTION_TEXT[pending.kind].title, { name: pending.member.displayName || pending.member.username })}
          description={t(ACTION_TEXT[pending.kind].description)}
          confirmLabel={t(ACTION_TEXT[pending.kind].confirm)}
          isPending={active?.isPending ?? false}
          error={translatedError}
          onClose={() => setPending(null)}
          onConfirm={(reason) => {
            const done = { onSuccess: () => setPending(null) }
            if (pending.kind === 'expel') actions.expel.mutate({ profileId: pending.member.communityProfileId, reason }, done)
            else actions.ban.mutate({ userId: pending.member.userId, reason }, done)
          }}
        />
      )}

    </div>
  )
}

function BansList({ community }: { community: CommunityDetail }) {
  const { t, language } = useLanguage()
  const [page, setPage] = useState(1)
  const bans = useCommunityBans(community.id, { page, limit: PAGE_SIZE })
  const { unban } = useCommunityMemberActions(community.id)
  const [pending, setPending] = useState<CommunityBan | null>(null)

  const rows = bans.data?.data ?? []
  const pagination = bans.data?.pagination

  return (
    <div className="flex flex-col gap-4">
      {bans.isPending && <div className="h-16 animate-pulse rounded-xl bg-mynted-bg" />}

      {bans.isError && (
        <ErrorState kind="error" variant="compact" description={t('moderation.members.bansLoadError')}>
          <Button type="button" size="sm" variant="secondary" onClick={() => void bans.refetch()}>
            {t('communities.list.retry')}
          </Button>
        </ErrorState>
      )}

      {bans.isSuccess && rows.length === 0 && (
        <ErrorState kind="empty" variant="compact" description={t('moderation.members.bansEmpty')} />
      )}

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {rows.map((ban) => {
            const name = ban.displayName || ban.username || t('moderation.members.unknownUser')
            return (
              <li key={ban.banId} className="flex flex-wrap items-center gap-3 rounded-xl border border-mynted-border bg-white px-3.5 py-2.5">
                <Avatar src={ban.photoUrl} name={name} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sm font-semibold text-mynted-ink">{name}</p>
                  <p className="truncate text-xs text-mynted-gray">
                    {t('moderation.members.bannedBy', {
                      date: formatShortDate(ban.bannedAt, language),
                      by: ban.bannedBy.username ?? t('moderation.members.unknownUser'),
                    })}
                  </p>
                  <p className="line-clamp-2 text-xs text-mynted-ink">{ban.reason}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    unban.reset()
                    setPending(ban)
                  }}
                >
                  {t('moderation.members.action.unban')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 && (
        <AdminPageFooter page={page} limit={PAGE_SIZE} total={pagination.total} totalPages={pagination.totalPages} onChange={setPage} />
      )}

      {pending && (
        <ConfirmDialog
          open
          title={t('moderation.members.unban.title', { name: pending.displayName || pending.username || '' })}
          description={t('moderation.members.unban.description')}
          confirmLabel={t('moderation.members.action.unban')}
          tone="primary"
          isPending={unban.isPending}
          error={unban.isError ? new Error(t(actionErrorKey(unban.error))) : null}
          onClose={() => setPending(null)}
          onConfirm={() => unban.mutate(pending.userId, { onSuccess: () => setPending(null) })}
        />
      )}
    </div>
  )
}
