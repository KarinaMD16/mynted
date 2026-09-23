import type { ReactNode } from 'react'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, Repeat, Tag, UsersRound } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import type { ProductCondition, ProductListItem, ProductPage, ProductStatus } from '../models/product'

const CONDITION_LABEL: Record<ProductCondition, TranslationKey> = {
  new: 'products.condition.new',
  like_new: 'products.condition.likeNew',
  good_condition: 'products.condition.good',
  used_with_details: 'products.condition.usedWithDetails',
}

const STATUS_LABEL: Record<Exclude<ProductStatus, 'active'>, TranslationKey> = {
  sold: 'products.status.sold',
  inactive: 'products.status.inactive',
}

function formatPrice(price: string | number, currency: string, language: AppLanguage): string {
  const value = typeof price === 'number' ? price : Number(price)
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(value)
  } catch {
    // Código de moneda que Intl no reconoce: se muestra tal cual.
    return `${currency} ${value.toFixed(2)}`
  }
}

/**
 * Grilla de productos con sus estados (cargando, error, vacío) y "Cargar
 * más". Se usa en el perfil del vendedor (con la comunidad de cada producto y
 * su estado) y en la tienda de una comunidad (solo productos activos).
 */
export function ProductGrid({
  query,
  showCommunity = false,
  emptyState,
}: {
  query: UseInfiniteQueryResult<InfiniteData<ProductPage>>
  showCommunity?: boolean
  emptyState: ReactNode
}) {
  const { t } = useLanguage()

  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
        <p className="text-sm font-semibold text-mynted-ink">{t('products.list.loadError')}</p>
        <p className="text-sm text-mynted-gray">{getApiErrorMessage(query.error)}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-2 rounded-lg border border-mynted-border bg-white px-4 py-2 text-sm font-semibold text-mynted-ink hover:cursor-pointer hover:bg-mynted-bg"
        >
          {t('communities.list.retry')}
        </button>
      </div>
    )
  }

  const products = query.data.pages.flatMap((page) => page.data)
  if (products.length === 0) return <>{emptyState}</>

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <li key={product.id}>
            <ProductListingCard product={product} showCommunity={showCommunity} />
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mx-auto flex items-center gap-2 rounded-xl border border-mynted-border bg-white px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {query.isFetchingNextPage && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {t('products.list.loadMore')}
        </button>
      )}
    </div>
  )
}

function ProductListingCard({ product, showCommunity }: { product: ProductListItem; showCommunity: boolean }) {
  const { t, language } = useLanguage()
  const isExchange = product.type === 'exchange'
  const tags = product.productTags?.map((item) => item.tag) ?? []

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-mynted-border bg-white transition-shadow hover:shadow-[0_16px_40px_-12px_rgba(13,13,20,0.15)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-mynted-bg">
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
            isExchange ? 'bg-mynted-blue-mid text-white' : 'bg-white/95 text-mynted-ink'
          }`}
        >
          {isExchange ? <Repeat className="size-3.5" aria-hidden="true" /> : <Tag className="size-3.5" aria-hidden="true" />}
          {t(isExchange ? 'products.type.exchange' : 'products.type.sale')}
        </span>
        {product.status !== 'active' && (
          <span className="absolute top-3 right-3 rounded-full bg-mynted-ink/85 px-2.5 py-1 text-xs font-semibold text-white">
            {t(STATUS_LABEL[product.status])}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-heading text-base font-semibold text-mynted-ink">{product.title}</h3>
        <p className="text-xs font-medium text-mynted-gray">{t(CONDITION_LABEL[product.condition])}</p>

        {tags.length > 0 && (
          <p className="line-clamp-1 text-xs text-mynted-gray">{tags.map((tag) => `#${tag.name}`).join(' ')}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <span className="flex flex-col">
            {isExchange && <span className="text-[11px] text-mynted-gray">{t('products.card.referenceValue')}</span>}
            <span className="font-heading text-lg font-semibold text-mynted-ink">
              {formatPrice(product.price, product.currency, language)}
            </span>
          </span>
          {showCommunity && product.community && (
            <Link
              to="/communities/$slug"
              params={{ slug: product.community.slug }}
              className="flex min-w-0 items-center gap-1 rounded-full bg-mynted-bg px-2.5 py-1 text-xs font-semibold text-mynted-ink hover:text-mynted-orange"
            >
              <UsersRound className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{product.community.name}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
