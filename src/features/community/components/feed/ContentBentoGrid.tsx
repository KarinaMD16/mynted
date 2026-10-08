import { Link } from '@tanstack/react-router'
import { Repeat, Tag } from 'lucide-react'
import { EAGER_ITEM_COUNT, StaggerItem } from '@/components/ui/ScrollReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatRelativeTime } from '@/utils/relativeTime'
import { formatPrice } from '@/utils/formatPrice'
import type { TranslationKey } from '@/i18n/translations/es'
import type { FeedPost, MyContentEntry, MyContentProduct } from '@/features/community/models/communityDTOs'
import { AVATAR_COLORS } from '@/features/community/types/DEFAULT_VALUES'
import { PostStats } from '../cards/PostStats'
import { BENTO_GRID_CLASS, TILE_MIN_HEIGHT, getBentoSlot, type TileSize } from './bentoLayout'

/** Fondos de los posts sin foto, rotando por posición. `dark` indica si el texto va en blanco. */
const TEXT_TILE_THEMES = [
  { surface: 'bg-white border border-mynted-border', dark: false },
  { surface: 'bg-mynted-blue', dark: true },
  { surface: 'bg-mynted-yellow', dark: false },
  { surface: 'bg-[#ffdfd1]', dark: false },
  { surface: 'bg-mynted-blue-dark', dark: true },
]

const TITLE_CLASS: Record<TileSize, string> = {
  hero: 'text-2xl line-clamp-3 sm:text-[28px] sm:leading-tight',
  wide: 'text-lg line-clamp-2',
  tall: 'text-lg line-clamp-4',
  small: 'text-base line-clamp-2',
}

const BODY_CLASS: Record<TileSize, string> = {
  hero: 'line-clamp-4 text-[15px]',
  wide: 'line-clamp-1 text-sm',
  tall: 'line-clamp-6 text-sm',
  small: 'hidden',
}

/** Posts y productos propios mezclados (GET /posts/me) en un bento grid. */
export function ContentBentoGrid({ entries }: { entries: MyContentEntry[] }) {
  return (
    <ul className={BENTO_GRID_CLASS}>
      {entries.map((entry, index) => {
        const { size, span } = getBentoSlot(index)
        return (
          <StaggerItem
            key={entry.type === 'post' ? `post-${entry.post.id}` : `product-${entry.product.id}`}
            index={index}
            eager={index < EAGER_ITEM_COUNT}
            className={`flex ${span} ${TILE_MIN_HEIGHT}`}
          >
            {entry.type === 'post' ? (
              <BentoTile post={entry.post} size={size} index={index} />
            ) : (
              <BentoProductTile product={entry.product} size={size} />
            )}
          </StaggerItem>
        )
      })}
    </ul>
  )
}

