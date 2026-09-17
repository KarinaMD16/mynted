import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import type { CommunityListItem } from '../models/communityDTOs'


interface ExploreCommunityCardProps {
  community: CommunityListItem
  dotClassName: string
}

export function ExploreCommunityCard({ community, dotClassName }: ExploreCommunityCardProps) {
  const { t } = useLanguage()
  const cover = community.bannerUrl ?? community.imageUrl

  return (
    <Link
      to="/communities/$communityId"
      params={{ communityId: String(community.id) }}
      aria-label={t('community.card.open', { name: community.name })}
      className="group flex flex-col overflow-hidden rounded-xl border border-mynted-border bg-white transition-transform hover:scale-[1.02]"
    >
      <div className="aspect-square w-full overflow-hidden bg-mynted-bg">
        {cover ? (
          <img
            src={cover}
            alt={t('communities.card.bannerAlt', { name: community.name })}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-heading text-2xl font-semibold text-mynted-gray-light">
            {community.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <span className={`size-1.5 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />
        <h3 className="truncate text-[11px] font-medium text-mynted-ink">{community.name}</h3>
      </div>
    </Link>
  )
}
