import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { SlidersHorizontal, X } from 'lucide-react'
import { isNotFoundError } from '@/api/apiError'
import { ErrorState } from '@/components/errors/ErrorState'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { FilterGroup } from '@/components/ui/FilterGroup'
import { Loader } from '@/components/ui/Loader'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { Select } from '@/components/ui/Select'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CONDITION_LABEL } from '@/features/products/components/productFormShared'
import { PRODUCT_CARD_SKELETON_CLASS } from '@/features/products/components/ShopFeed'
import { ShopProductCard } from '@/features/products/components/ShopProductCard'
import { PRODUCT_CONDITIONS, type ProductCondition, type ProductType } from '@/features/products/models/product'
import { StoreHeader } from '@/features/stores/components/StoreHeader'
import { useStore, useStoreProducts, useStoreTags } from '@/features/stores/hooks/useStoreQueries'
import { STORE_SORTS, type StoreProductFilters, type StoreProductStatus, type StoreSort } from '@/features/stores/models/store'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { displayFieldsOf } from '@/utils/price'
import { SiteHeader } from '../components/layout/SiteHeader'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { cx } from '@/utils/cx'

const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3'

const SORT_LABEL: Record<StoreSort, TranslationKey> = {
  recent: 'store.sort.recent',
  price_asc: 'store.sort.priceAsc',
  price_desc: 'store.sort.priceDesc',
}

/**
 * /sellers/:sellerId — la tienda de un vendedor: su cabecera (GET
 * /sellers/:sellerId) y su catálogo (GET /sellers/:sellerId/products) con
 * filtros por tag, estado (disponibles / vendidos), tipo y condición, y orden.
 * Es pública: funciona sin sesión. Si la tienda no es pública (vendedor
 * pendiente, rechazado o cuenta desactivada) el backend responde 404.
 */
export default function StorePage() {
  const { t } = useLanguage()
  const { sellerId: rawId } = useParams({ from: '/sellers/$sellerId' })
  const parsed = Number(rawId)
  const sellerId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  const { userId } = useCurrentUser()
  const store = useStore(sellerId)

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'flex flex-col gap-8 pt-6 pb-24')}>
        {sellerId !== undefined && store.isPending ? (
          <div className="flex justify-center py-24">
            <Loader label={t('store.loading')} />
          </div>
        ) : sellerId === undefined || isNotFoundError(store.error) ? (
          <ErrorState kind="notFound" title={t('store.notFoundTitle')} description={t('store.notFoundSubtitle')}>
            <Link
              to="/explore"
              className="rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
            >
              {t('explore.title')}
            </Link>
          </ErrorState>
        ) : store.isError || !store.data ? (
          <QueryErrorState
            error={store.error}
            onRetry={() => void store.refetch()}
            texts={{ error: { description: t('store.loadError') } }}
          />
        ) : (
          <>
            <StoreHeader store={store.data} isOwnStore={userId === store.data.userId} />
            <StoreCatalog key={store.data.sellerId} sellerId={store.data.sellerId} />
          </>
        )}
      </main>
    </div>
  )
}