function BentoTile({ post, size, index }: { post: FeedPost; size: TileSize; index: number }) {
  const { language } = useLanguage()
  const cover = post.images[0]
  const theme = TEXT_TILE_THEMES[index % TEXT_TILE_THEMES.length]
  const onDark = Boolean(cover) || theme.dark

  const titleColor = onDark ? 'text-white' : 'text-mynted-ink'
  const bodyColor = onDark ? 'text-white/85' : 'text-mynted-ink/70'
  const mutedColor = onDark ? 'text-white/80' : 'text-mynted-ink/60'

  return (
    <article
      className={`relative flex w-full flex-col justify-between gap-3 overflow-hidden rounded-3xl p-5 ${
        cover ? 'bg-mynted-ink' : theme.surface
      }`}
    >
      {cover && (
        <>
          <img
            src={cover.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" aria-hidden="true" />
        </>
      )}

      <header className="relative flex items-start justify-between gap-3">
        {post.community ? (
          <Link
            to="/communities/$slug"
            params={{ slug: post.community.slug }}
            className={`max-w-[70%] truncate rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
              onDark ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-mynted-ink/5 text-mynted-ink hover:bg-mynted-ink/10'
            }`}
          >
            {post.community.name}
          </Link>
        ) : (
          <span />
        )}
        {post.images.length > 1 && (
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
            +{post.images.length - 1}
          </span>
        )}
      </header>

      <div className="relative flex flex-col gap-2">
        <h3 className={`font-heading font-semibold ${TITLE_CLASS[size]} ${titleColor}`}>{post.title}</h3>
        <p className={`${BODY_CLASS[size]} ${bodyColor}`}>{post.body}</p>
        {(size === 'hero' || size === 'tall') && post.tags.length > 0 && (
          <p className={`line-clamp-1 text-xs ${mutedColor}`}>{post.tags.map((tag) => `#${tag.name}`).join(' ')}</p>
        )}
      </div>

      <footer className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AuthorAvatar post={post} index={index} />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className={`truncate text-xs font-semibold ${titleColor}`}>
              {post.author?.displayName ?? '—'}
            </span>
            <time dateTime={post.postedAt} className={`text-[11px] ${mutedColor}`}>
              {formatRelativeTime(post.postedAt, language)}
            </time>
          </div>
        </div>
        <PostStats post={post} onImage={onDark} className={size === 'small' ? 'hidden sm:flex' : ''} />
      </footer>
    </article>
  )
}

function AuthorAvatar({ post, index }: { post: FeedPost; index: number }) {
  const name = post.author?.displayName ?? '?'
  if (post.author?.photoUrl) {
    return <img src={post.author.photoUrl} alt="" loading="lazy" className="size-8 shrink-0 rounded-full object-cover" />
  }
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        AVATAR_COLORS[index % AVATAR_COLORS.length]
      }`}
      aria-hidden="true"
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

const CONDITION_LABEL: Record<MyContentProduct['condition'], TranslationKey> = {
  new: 'products.condition.new',
  like_new: 'products.condition.likeNew',
  good_condition: 'products.condition.good',
  used_with_details: 'products.condition.usedWithDetails',
}

const STATUS_LABEL: Record<Exclude<MyContentProduct['status'], 'active'>, TranslationKey> = {
  sold: 'products.status.sold',
  inactive: 'products.status.inactive',
}

/** Producto propio: siempre tiene foto, así que va a sangre con el título y el precio encima. */
function BentoProductTile({ product, size }: { product: MyContentProduct; size: TileSize }) {
  const { t, language } = useLanguage()
  const isExchange = product.type === 'exchange'

  return (
    <article className="group relative flex w-full flex-col justify-between gap-3 overflow-hidden rounded-3xl bg-mynted-ink p-5">
      <img
        src={product.imageUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" aria-hidden="true" />
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        aria-label={product.title}
        className="absolute inset-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mynted-blue"
      />

      <header className="pointer-events-none relative flex items-start justify-between gap-2">
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
            isExchange ? 'bg-mynted-blue-mid text-white' : 'bg-white/95 text-mynted-ink'
          }`}
        >
          {isExchange ? <Repeat className="size-3.5" aria-hidden="true" /> : <Tag className="size-3.5" aria-hidden="true" />}
          {t(isExchange ? 'products.type.exchange' : 'products.type.sale')}
        </span>
        {product.status !== 'active' && (
          <span className="rounded-full bg-mynted-ink/85 px-2.5 py-1 text-xs font-semibold text-white">
            {t(STATUS_LABEL[product.status])}
          </span>
        )}
      </header>

      <div className="pointer-events-none relative flex flex-col gap-1.5">
        <h3 className={`font-heading font-semibold text-white ${TITLE_CLASS[size]}`}>{product.title}</h3>
        {(size === 'hero' || size === 'tall') && (
          <p className="text-sm text-white/85">{t(CONDITION_LABEL[product.condition])}</p>
        )}
      </div>

      <footer className="pointer-events-none relative flex items-end justify-between gap-3">
        <span className="flex flex-col leading-tight">
          {isExchange && <span className="text-[11px] text-white/80">{t('products.card.referenceValue')}</span>}
          <span className="font-heading text-lg font-semibold text-white">
            {formatPrice(product.price, product.currency, language)}
          </span>
        </span>
        <span className="max-w-[50%] truncate rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {product.community.name}
        </span>
      </footer>
    </article>
  )
}
