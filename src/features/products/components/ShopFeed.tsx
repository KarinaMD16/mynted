import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { useLanguage } from '@/i18n/LanguageContext'
import { useShopFeed } from '../hooks/useProductQueries'
import type { ShopSection } from '../models/product'
import { ShopProductCard } from './ShopProductCard'

export const SHOP_GRID_CLASS = 'grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-4'

/**
 * Pantalla principal de la tienda ("Shop"): una sección por tag con sus
 * productos. Solo pide GET /products/shop y pinta lo que llega; al acercarse
 * al final pide la siguiente página de secciones (scroll infinito).
 */
export function ShopFeed() {
  const { t } = useLanguage()
  const query = useShopFeed()
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, query.data?.pages.length])

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white" />
        <div className={SHOP_GRID_CLASS}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[300px] animate-pulse rounded-[14px] bg-white" />
          ))}
        </div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
        <p className="text-sm font-semibold text-mynted-ink">{t('products.list.loadError')}</p>
        <p className="text-sm text-mynted-gray">{getApiErrorMessage(query.error)}</p>
        <Button type="button" onClick={() => void query.refetch()} variant="secondary" size="sm" className="mt-2">
          {t('communities.list.retry')}
        </Button>
      </div>
    )
  }

  const sections = query.data.pages.flatMap((page) => page.sections)

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
        <p className="text-sm font-semibold text-mynted-ink">{t('shop.empty.title')}</p>
        <p className="text-sm text-mynted-gray">{t('shop.empty.body')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <TagSection key={section.tag.tagId} section={section} />
      ))}

      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4" aria-live="polite">
          <span className="text-sm text-mynted-gray">{isFetchingNextPage ? t('shop.loadingMore') : ''}</span>
        </div>
      )}
    </div>
  )
}

function TagSection({ section }: { section: ShopSection }) {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col gap-5" aria-label={t('shop.sectionLabel', { tag: section.tag.name })}>
      <ScrollReveal className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-[26px] font-semibold text-mynted-ink">#{section.tag.name}</h2>
        <Link to="/shop/tag/$tagId" params={{ tagId: String(section.tag.tagId) }} className="text-sm font-semibold whitespace-pre text-mynted-blue hover:underline">
          {`${t('shop.showAll')}  →`}
        </Link>
      </ScrollReveal>
      <ul className={SHOP_GRID_CLASS}>
        {section.products.map((product, index) => (
          <StaggerItem key={product.id} index={index}>
            <ShopProductCard product={{ ...product, isVerified: product.seller.isVerified }} />
          </StaggerItem>
        ))}
      </ul>
    </section>
  )
}
