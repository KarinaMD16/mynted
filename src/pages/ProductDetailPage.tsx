import { Link, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { ProductFavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { ProductGallery } from '@/features/products/components/ProductGallery'
import { useProduct, useRecommendedProducts } from '@/features/products/hooks/useProductQueries'
import type { ProductCondition, ProductDetail, ProductListItem } from '@/features/products/models/product'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'

const CONDITION_LABEL: Record<ProductCondition, TranslationKey> = {
  new: 'products.condition.new',
  like_new: 'products.condition.likeNew',
  good_condition: 'products.condition.good',
  used_with_details: 'products.condition.usedWithDetails',
}

function formatPrice(price: string | number, currency: string, language: AppLanguage): string {
  const value = typeof price === 'number' ? price : Number(price)
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

/**
 * Detalle de un producto (Marketplace — Item Detail): GET /products/:id para
 * el producto y GET /products/recommended?currentProductId= para "También te
 * puede interesar". GET /products/:id pide sesión.
 */
export default function ProductDetailPage() {
  const { t } = useLanguage()
  const { productId: rawId } = useParams({ from: '/products/$productId' })
  const parsed = Number(rawId)
  const productId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const { isLoggedIn, isLoading: isLoadingUser } = useCurrentUser()
  const product = useProduct(productId, isLoggedIn)
  const related = useRecommendedProducts(productId, isLoggedIn)

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        {isLoadingUser || (isLoggedIn && product.isPending) ? (
          <div className="h-[440px] animate-pulse rounded-[18px] bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
            <p className="text-sm text-mynted-gray">{t('itemDetail.loginPrompt')}</p>
            <Link
              to="/login"
              className="rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
            >
              {t('home.goToLogin')}
            </Link>
          </div>
        ) : product.isError ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
            <p className="text-sm font-semibold text-mynted-ink">
              {productId === undefined || (isAxiosError(product.error) && product.error.response?.status === 404)
                ? t('itemDetail.notFound')
                : t('products.list.loadError')}
            </p>
            <p className="text-sm text-mynted-gray">{getApiErrorMessage(product.error)}</p>
            <Button type="button" onClick={() => void product.refetch()} variant="secondary" size="sm" className="mt-2">
              {t('communities.list.retry')}
            </Button>
          </div>
        ) : product.data ? (
          <>
            <Breadcrumb title={product.data.title} />
            <Detail key={product.data.id} product={product.data} />
            {related.data && related.data.length > 0 && <Related items={related.data} />}
          </>
        ) : null}
      </main>
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

function Detail({ product }: { product: ProductDetail }) {
  const { t, language } = useLanguage()
  // La galería (si hay) viene ordenada; la portada va primero.
  const images = [product.imageUrl, ...product.images.map((image) => image.url)]
  const tags = product.productTags.map((item) => item.tag)

  return (
    <ScrollReveal className="flex flex-col gap-8 lg:flex-row lg:gap-14">
      <ProductGallery images={images} title={product.title} />

      <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
        <h1 className="font-heading text-[30px] font-semibold text-mynted-ink">{product.title}</h1>

        {tags.length > 0 && <p className="text-sm text-mynted-gray">{tags.map((tag) => `#${tag.name}`).join(' ')}</p>}

        <div className="flex flex-wrap items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full bg-mynted-yellow font-heading text-[15px] font-semibold text-white"
          >
            {initials(product.seller.displayName)}
          </span>
          <span className="font-heading text-base font-semibold text-mynted-ink">{product.seller.displayName}</span>
          {product.seller.isVerified && (
            <span className="rounded-full bg-[#e8faf2] px-[11px] py-[5px] text-xs font-semibold text-[#0d8c66]">
              ✓ {t('itemDetail.verifiedSeller')}
            </span>
          )}
        </div>

        <p className="font-heading text-[28px] font-semibold text-mynted-ink">
          {formatPrice(product.price, product.currency, language)}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-mynted-ink ring-1 ring-mynted-border">
            {t(product.type === 'exchange' ? 'products.type.exchange' : 'products.type.sale')}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-mynted-ink ring-1 ring-mynted-border">
            {t(CONDITION_LABEL[product.condition])}
          </span>
        </div>

        <h2 className="text-sm font-semibold text-mynted-ink">{t('itemDetail.description')}</h2>
        <p className="max-w-3xl text-sm leading-[1.55] whitespace-pre-line text-[#1a1a1a]">{product.description}</p>

        <div className="flex items-start gap-3">
          <Link
            to="/messages"
            className="rounded-[10px] bg-mynted-blue px-7 py-[13px] text-[15px] font-semibold text-white shadow-[0_4px_10px_-2px_rgba(47,95,255,0.25)] transition-opacity hover:opacity-90"
          >
            {t('itemDetail.contactSeller')}
          </Link>
          <ProductFavoriteButton productId={product.id} variant="outline" />
        </div>
      </div>
    </ScrollReveal>
  )
}

function Related({ items }: { items: ProductListItem[] }) {
  const { t, language } = useLanguage()
  return (
    <section className="flex flex-col gap-[18px]">
      <ScrollReveal>
        <h2 className="font-heading text-[22px] font-semibold text-mynted-ink">{t('itemDetail.related')}</h2>
      </ScrollReveal>
      <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {items.map((item, index) => (
          <StaggerItem key={item.id} index={index}>
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
              <p className="line-clamp-2 font-heading text-[13px] font-semibold text-mynted-ink">{item.title}</p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-[13px] font-semibold text-mynted-ink">{formatPrice(item.price, item.currency, language)}</span>
                <span className="text-xs font-medium text-mynted-blue">{t('itemDetail.see')} →</span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </ul>
    </section>
  )
}
