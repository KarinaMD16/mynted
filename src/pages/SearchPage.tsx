import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getApiErrorMessage } from '@/api/apiError'
import { AnimatedTabs } from '@/components/ui/AnimatedTabs'
import { Button } from '@/components/ui/Button'
import { StaggerItem } from '@/components/ui/ScrollReveal'
import type { PublicUser } from '@/features/auth/models/auth'
import type { FeedPost } from '@/features/community/models/communityDTOs'
import { ShopProductCard } from '@/features/products/components/ShopProductCard'
import type { ProductListItem } from '@/features/products/models/product'
import {
  CommunityResultRow,
  PostResultRow,
  UserResultRow,
} from '@/features/search/components/SearchResultRows'
import { useSearchByType, useSearchSummary } from '@/features/search/hooks/useSearchQueries'
import { SEARCH_TYPES, type SearchCommunity, type SearchType } from '@/features/search/models/search'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { SiteHeader } from '../components/layout/SiteHeader'

const TAB_LABEL: Record<SearchType | 'all', TranslationKey> = {
  all: 'search.tab.all',
  products: 'search.section.products',
  communities: 'search.section.communities',
  users: 'search.section.users',
  posts: 'search.section.posts',
}

const GRID_CLASS = 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4'
const LIST_CLASS = 'grid grid-cols-1 gap-2 rounded-2xl border border-mynted-border bg-white p-2 md:grid-cols-2'

/**
 * Resultados de la búsqueda (/search?q=&type=). Sin `type` muestra el resumen
 * de GET /search (los primeros 5 de cada tipo); con `type`, los resultados de
 * ese tipo con "Cargar más". Es pública: la sesión solo sirve para marcar los
 * favoritos.
 */
export default function SearchPage() {
  const { t } = useLanguage()
  const { q, type } = useSearch({ from: '/search' })
  const navigate = useNavigate()

  const tabs = (['all', ...SEARCH_TYPES] as const).map((id) => ({ id, label: t(TAB_LABEL[id]) }))

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">
          {q ? t('search.resultsFor', { query: q }) : t('search.title')}
        </h1>

        {!q ? (
          <p className="rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center text-sm text-mynted-gray">
            {t('search.emptyQuery')}
          </p>
        ) : (
          <>
            <AnimatedTabs
              items={tabs}
              value={type ?? 'all'}
              onChange={(next) => void navigate({ to: '/search', search: { q, type: next === 'all' ? undefined : next } })}
              semantics="pressed"
              className="flex items-center gap-1.5 overflow-x-auto border-b border-mynted-border pb-1 [scrollbar-width:thin]"
            />
            {type ? <TypeResults key={`${type}-${q}`} type={type} q={q} /> : <AllResults q={q} />}
          </>
        )}
      </main>
    </div>
  )
}

function Loading() {
  return (
    <div className={GRID_CLASS} aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-[260px] animate-pulse rounded-[14px] bg-white" />
      ))}
    </div>
  )
}

function ErrorBox({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
      <p className="text-sm font-semibold text-mynted-ink">{t('search.error')}</p>
      <p className="text-sm text-mynted-gray">{getApiErrorMessage(error)}</p>
      <Button type="button" onClick={onRetry} variant="secondary" size="sm" className="mt-2">
        {t('communities.list.retry')}
      </Button>
    </div>
  )
}

function NoResults({ query }: { query: string }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
      <p className="text-sm font-semibold text-mynted-ink">{t('search.noResults', { query })}</p>
      <p className="max-w-sm text-sm text-mynted-gray">{t('search.noResultsHint')}</p>
    </div>
  )
}

function SectionHeading({ type, total, q }: { type: SearchType; total: number; q: string }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-heading text-[20px] font-semibold text-mynted-ink">
        {t(TAB_LABEL[type])} <span className="text-sm font-normal text-mynted-gray">({total})</span>
      </h2>
      {total > 5 && (
        <button
          type="button"
          onClick={() => void navigate({ to: '/search', search: { q, type } })}
          className="text-sm font-semibold text-mynted-blue hover:cursor-pointer hover:underline"
        >
          {t('search.seeType', { count: total })}
        </button>
      )}
    </div>
  )
}