function StoreCatalog({ sellerId }: { sellerId: number }) {
  const { t } = useLanguage()
  const [status, setStatus] = useState<StoreProductStatus>('active')
  const [tag, setTag] = useState<number | undefined>()
  const [type, setType] = useState<ProductType | undefined>()
  const [condition, setCondition] = useState<ProductCondition | undefined>()
  const [sort, setSort] = useState<StoreSort>('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Solo se mandan los que cambian el valor por defecto del backend (status=active, sort=recent).
  const filters: StoreProductFilters = {
    ...(status !== 'active' && { status }),
    ...(tag !== undefined && { tag }),
    ...(type && { type }),
    ...(condition && { condition }),
    ...(sort !== 'recent' && { sort }),
  }
  const activeCount = [status !== 'active', tag !== undefined, type, condition].filter(Boolean).length

  const tags = useStoreTags(sellerId)
  const products = useStoreProducts(sellerId, filters)
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
  const total = products.data?.pages[0]?.pagination.total

  function clearFilters() {
    setStatus('active')
    setTag(undefined)
    setType(undefined)
    setCondition(undefined)
  }

  return (
    <section aria-labelledby="store-catalog-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="store-catalog-title" className="font-heading text-[22px] font-semibold text-mynted-ink">
            {t('store.catalog.title')}
          </h2>
          <p className="min-h-5 text-sm text-mynted-gray" aria-live="polite">
            {total !== undefined && t(total === 1 ? 'store.catalog.countOne' : 'store.catalog.count', { count: total })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="lg:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {t('explore.filters.title')}
            {activeCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-mynted-orange text-[11px] text-white">{activeCount}</span>
            )}
          </Button>
          <label htmlFor="store-sort" className="sr-only">
            {t('store.sort.label')}
          </label>
          <Select
            id="store-sort"
            className="w-52"
            value={sort}
            placeholder={t('store.sort.label')}
            options={STORE_SORTS.map((value) => ({ value, label: t(SORT_LABEL[value]) }))}
            onChange={setSort}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <ScrollReveal className={`${filtersOpen ? 'block' : 'hidden'} lg:sticky lg:top-28 lg:block`}>
          <aside
            aria-label={t('explore.filters.title')}
            className="flex flex-col gap-5 rounded-2xl border border-mynted-border bg-white p-5 lg:max-h-[calc(100svh-8rem)] lg:overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold text-mynted-ink">{t('explore.filters.title')}</h3>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-mynted-blue hover:cursor-pointer hover:underline"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  {t('explore.filters.clear')}
                </button>
              )}
            </div>

            <FilterGroup label={t('store.filters.status')}>
              <FilterChip selected={status === 'active'} onClick={() => setStatus('active')}>
                {t('store.filters.available')}
              </FilterChip>
              <FilterChip selected={status === 'sold'} onClick={() => setStatus('sold')}>
                {t('store.filters.sold')}
              </FilterChip>
            </FilterGroup>

            {/* Los tags salen de los productos ACTIVOS de la tienda, con cuántos tiene cada uno. */}
            {tags.data && tags.data.length > 0 && (
              <FilterGroup label={t('store.filters.tags')}>
                <FilterChip selected={tag === undefined} onClick={() => setTag(undefined)}>
                  {t('explore.filters.all')}
                </FilterChip>
                {tags.data.map((item) => (
                  <FilterChip key={item.tagId} selected={tag === item.tagId} onClick={() => setTag(item.tagId)}>
                    #{item.name} <span className="text-mynted-gray">({item.count})</span>
                  </FilterChip>
                ))}
              </FilterGroup>
            )}

            <FilterGroup label={t('explore.filters.type')}>
              <FilterChip selected={type === undefined} onClick={() => setType(undefined)}>
                {t('explore.filters.all')}
              </FilterChip>
              <FilterChip selected={type === 'sale'} onClick={() => setType('sale')}>
                {t('products.type.sale')}
              </FilterChip>
              <FilterChip selected={type === 'exchange'} onClick={() => setType('exchange')}>
                {t('products.type.exchange')}
              </FilterChip>
            </FilterGroup>

            <FilterGroup label={t('explore.filters.condition')}>
              <FilterChip selected={condition === undefined} onClick={() => setCondition(undefined)}>
                {t('explore.filters.all')}
              </FilterChip>
              {PRODUCT_CONDITIONS.map((item) => (
                <FilterChip key={item} selected={condition === item} onClick={() => setCondition(item)}>
                  {t(CONDITION_LABEL[item])}
                </FilterChip>
              ))}
            </FilterGroup>
          </aside>
        </ScrollReveal>

        <div className="flex min-w-0 flex-col gap-4">
          {products.isPending ? (
            <div className={GRID_CLASS} aria-busy="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className={PRODUCT_CARD_SKELETON_CLASS} />
              ))}
            </div>
          ) : products.isError ? (
            <QueryErrorState
              error={products.error}
              onRetry={() => void products.refetch()}
              texts={{ error: { description: t('products.list.loadError') } }}
            />
          ) : items.length === 0 ? (
            <ErrorState
              kind={activeCount > 0 ? 'noResults' : 'empty'}
              title={t(activeCount > 0 ? 'explore.empty.title' : 'store.catalog.emptyTitle')}
              description={t(activeCount > 0 ? 'explore.empty.body' : 'store.catalog.emptyBody')}
            >
              {activeCount > 0 && (
                <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={clearFilters}>
                  {t('explore.filters.clear')}
                </Button>
              )}
            </ErrorState>
          ) : (
            <>
              <ul className={GRID_CLASS}>
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
                        status: product.status,
                        // Destacados del vendedor (Pro): GET /sellers/:id/products ya los manda primero.
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
        </div>
      </div>
    </section>
  )
}
