import { useEffect, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { ShopProductCard } from '@/features/products/components/ShopProductCard'
import { SHOP_GRID_CLASS } from '@/features/products/components/ShopFeed'
import { useTag, useTagProducts } from '@/features/products/hooks/useProductQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { SiteHeader } from '../components/layout/SiteHeader'

/**
 * "Ver todo" de una sección del Shop: todos los productos activos de un tag
 * (GET /products?tag=), con scroll infinito. Ese endpoint pide sesión.
 */
export default function TagProductsPage() {
  const { t } = useLanguage()
  const { tagId: rawTagId } = useParams({ from: '/shop/tag/$tagId' })
  const parsed = Number(rawTagId)
  const tagId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const { isLoggedIn, isLoading: isLoadingUser } = useCurrentUser()
  const tag = useTag(tagId)
  const products = useTagProducts(tagId, isLoggedIn)
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

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        <ScrollReveal className="flex flex-col gap-3">
          <Link to="/" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-mynted-blue hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('shop.back')}
          </Link>
          <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">
            {tag.data ? `#${tag.data.name}` : <span className="inline-block h-8 w-40 animate-pulse rounded-lg bg-white align-middle" />}
          </h1>
        </ScrollReveal>

        {isLoadingUser ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
            <p className="text-sm text-mynted-gray">{t('shop.tag.loginPrompt')}</p>
            <Link
              to="/login"
              className="rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
            >
              {t('home.goToLogin')}
            </Link>
          </div>
        ) : products.isPending ? (
          <div className={SHOP_GRID_CLASS} aria-busy="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-[300px] animate-pulse rounded-[14px] bg-white" />
            ))}
          </div>
        ) : products.isError ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
            <p className="text-sm font-semibold text-mynted-ink">{t('products.list.loadError')}</p>
            <p className="text-sm text-mynted-gray">{getApiErrorMessage(products.error)}</p>
            <Button type="button" onClick={() => void products.refetch()} variant="secondary" size="sm" className="mt-2">
              {t('communities.list.retry')}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center text-sm text-mynted-gray">
            {t('shop.tag.empty')}
          </p>
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
                      currency: product.currency,
                      tags: product.productTags?.map((item) => item.tag) ?? [],
                      type: product.type,
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
