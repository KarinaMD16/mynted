import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { getHttpStatus, isNotFoundError } from '@/api/apiError'
import { ErrorState } from '@/components/errors/ErrorState'
import { Rating } from '@/components/ui/Rating'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { ChatDock, ChatSheet } from '@/features/chat/components/ChatSheet'
import { useOpenConversation } from '@/features/chat/hooks/useChatMutations'
import { CHAT_DOCK_CSS_TRANSITION } from '@/features/chat/utils/chatDock'
import { CommunitiesForTagSection } from '@/features/community/components/sections/CommunitiesForTagSection'
import { ProductFavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { ProductGallery } from '@/features/products/components/ProductGallery'
import { ProductPrice } from '@/features/products/components/ProductPrice'
import { ProductReviews } from '@/features/products/components/ProductReviews'
import { useRecordProductViewMutation } from '@/features/products/hooks/useProductMutations'
import { useIsOwnProduct, useProduct, useRecommendedProducts, useRelatedProducts } from '@/features/products/hooks/useProductQueries'
import type {
  ProductCondition,
  ProductDetail,
  ProductListItem,
  ProductStatus,
  RelatedProduct,
} from '@/features/products/models/product'
import { getInitials } from '@/features/profile/utils/profileFormat'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { regionFlag, regionName } from '@/utils/locale'
import { cx } from '@/utils/cx'
import { readRecentProductIds, rememberRecentProduct } from '@/utils/recentProducts'
import { SiteHeader } from '../components/layout/SiteHeader'

const CONDITION_LABEL: Record<ProductCondition, TranslationKey> = {
  new: 'products.condition.new',
  like_new: 'products.condition.likeNew',
  good_condition: 'products.condition.good',
  used_with_details: 'products.condition.usedWithDetails',
}

/** Aviso para los estados en los que el producto no se puede comprar. */
const STATUS_NOTICE: Partial<Record<ProductStatus, TranslationKey>> = {
  draft: 'itemDetail.notice.draft',
  inactive: 'itemDetail.notice.inactive',
  sold: 'itemDetail.notice.sold',
}

/** Por qué no se pudo abrir el chat (POST /conversations), según el status. */
function contactErrorKey(error: unknown): TranslationKey {
  switch (getHttpStatus(error)) {
    case 400:
      return 'chat.contact.unavailable'
    case 403:
      return 'chat.contact.ownProduct'
    case 404:
      return 'chat.contact.notFound'
    default:
      return 'chat.contact.error'
  }
}

/** Estado del botón "Contactar vendedor", que vive en la página y se pasa al detalle. */
interface ContactState {
  canContact: boolean
  isOpening: boolean
  error: TranslationKey | null
  onContact: () => void
}

/**
 * Detalle de un producto (Marketplace — Item Detail). Es público: GET
 * /products/:id no pide sesión (un borrador solo lo ve su dueño). Con sesión
 * registra la visita (POST /products/:id/view) y sin sesión manda al
 * backend los últimos productos vistos en este navegador para las
 * recomendaciones. Incluye las reseñas del producto.
 */
export default function ProductDetailPage() {
  const { t } = useLanguage()
  const { productId: rawId } = useParams({ from: '/products/$productId' })
  const parsed = Number(rawId)
  const productId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const { isLoggedIn, isLoading: isLoadingUser, data: currentUser } = useCurrentUser()
  const product = useProduct(productId)
  const isOwnProduct = useIsOwnProduct(productId, product.data?.title, currentUser?.role === 'seller')
  const isActive = product.data?.status === 'active'

  // Sin sesión, lo visto antes de este producto alimenta las recomendaciones.
  // Se calcula una vez por producto (antes de recordar el actual) para que la
  // clave de la query no cambie mientras se está en la página.
  const recentIds = useMemo(
    () => (isLoggedIn || productId === undefined ? [] : readRecentProductIds().filter((id) => id !== productId)),
    [isLoggedIn, productId],
  )
  const related = useRelatedProducts(productId, isActive)
  const recommended = useRecommendedProducts(productId, recentIds, isActive && !isLoadingUser)

  const recordView = useRecordProductViewMutation()
  const recordedFor = useRef<number | null>(null)
  useEffect(() => {
    if (!product.data || product.data.status !== 'active' || isLoadingUser) return
    rememberRecentProduct(product.data.id)
    if (isLoggedIn && recordedFor.current !== product.data.id) {
      recordedFor.current = product.data.id
      recordView.mutate(product.data.id)
    }
    // recordView.mutate es estable; no hace falta como dependencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.data?.id, product.data?.status, isLoggedIn, isLoadingUser])

  // Chat con el vendedor: ?chat=<conversationId> lo deja abierto (ver productDetailRoute).
  const navigate = useNavigate({ from: '/products/$productId' })
  const { chat: chatId } = useSearch({ from: '/products/$productId' })
  const isDesktop = useBreakpoint('xl')
  const isDocked = chatId !== undefined && isDesktop
  const openConversation = useOpenConversation()
  const [contactError, setContactError] = useState<TranslationKey | null>(null)

  function closeChat() {
    void navigate({ search: (prev) => ({ ...prev, chat: undefined }), replace: true })
  }

  function handleContact() {
    if (productId === undefined || chatId !== undefined || openConversation.isPending) return
    if (!isLoggedIn) {
      void navigate({ to: '/login' })
      return
    }
    setContactError(null)
    openConversation.mutate(productId, {
      onSuccess: (conversation) => void navigate({ search: (prev) => ({ ...prev, chat: conversation.id }) }),
      onError: (error) => {
        if (getHttpStatus(error) === 401) void navigate({ to: '/login' })
        else setContactError(contactErrorKey(error))
      },
    })
  }

  const contact: ContactState = {
    // Al dueño no se le ofrece (el backend respondería 403 igual).
    canContact: product.data?.status === 'active' && !isOwnProduct,
    isOpening: openConversation.isPending,
    error: contactError,
    onContact: handleContact,
  }

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      {/*
        Desde xl la página es siempre una fila (detalle + lugar para el chat), abierto o no:
        así al abrir el chat no cambia el layout de golpe, solo se anima. El panel crece
        (ChatDock) y el padding del <main> baja de 56px a 16px con la misma duración y curva.
        Cerrado, el ancho útil es el mismo de siempre (1320px - 2×56px).
      */}
      <div className={cx(isDesktop && 'mx-auto flex w-full max-w-[1368px] items-start px-4 sm:px-6')}>
        <main
          className={cx(
            'flex w-full flex-col gap-10 pt-7 pb-24',
            isDesktop
              ? cx('@container min-w-0 flex-1 transition-[padding]', CHAT_DOCK_CSS_TRANSITION, isDocked ? 'px-4' : 'px-14')
              : 'mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-14',
          )}
        >
          {product.isPending && productId !== undefined ? (
            <div className="h-[440px] animate-pulse rounded-[18px] bg-white" aria-busy="true" />
          ) : productId === undefined || isNotFoundError(product.error) ? (
            <ErrorState kind="notFound" title={t('itemDetail.notFound')}>
              <Link to="/explore" className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80">
                {t('explore.title')}
              </Link>
            </ErrorState>
          ) : product.isError ? (
            <QueryErrorState error={product.error} onRetry={() => void product.refetch()} texts={{ error: { description: t('products.list.loadError') } }} />
          ) : product.data ? (
            <>
              <Breadcrumb title={product.data.title} />
              <Detail key={product.data.id} product={product.data} contact={contact} fitsContainer={isDesktop} />
              {isActive && <ProductReviews productId={product.data.id} isOwnProduct={isOwnProduct} />}
              {related.data && related.data.length > 0 && (
                <Related title={t('itemDetail.relatedBySeller')} items={related.data} horizontal />
              )}
              {recommended.data && recommended.data.length > 0 && (
                <Related title={t('itemDetail.related')} items={recommended.data} />
              )}
              <CommunitiesForTagSection tags={product.data.productTags.map((item) => item.tag)} />
            </>
          ) : null}
        </main>

      <ChatDock conversationId={chatId ?? null} onClose={closeChat} />
      </div>

      <ChatSheet conversationId={chatId ?? null} onClose={closeChat} />
    </div>
  )
}

function Breadcrumb({ title }: { title: string }) {
  const { t } = useLanguage()
  return (
    <ScrollReveal>
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2">
        <Link to="/" className="rounded-[10px] bg-[#f3f3f2] px-[18px] py-[9px] text-[15px] font-medium text-mynted-gray hover:text-mynted-ink">
          {t('shop.tab.shop')}
        </Link>
        <span className="text-[15px] text-mynted-border" aria-hidden="true">
          /
        </span>
        <span aria-current="page" className="max-w-full truncate rounded-[10px] bg-[#ffdfd1] px-[18px] py-[9px] text-[15px] font-semibold text-mynted-orange">
          {title}
        </span>
      </nav>
    </ScrollReveal>
  )
}

/**
 * Foto + nombre + calificación del vendedor. Lleva a su perfil (/users/$userId)
 * cuando el backend manda `seller.userId`; mientras no lo mande, no es clicable.
 */
function SellerIdentity({ seller }: { seller: ProductDetail['seller'] }) {
  const { t } = useLanguage()
  const content = (
    <>
      <SellerAvatar name={seller.displayName} photoUrl={seller.photoUrl} />
      <span className="flex flex-col">
        <span className="font-heading text-base font-semibold text-mynted-ink group-hover:underline">{seller.displayName}</span>
        {seller.ratingAverage != null ? (
          <span className="flex items-center gap-1.5 text-xs text-mynted-gray">
            <Rating value={seller.ratingAverage} size={12} />
            {seller.ratingAverage.toFixed(1)} ({seller.reviewsCount})
          </span>
        ) : (
          <span className="text-xs text-mynted-gray">{t('itemDetail.sellerNoReviews')}</span>
        )}
      </span>
    </>
  )

  if (!seller.userId) return <div className="flex items-center gap-3.5">{content}</div>

  return (
    <Link
      to="/users/$userId"
      params={{ userId: seller.userId }}
      aria-label={t('chat.header.viewProfile', { name: seller.displayName })}
      className="group flex items-center gap-3.5 rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mynted-blue-mid"
    >
      {content}
    </Link>
  )
}

function SellerAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (photoUrl && photoUrl !== failedUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        // Las fotos de Google no cargan si se manda el Referer (ver avatar.tsx).
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(photoUrl)}
        className="size-11 rounded-full bg-mynted-bg object-cover"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-11 items-center justify-center rounded-full bg-mynted-yellow font-heading text-[15px] font-semibold text-white"
    >
      {getInitials(name)}
    </span>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-mynted-ink ring-1 ring-mynted-border">{children}</span>
  )
}

