import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import type { CommunityListItem } from '../models/communityDTOs'
import { CommunityPattern } from './CommunityPattern'


interface ExploreCommunityCardProps {
  community: CommunityListItem
  dotClassName: string
}

export function ExploreCommunityCard({ community, dotClassName }: ExploreCommunityCardProps) {
  const { t } = useLanguage()

  return (
    <Link
      to="/communities/$communityId"
      params={{ communityId: String(community.id) }}
      aria-label={t('community.card.open', { name: community.name })}
      className="group flex flex-col overflow-hidden rounded-xl border border-mynted-border bg-white transition-transform hover:scale-[1.02]"
    >
      <div className="aspect-square w-full overflow-hidden bg-mynted-bg">
        {community.imageUrl ? (
          <img
            src={community.imageUrl}
            alt={t('communities.card.imageAlt', { name: community.name })}
            className="h-full w-full object-cover"
          />
        ) : (
          // Sin foto de perfil: de fondo el banner (o el patron si tampoco hay)
          // y la inicial encima, en lugar de la foto
          <div className="relative h-full w-full">
            {community.bannerUrl ? (
              <img
                src={community.bannerUrl}
                alt={t('communities.card.bannerAlt', { name: community.name })}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <CommunityPattern seed={community.id} className="absolute inset-0" />
            )}
            <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white font-heading text-lg font-semibold text-mynted-ink shadow-sm">
              {community.name.charAt(0).toUpperCase()}
            </span>
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
