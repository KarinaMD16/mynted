import { Link } from '@tanstack/react-router'
import { useLanguage } from '@/i18n/LanguageContext'
import type { MyCommunityCardProps } from '../types/CommunityTypes'
import { variantClasses } from '../types/DEFAULT_VALUES'


export function MyCommunityCard({ community, featured = false, variant }: MyCommunityCardProps) {
  const { t } = useLanguage()
  const colors = variantClasses[variant]

  return (
    <Link
      to="/communities/$communityId"
      params={{ communityId: String(community.id) }}
      aria-label={t('community.card.open', { name: community.name })}
      className={`relative flex h-full flex-col justify-end overflow-hidden rounded-2xl p-6 transition-transform hover:scale-[1.01] ${colors.card} ${
        featured ? 'min-h-56 lg:min-h-full' : 'min-h-40'
      }`}
    >
      {community.imageUrl ? (
        <img
          src={community.imageUrl}
          alt={t('communities.card.imageAlt', { name: community.name })}
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 bottom-0 object-contain ${
            featured ? 'h-4/4 max-w-[45%]' : 'h-full max-w-[100%]'
          }`}
        />
      ) : (
        // Sin foto de perfil: la inicial. El patron es solo para el banner.
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 right-0 h-full ${featured ? 'w-[45%]' : 'w-[35%]'}`}
        >
          <span
            className={`absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white font-heading font-semibold text-mynted-ink shadow-sm ${
              featured ? 'size-16 text-2xl' : 'size-11 text-lg'
            }`}
          >
            {community.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className={`relative flex flex-col gap-2 ${featured ? 'max-w-[55%]' : 'max-w-[65%]'}`}>
        <span className="w-fit rounded-full bg-mynted-orange px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
          {t('communities.joined')}
        </span>

        <h3 className={`font-heading text-xl font-semibold ${colors.title}`}>{community.name}</h3>
        <p className={`line-clamp-3 text-sm ${colors.description}`}>{community.description}</p>
      </div>
    </Link>
  )
}
