import { Link } from '@tanstack/react-router'
import { MessageSquare, UsersRound } from 'lucide-react'
import type { PublicUser } from '@/features/auth/models/auth'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { ProductPrice } from '@/features/products/components/ProductPrice'
import type { ProductListItem } from '@/features/products/models/product'
import { getInitials } from '@/features/profile/utils/profileFormat'
import { useLanguage } from '@/i18n/LanguageContext'
import type { SearchCommunity } from '../models/search'

/**
 * Filas de resultado de la búsqueda, compartidas por el desplegable del
 * header (compactas) y la página /search. `onNavigate` deja que el desplegable
 * se cierre al elegir un resultado.
 */
interface RowProps {
  onNavigate?: () => void
}

const ROW_CLASS =
  'flex items-center gap-3 rounded-xl px-2.5 py-2 text-left outline-none transition-colors hover:bg-mynted-bg focus-visible:bg-mynted-bg focus-visible:ring-2 focus-visible:ring-mynted-blue-mid/40'

function Thumb({ src, fallback, round = false }: { src: string | null | undefined; fallback: React.ReactNode; round?: boolean }) {
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center overflow-hidden bg-mynted-bg text-xs font-semibold text-mynted-gray ${
        round ? 'rounded-full' : 'rounded-lg'
      }`}
    >
      {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : fallback}
    </span>
  )
}

export function ProductResultRow({ product, onNavigate }: RowProps & { product: ProductListItem }) {
  return (
    <Link to="/products/$productId" params={{ productId: String(product.id) }} onClick={onNavigate} className={ROW_CLASS}>
      <Thumb src={product.imageUrl} fallback={null} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-mynted-ink">{product.title}</span>
        <ProductPrice
          price={product.price}
          finalPrice={product.finalPrice}
          discountPercent={product.discountPercent}
          currency={product.currency}
          showBadge={false}
          className="text-xs font-semibold text-mynted-orange"
        />
      </span>
    </Link>
  )
}

export function CommunityResultRow({ community, onNavigate }: RowProps & { community: SearchCommunity }) {
  return (
    <Link to="/communities/$slug" params={{ slug: community.slug }} onClick={onNavigate} className={ROW_CLASS}>
      <Thumb src={community.imageUrl} fallback={<UsersRound className="size-4" aria-hidden="true" />} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-mynted-ink">{community.name}</span>
        {community.description && <span className="truncate text-xs text-mynted-gray">{community.description}</span>}
      </span>
    </Link>
  )
}

export function UserResultRow({ user, onNavigate }: RowProps & { user: PublicUser }) {
  const { t } = useLanguage()
  return (
    // El perfil público acepta el username en la ruta (/users/keishi).
    <Link to="/users/$userId" params={{ userId: user.username }} onClick={onNavigate} className={ROW_CLASS}>
      <Thumb src={user.photoUrl} fallback={getInitials(user.username)} round />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-mynted-ink">@{user.username}</span>
        {user.seller && <span className="truncate text-xs text-mynted-gray">{t('userProfile.sellerBadge')}</span>}
      </span>
    </Link>
  )
}

export function PostResultRow({ post, onNavigate }: RowProps & { post: FeedPost }) {
  const content = (
    <>
      <Thumb src={post.images[0]?.url} fallback={<MessageSquare className="size-4" aria-hidden="true" />} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-mynted-ink">{post.title}</span>
        {post.community && <span className="truncate text-xs text-mynted-gray">{post.community.name}</span>}
      </span>
    </>
  )
  // Sin comunidad no hay a dónde enlazar el post.
  if (!post.community) return <div className={ROW_CLASS}>{content}</div>
  return (
    <Link
      to="/communities/$slug/posts/$postId"
      params={{ slug: post.community.slug, postId: String(post.id) }}
      onClick={onNavigate}
      className={ROW_CLASS}
    >
      {content}
    </Link>
  )
}
