import { useState } from 'react'
import { ProfileFeedFrame } from '@/features/community/components/profile/ProfileFeedFrame'
import { BENTO_GRID_CLASS, TILE_MIN_HEIGHT } from '@/features/community/components/feed/bentoLayout'
import { EAGER_ITEM_COUNT, StaggerItem } from '@/components/ui/ScrollReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { useMyFavorites } from '../hooks/useFavoritesQueries'
import { FAVORITES_FILTERS, type FavoriteEntry, type FavoritesFilter } from '../models/favorites'
import { FavoritePostCard } from './FavoritePostCard'
import { FavoriteProductCard } from './FavoriteProductCard'

const FILTER_LABEL: Record<FavoritesFilter, TranslationKey> = {
  all: 'favorites.filter.all',
  posts: 'favorites.filter.posts',
  products: 'favorites.filter.products',
}

const EMPTY_COPY: Record<FavoritesFilter, { title: TranslationKey; subtitle: TranslationKey }> = {
  all: { title: 'profile.tabs.favoritesEmptyTitle', subtitle: 'profile.tabs.favoritesEmptySubtitle' },
  posts: { title: 'favorites.empty.postsTitle', subtitle: 'favorites.empty.postsSubtitle' },
  products: { title: 'favorites.empty.productsTitle', subtitle: 'favorites.empty.productsSubtitle' },
}

/**
 * Pestaña "Favoritos" del perfil (wireframe "Favorites — Neutral Redesign"):
 * sub-pestañas Todo / Publicaciones / Tienda sobre GET /favorites/me?type=,
 * y un bento grid donde los productos ocupan dos filas (foto grande) y los
 * posts alternan entre ancho doble y normal.
 */
export function MyFavoritesTab() {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<FavoritesFilter>('all')
  const query = useMyFavorites(filter)
  const entries = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label={t('favorites.filter.label')} className="flex flex-wrap items-center gap-2">
        {FAVORITES_FILTERS.map((id) => {
          const isActive = filter === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(id)}
              className={`cursor-pointer rounded-[10px] px-5 py-2.5 font-heading text-[15px] font-semibold transition-colors ${
                isActive ? 'bg-mynted-orange text-white' : 'text-mynted-gray hover:text-mynted-ink'
              }`}
            >
              {t(FILTER_LABEL[id])}
            </button>
          )
        })}
      </div>

      <div role="tabpanel">
        <ProfileFeedFrame
          query={query}
          isEmpty={entries.length === 0}
          emptyTitle={EMPTY_COPY[filter].title}
          emptySubtitle={EMPTY_COPY[filter].subtitle}
        >
          <FavoritesBentoGrid entries={entries} />
        </ProfileFeedFrame>
      </div>
    </div>
  )
}

/** Posición de cada post entre los posts (0, 1, 2…), para alternar ancho doble / normal. */
function getPostOrdinals(entries: FavoriteEntry[]): number[] {
  const ordinals: number[] = []
  let posts = 0
  for (const entry of entries) {
    ordinals.push(posts)
    if (entry.type === 'post') posts += 1
  }
  return ordinals
}

function FavoritesBentoGrid({ entries }: { entries: FavoriteEntry[] }) {
  const postOrdinals = getPostOrdinals(entries)

  return (
    <ul className={BENTO_GRID_CLASS}>
      {entries.map((entry, index) => {
        if (entry.type === 'product') {
          return (
            <StaggerItem
              key={`product-${entry.product.id}`}
              index={index}
              eager={index < EAGER_ITEM_COUNT}
              className="flex min-h-[320px] lg:row-span-2"
            >
              <FavoriteProductCard product={entry.product} />
            </StaggerItem>
          )
        }

        const span = (postOrdinals[index] ?? 0) % 2 === 0 ? 'lg:col-span-2' : ''
        return (
          <StaggerItem
            key={`post-${entry.post.id}`}
            index={index}
            eager={index < EAGER_ITEM_COUNT}
            className={`flex ${span} ${TILE_MIN_HEIGHT}`}
          >
            <FavoritePostCard post={entry.post} />
          </StaggerItem>
        )
      })}
    </ul>
  )
}
