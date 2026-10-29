import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useEffect, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { ShopProductCard } from '@/features/products/components/ShopProductCard'
import { PRODUCT_CARD_SKELETON_CLASS, SHOP_GRID_CLASS } from '@/features/products/components/ShopFeed'
import { useTag, useTagProducts } from '@/features/products/hooks/useProductQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { displayFieldsOf } from '@/utils/price'
import { SiteHeader } from '../components/layout/SiteHeader'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

/**
 * "Ver todo" de una sección del Shop: todos los productos activos de un tag
 * (GET /products?tag=), con scroll infinito. Es público: no pide sesión.
 */
export default function TagProductsPage() {
  const { t } = useLanguage()
  const { tagId: rawTagId } = useParams({ from: '/shop/tag/$tagId' })
  const parsed = Number(rawTagId)
  const tagId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const tag = useTag(tagId)
  const products = useTagProducts(tagId)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = products

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.data?.pages.length])

  const items = products.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-6 pt-7 pb-24')}>
        <ScrollReveal className="flex flex-col gap-3">
          <Link to="/" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-blue hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('shop.back')}
          </Link>
          <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">
            {tag.data ? `#${tag.data.name}` : <span className="inline-block h-8 w-40 animate-pulse rounded-lg bg-white align-middle" />}
          </h1>
        </ScrollReveal>

        {products.isPending ? (
          <div className={SHOP_GRID_CLASS} aria-busy="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className={PRODUCT_CARD_SKELETON_CLASS} />
            ))}
          </div>
        ) : products.isError ? (
          <QueryErrorState error={products.error} onRetry={() => void products.refetch()} texts={{ error: { description: t('products.list.loadError') } }} />
        ) : items.length === 0 ? (
          <ErrorState kind="empty" description={t('shop.tag.empty')} />
        ) : (
          <>
            <ul className={SHOP_GRID_CLASS}>
              {items.map((product, index) => (
                <StaggerItem key={product.id} index={index}>
                  <ShopProductCard
                    product={{
                      id: product.id,
                      title: product.title,
                      imageUrl: product.imageUrl,
                      price: product.price,
                      finalPrice: product.finalPrice,
                      discountPercent: product.discountPercent,
                      currency: product.currency,
                      ...displayFieldsOf(product),
                      tags: product.productTags?.map((item) => item.tag) ?? [],
                      type: product.type,
                      isFeatured: product.isFeatured,
                      quantity: product.quantity,
                      isAvailable: product.isAvailable,
                    }}
                  />
                </StaggerItem>
              ))}
            </ul>
            {hasNextPage && (
              <div ref={sentinelRef} className="flex justify-center py-4" aria-live="polite">
                <span className="text-sm text-mynted-gray">{isFetchingNextPage ? t('shop.loadingMore') : ''}</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
