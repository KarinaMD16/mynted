import type { ReactNode } from 'react'
import {
  Button as AriaButton,
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
} from 'react-aria-components'
import { ExternalLink, MousePointerClick } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { UserRole } from '@/features/auth/models/auth'
import type { CommunityListItem } from '@/features/community/models/communityDTOs'
import { formatShortDate } from '@/utils/relativeTime'
import { Avatar, StatusPill, type PillTone } from './AdminUi'
import type { AdminUser } from '../models/admin'

/**
 * Nombres con tarjeta de resumen al pasar el mouse (o al llegar con Tab),
 * para los listados del tab "Resumen" del panel de superadmin. La tarjeta
 * aparece tras una pequeña demora para no saltar al mover el mouse por la
 * lista, y se cierra sola al salir. Al hacer clic:
 *
 * - usuario: abre el panel de revisión completo (UserReviewDrawer);
 * - comunidad: abre la página de la comunidad en una pestaña nueva.
 */

const ROLE_LABEL: Record<UserRole, TranslationKey> = {
  user: 'admin.users.role.user',
  seller: 'admin.users.role.seller',
  superadmin: 'admin.users.role.superadmin',
}
const ROLE_TONE: Record<UserRole, PillTone> = { user: 'gray', seller: 'blue', superadmin: 'orange' }

const OPEN_DELAY_MS = 350
const CLOSE_DELAY_MS = 120

const nameClass =
  'max-w-full cursor-pointer truncate rounded text-left text-sm font-medium text-mynted-ink underline decoration-mynted-border decoration-dotted underline-offset-4 outline-none transition-colors hover:text-mynted-orange hover:decoration-mynted-orange focus-visible:outline-2 focus-visible:outline-mynted-blue-mid'

function SummaryCard({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <AriaTooltip
      placement="right"
      offset={12}
      className={({ isEntering, isExiting }) =>
        [
          'w-80 overflow-hidden rounded-2xl border border-mynted-border bg-white shadow-xl outline-none',
          isEntering && 'duration-150 ease-out animate-in fade-in zoom-in-95',
          isExiting && 'duration-100 ease-in animate-out fade-out zoom-out-95',
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      <div className="p-4">{children}</div>
      <div className="flex items-center gap-1.5 border-t border-mynted-border bg-mynted-bg/60 px-4 py-2 text-xs text-mynted-gray">
        {footer}
      </div>
    </AriaTooltip>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-xs">
      <dt className="text-mynted-gray">{label}</dt>
      <dd className="min-w-0 truncate text-mynted-ink">{children}</dd>
    </div>
  )
}

export function UserHoverName({ user, onOpen }: { user: AdminUser; onOpen: () => void }) {
  const { t, language } = useLanguage()
  const seller = user.sellerRequestStatus

  return (
    <AriaTooltipTrigger delay={OPEN_DELAY_MS} closeDelay={CLOSE_DELAY_MS}>
      <AriaButton onPress={onOpen} className={nameClass}>
        {user.username}
      </AriaButton>
      <SummaryCard
        footer={
          <>
            <MousePointerClick className="size-3.5" aria-hidden="true" />
            {t('admin.hover.clickToReview')}
          </>
        }
      >
        <div className="flex items-center gap-3">
          <Avatar src={user.photoUrl} name={user.username} />
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-mynted-ink">{user.username}</p>
            <p className="truncate text-xs text-mynted-gray">{user.email}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusPill tone={ROLE_TONE[user.role]}>{t(ROLE_LABEL[user.role])}</StatusPill>
          {user.isActive ? (
            <StatusPill tone="violet">{t('admin.users.status.active')}</StatusPill>
          ) : (
            <StatusPill tone="teal">{t('admin.users.status.inactive')}</StatusPill>
          )}
          {seller === 'pending' && <StatusPill tone="amber">{t('admin.sellers.status.pending')}</StatusPill>}
        </div>

        {user.bio && <p className="mt-3 line-clamp-3 text-sm text-mynted-ink">{user.bio}</p>}

        <dl className="mt-3 flex flex-col gap-1.5">
          <Row label={t('admin.review.location')}>{user.location || t('admin.review.noLocation')}</Row>
          <Row label={t('admin.review.memberSince')}>{formatShortDate(user.createdAt, language)}</Row>
          <Row label={t('admin.review.seller')}>
            {seller === 'none'
              ? t('admin.hover.noSellerRequest')
              : t(
                  seller === 'pending'
                    ? 'admin.sellers.status.pending'
                    : seller === 'approved'
                      ? 'admin.sellers.status.approved'
                      : 'admin.sellers.status.rejected',
                )}
          </Row>
        </dl>
      </SummaryCard>
    </AriaTooltipTrigger>
  )
}

export function CommunityHoverName({ community }: { community: CommunityListItem }) {
  const { t, language } = useLanguage()

  return (
    <AriaTooltipTrigger delay={OPEN_DELAY_MS} closeDelay={CLOSE_DELAY_MS}>
      {/* Es un botón (no un <a>) porque TooltipTrigger de react-aria solo
          engancha la tarjeta sobre componentes que lo soportan; abre la
          comunidad en una pestaña nueva igual que un link con target="_blank". */}
      <AriaButton
        onPress={() => window.open(`/communities/${community.slug}`, '_blank', 'noopener,noreferrer')}
        className={nameClass}
      >
        {community.name}
      </AriaButton>
      <SummaryCard
        footer={
          <>
            <ExternalLink className="size-3.5" aria-hidden="true" />
            {t('admin.hover.clickToOpen')}
          </>
        }
      >
        {community.bannerUrl && (
          <img src={community.bannerUrl} alt="" className="-mx-4 -mt-4 mb-3 h-20 w-[calc(100%+2rem)] max-w-none object-cover" />
        )}
        <div className="flex items-center gap-3">
          <Avatar src={community.imageUrl} name={community.name} square />
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-mynted-ink">{community.name}</p>
            <p className="truncate text-xs text-mynted-gray">@{community.slug}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {community.isPrivate ? (
            <StatusPill tone="amber">{t('communities.card.private')}</StatusPill>
          ) : (
            <StatusPill tone="teal">{t('communities.card.public')}</StatusPill>
          )}
          <StatusPill tone="gray">{community.category?.name ?? t('admin.communities.noCategory')}</StatusPill>
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-mynted-ink">
          {community.description || <span className="text-mynted-gray-light italic">{t('admin.hover.noDescription')}</span>}
        </p>

        <dl className="mt-3 flex flex-col gap-1.5">
          <Row label={t('admin.communities.columns.members')}>{community.memberCount.toLocaleString(language)}</Row>
          <Row label={t('moderation.stats.recentPosts')}>{community.recentPostCount.toLocaleString(language)}</Row>
          <Row label={t('admin.communities.columns.created')}>{formatShortDate(community.createdAt, language)}</Row>
        </dl>
      </SummaryCard>
    </AriaTooltipTrigger>
  )
}