function AllResults({ q }: { q: string }) {
  const summary = useSearchSummary(q)

  if (summary.isPending) return <Loading />
  if (summary.isError) return <ErrorBox error={summary.error} onRetry={() => void summary.refetch()} />

  const { products, communities, users, posts } = summary.data
  if (products.total + communities.total + users.total + posts.total === 0) return <NoResults query={q} />

  return (
    <div className="flex flex-col gap-8">
      {products.total > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading type="products" total={products.total} q={q} />
          <ul className={GRID_CLASS}>
            {products.data.map((product, index) => (
              <StaggerItem key={product.id} index={index}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </ul>
        </section>
      )}
      {communities.total > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading type="communities" total={communities.total} q={q} />
          <ul className={LIST_CLASS}>
            {communities.data.map((community) => (
              <li key={community.id}>
                <CommunityResultRow community={community} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {users.total > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading type="users" total={users.total} q={q} />
          <ul className={LIST_CLASS}>
            {users.data.map((user) => (
              <li key={user.id}>
                <UserResultRow user={user} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {posts.total > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading type="posts" total={posts.total} q={q} />
          <ul className={LIST_CLASS}>
            {posts.data.map((post) => (
              <li key={post.id}>
                <PostResultRow post={post} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <ShopProductCard
      product={{
        id: product.id,
        title: product.title,
        imageUrl: product.imageUrl,
        price: product.price,
        finalPrice: product.finalPrice,
        discountPercent: product.discountPercent,
        currency: product.currency,
        tags: product.productTags?.map((item) => item.tag) ?? [],
        type: product.type,
      }}
    />
  )
}

/** Resultados de un solo tipo, con "Cargar más" (scroll infinito solo en productos, que es una grilla larga). */
function TypeResults({ type, q }: { type: SearchType; q: string }): ReactNode {
  const { t } = useLanguage()
  const query = useSearchByType(type, q)
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

  const total = query.data?.pages[0]?.pagination.total
  const announce = total !== undefined ? t('search.resultsCount', { count: total }) : ''

  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorBox error={query.error} onRetry={() => void query.refetch()} />

  const pages = query.data.pages
  if ((pages[0]?.pagination.total ?? 0) === 0) return <NoResults query={q} />

  const footer = hasNextPage && (
    <div ref={sentinelRef} className="flex justify-center py-4" aria-live="polite">
      <span className="text-sm text-mynted-gray">{isFetchingNextPage ? t('shop.loadingMore') : ''}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-mynted-gray" aria-live="polite">
        {announce}
      </p>
      {type === 'products' && (
        <ul className={GRID_CLASS}>
          {pages
            .flatMap((page) => page.data as ProductListItem[])
            .map((product, index) => (
              <StaggerItem key={product.id} index={index}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
        </ul>
      )}
      {type === 'communities' && (
        <ul className={LIST_CLASS}>
          {pages
            .flatMap((page) => page.data as SearchCommunity[])
            .map((community) => (
              <li key={community.id}>
                <CommunityResultRow community={community} />
              </li>
            ))}
        </ul>
      )}
      {type === 'users' && (
        <ul className={LIST_CLASS}>
          {pages
            .flatMap((page) => page.data as PublicUser[])
            .map((user) => (
              <li key={user.id}>
                <UserResultRow user={user} />
              </li>
            ))}
        </ul>
      )}
      {type === 'posts' && (
        <ul className={LIST_CLASS}>
          {pages
            .flatMap((page) => page.data as FeedPost[])
            .map((post) => (
              <li key={post.id}>
                <PostResultRow post={post} />
              </li>
            ))}
        </ul>
      )}
      {footer}
    </div>
  )
}