function Detail({ product, contact, fitsContainer }: { product: ProductDetail; contact: ContactState; fitsContainer: boolean }) {
  const { t, language } = useLanguage()
  // La galería (si hay) viene ordenada; la portada va primero.
  const images = [product.imageUrl, ...product.images.map((image) => image.url)].filter((url): url is string => Boolean(url))
  const tags = product.productTags.map((item) => item.tag)
  const notice = STATUS_NOTICE[product.status]
  const shipsTo = product.shipsTo ?? []

  return (
    // Desde xl el ancho disponible cambia con el chat abierto/cerrado: galería y datos se ponen
    // en fila según el ancho del <main> (container query), no de la pantalla. El gap también
    // se anima para acompañar la compresión.
    <ScrollReveal
      className={cx(
        'flex flex-col gap-8',
        fitsContainer
          ? cx('@min-[50rem]:flex-row @min-[50rem]:gap-10 @min-[66rem]:gap-14 transition-[gap]', CHAT_DOCK_CSS_TRANSITION)
          : 'lg:flex-row lg:gap-14',
      )}
    >
      <ProductGallery images={images} title={product.title} />

      <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
        {notice && (
          <p role="status" className="rounded-[10px] bg-[#fff4d6] px-3.5 py-2 text-sm font-medium text-[#8a5a00]">
            {t(notice)}
          </p>
        )}

        <h1 className="font-heading text-[30px] font-semibold text-mynted-ink">{product.title}</h1>

        {product.ratingAverage != null && (
          <a href="#reviews" className="flex items-center gap-2 text-sm text-mynted-gray hover:text-mynted-ink">
            <Rating value={product.ratingAverage} />
            <span>
              {product.ratingAverage.toFixed(1)} · {t('reviews.count', { count: product.reviewsCount })}
            </span>
          </a>
        )}

        {tags.length > 0 && <p className="text-sm text-mynted-gray">{tags.map((tag) => `#${tag.name}`).join(' ')}</p>}

        <div className="flex flex-wrap items-center gap-3.5">
          <SellerIdentity seller={product.seller} />
          {product.seller.isVerified && (
            <span className="rounded-full bg-[#e8faf2] px-[11px] py-[5px] text-xs font-semibold text-[#0d8c66]">
              ✓ {t('itemDetail.verifiedSeller')}
            </span>
          )}
        </div>

        {product.price != null && product.currency && (
          <ProductPrice
            price={product.price}
            finalPrice={product.finalPrice}
            discountPercent={product.discountPercent}
            currency={product.currency}
            className="font-heading text-[28px] font-semibold text-mynted-ink"
          />
        )}

        <div className="flex flex-wrap gap-2">
          {product.type && <Chip>{t(product.type === 'exchange' ? 'products.type.exchange' : 'products.type.sale')}</Chip>}
          {product.condition && <Chip>{t(CONDITION_LABEL[product.condition])}</Chip>}
        </div>

        {shipsTo.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold text-mynted-ink">{t('itemDetail.shipsTo')}</h2>
            <ul className="flex flex-wrap gap-2">
              {shipsTo.map((region) => (
                <li key={region}>
                  <Chip>
                    <span aria-hidden="true">{regionFlag(region)}</span> {regionName(region, language)}
                  </Chip>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.description && (
          <>
            <h2 className="text-sm font-semibold text-mynted-ink">{t('itemDetail.description')}</h2>
            <p className="max-w-3xl text-sm leading-[1.55] whitespace-pre-line text-[#1a1a1a]">{product.description}</p>
          </>
        )}

        <div className="flex items-start gap-3">
          {contact.canContact && (
            <button
              type="button"
              onClick={contact.onContact}
              disabled={contact.isOpening}
              aria-haspopup="dialog"
              className="cursor-pointer rounded-[10px] bg-mynted-blue px-7 py-[13px] text-[15px] font-semibold text-white shadow-[0_4px_10px_-2px_rgba(47,95,255,0.25)] outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid disabled:cursor-wait disabled:opacity-70"
            >
              {contact.isOpening ? t('chat.contact.opening') : t('itemDetail.contactSeller')}
            </button>
          )}
          {product.status !== 'draft' && <ProductFavoriteButton productId={product.id} variant="outline" />}
        </div>
        {contact.error && (
          <p role="alert" className="rounded-[10px] bg-[#fdecec] px-3.5 py-2 text-sm font-medium text-[#c62a2f]">
            {t(contact.error)}
          </p>
        )}
      </div>
    </ScrollReveal>
  )
}

function Related({
  title,
  items,
  horizontal = false,
}: {
  title: string
  items: (ProductListItem | RelatedProduct)[]
  /** Una sola fila con scroll horizontal en lugar de una grilla que crece hacia abajo. */
  horizontal?: boolean
}) {
  const { t } = useLanguage()
  return (
    <section className="flex flex-col gap-[18px]">
      <ScrollReveal>
        <h2 className="font-heading text-[22px] font-semibold text-mynted-ink">{title}</h2>
      </ScrollReveal>
      <ul
        className={
          horizontal
            ? '-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-3 [scrollbar-width:thin]'
            : 'grid grid-cols-2 gap-5 lg:grid-cols-4'
        }
      >
        {items.map((item, index) => {
          const card = (
            <Link
              to="/products/$productId"
              params={{ productId: String(item.id) }}
              className="group flex h-full flex-col gap-1.5 rounded-xl border border-mynted-border bg-white px-2.5 pt-2.5 pb-3 shadow-[0_2px_8px_0_rgba(13,13,20,0.06)]"
            >
              <div className="h-[140px] overflow-hidden rounded-lg bg-mynted-bg">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              {'isSellerChoice' in item && item.isSellerChoice && (
                <span className="self-start rounded-md bg-mynted-orange/10 px-1.5 py-0.5 text-[10px] font-bold text-mynted-orange">
                  {t('itemDetail.sellerChoice')}
                </span>
              )}
              <p className="line-clamp-2 font-heading text-[13px] font-semibold text-mynted-ink">{item.title}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <ProductPrice
                  price={item.price}
                  finalPrice={item.finalPrice}
                  discountPercent={item.discountPercent}
                  currency={item.currency}
                  className="text-[13px] font-semibold text-mynted-ink"
                />
                <span className="shrink-0 text-xs font-medium text-mynted-blue">{t('itemDetail.see')} →</span>
              </div>
            </Link>
          )
          return horizontal ? (
            <li key={item.id} className="w-[200px] shrink-0 snap-start">
              {card}
            </li>
          ) : (
            <StaggerItem key={item.id} index={index}>
              {card}
            </StaggerItem>
          )
        })}
      </ul>
    </section>
  )
}
