import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PackageCheck, PauseCircle, Pencil, Play, Plus, Rocket, Search, Trash2 } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CONDITION_LABEL } from '@/features/products/components/productFormShared'
import { ProductPrice } from '@/features/products/components/ProductPrice'
import {
  useDeleteProductMutation,
  usePublishProductMutation,
  useUpdateProductStatusMutation,
} from '@/features/products/hooks/useProductMutations'
import { useMyProductsDashboard, useMyProductsStats } from '@/features/products/hooks/useProductQueries'
import type {
  MyProductCard,
  MyProductsFilters,
  ProductStatus,
  ProductType,
  PublishedProductStatus,
} from '@/features/products/models/product'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { SiteHeader } from '../components/layout/SiteHeader'

const STATUS_FILTERS: { value: ProductStatus | undefined; label: TranslationKey }[] = [
  { value: undefined, label: 'myProducts.filter.all' },
  { value: 'draft', label: 'products.status.draft' },
  { value: 'active', label: 'myProducts.status.active' },
  { value: 'sold', label: 'products.status.sold' },
  { value: 'inactive', label: 'products.status.inactive' },
]

const TYPE_FILTERS: { value: ProductType | undefined; label: TranslationKey }[] = [
  { value: undefined, label: 'myProducts.filter.allTypes' },
  { value: 'sale', label: 'products.type.sale' },
  { value: 'exchange', label: 'products.type.exchange' },
]

const STATUS_LABEL: Record<ProductStatus, TranslationKey> = {
  draft: 'products.status.draft',
  active: 'myProducts.status.active',
  sold: 'products.status.sold',
  inactive: 'products.status.inactive',
}

const STATUS_STYLE: Record<ProductStatus, string> = {
  draft: 'bg-mynted-blue/10 text-mynted-blue',
  active: 'bg-teal-50 text-teal-700',
  sold: 'bg-mynted-ink/10 text-mynted-ink',
  inactive: 'bg-amber-50 text-amber-700',
}

/**
 * Panel del vendedor ("Mis productos"): lista sus publicaciones agrupadas por
 * tag (GET /products/me), con borradores, búsqueda por título y filtros por
 * estado/tipo. Desde cada fila: editar (pantalla /products/:id/edit), publicar
 * un borrador (POST /products/:id/publish), pausar o marcar como vendido,
 * reactivar uno pausado (PATCH /products/:id/status; un vendido no vuelve a
 * "activo") y eliminar (DELETE /products/:id).
 */
export default function MyProductsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data: user, isLoggedIn, isLoading: isLoadingUser } = useCurrentUser()
  const isSeller = user?.role === 'seller'

  const [status, setStatus] = useState<ProductStatus | undefined>(undefined)
  const [type, setType] = useState<ProductType | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [searchQuery, setQueryQ] = useState('')
  // La búsqueda se manda al backend un momento después de dejar de escribir.
  useEffect(() => {
    const timer = window.setTimeout(() => setQueryQ(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])
  const filters: MyProductsFilters = { ...(status && { status }), ...(type && { type }), ...(searchQuery && { q: searchQuery }) }

  const query = useMyProductsDashboard(filters, isSeller)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const publishMutation = usePublishProductMutation()
  const statusMutation = useUpdateProductStatusMutation()

  /** Acciones sin confirmación: publicar un borrador y reactivar uno pausado. */
  async function runDirectAction(action: () => Promise<unknown>) {
    setActionError(null)
    try {
      await action()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

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

  const sections = query.data?.pages.flatMap((page) => page.sections) ?? []

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        <ScrollReveal className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('myProducts.title')}</h1>
            <p className="text-sm text-mynted-gray">{t('myProducts.subtitle')}</p>
          </div>
          {isSeller && (
            <Button type="button" variant="primary" size="md" onClick={() => void navigate({ to: '/products/new' })}>
              <Plus className="size-4" aria-hidden="true" />
              {t('myProducts.publish')}
            </Button>
          )}
        </ScrollReveal>

        {isLoadingUser ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <MessageCard text={t('myProducts.loginPrompt')} action={{ to: '/login', label: t('header.login') }} />
        ) : !isSeller ? (
          <MessageCard text={t('myProducts.sellerOnly')} action={{ to: '/profile', label: t('header.myProfile') }} />
        ) : (
          <>
            <Stats />

            <ScrollReveal className="flex flex-col gap-4 rounded-2xl border border-mynted-border bg-white p-4 lg:flex-row lg:items-center lg:gap-8">
              <FilterChips
                label={t('myProducts.filter.status')}
                options={STATUS_FILTERS}
                value={status}
                onChange={setStatus}
              />
              <div className="hidden h-6 w-px bg-mynted-border lg:block" aria-hidden="true" />
              <FilterChips label={t('myProducts.filter.type')} options={TYPE_FILTERS} value={type} onChange={setType} />
              <div className="relative lg:ml-auto lg:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mynted-gray" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('myProducts.search.placeholder')}
                  aria-label={t('myProducts.search.placeholder')}
                  className="w-full rounded-[10px] border border-mynted-border bg-white py-2 pr-3 pl-9 text-sm text-mynted-ink outline-none placeholder:text-mynted-gray-light focus:border-mynted-orange focus:ring-2 focus:ring-mynted-orange/20"
                />
              </div>
            </ScrollReveal>

            {actionError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
                {actionError}
              </p>
            )}

            {query.isPending ? (
              <div className="flex flex-col gap-3" aria-busy="true">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : query.isError ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-mynted-border bg-white px-6 py-12 text-center">
                <p className="text-sm text-red-500">{getApiErrorMessage(query.error)}</p>
                <Button type="button" variant="secondary" size="md" onClick={() => void query.refetch()}>
                  {t('myProducts.retry')}
                </Button>
              </div>
            ) : sections.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
                <p className="text-sm font-semibold text-mynted-ink">
                  {status || type || searchQuery ? t('myProducts.emptyFiltered.title') : t('myProducts.empty.title')}
                </p>
                <p className="max-w-sm text-sm text-mynted-gray">
                  {status || type || searchQuery ? t('myProducts.emptyFiltered.body') : t('myProducts.empty.body')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {sections.map((section) => (
                  <section
                    key={section.tag.tagId}
                    className="flex flex-col gap-3"
                    aria-label={t('shop.sectionLabel', { tag: section.tag.name })}
                  >
                    <ScrollReveal className="flex items-baseline gap-3">
                      <h2 className="font-heading text-[22px] font-semibold text-mynted-ink">#{section.tag.name}</h2>
                      <span className="text-sm text-mynted-gray">
                        {t('myProducts.sectionCount', { count: section.totalProducts })}
                      </span>
                    </ScrollReveal>
                    <ul className="flex flex-col gap-3">
                      {section.products.map((product, index) => (
                        <StaggerItem key={product.id} index={index}>
                          <ProductRow
                            product={product}
                            isBusy={publishMutation.isPending || statusMutation.isPending}
                            onPublish={() => void runDirectAction(() => publishMutation.mutateAsync(product.id))}
                            onReactivate={() =>
                              void runDirectAction(() => statusMutation.mutateAsync({ productId: product.id, status: 'active' }))
                            }
                            onChange={(kind) => setPendingChange({ product, kind })}
                          />
                        </StaggerItem>
                      ))}
                    </ul>
                  </section>
                ))}

                {hasNextPage && (
                  <div ref={sentinelRef} className="flex justify-center py-4" aria-live="polite">
                    <span className="text-sm text-mynted-gray">{isFetchingNextPage ? t('shop.loadingMore') : ''}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <StatusConfirmDialog change={pendingChange} onClose={() => setPendingChange(null)} />
    </div>
  )
}

function MessageCard({ text, action }: { text: string; action: { to: '/login' | '/profile'; label: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
      <p className="text-sm text-mynted-gray">{text}</p>
      <Link
        to={action.to}
        className="rounded-[10px] bg-mynted-orange px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mynted-orange-hover"
      >
        {action.label}
      </Link>
    </div>
  )
}

function Stats() {
  const { t } = useLanguage()
  // Totales calculados por el backend (GET /products/me/stats).
  const stats = useMyProductsStats()

  const items: { label: TranslationKey; value: number | undefined }[] = [
    { label: 'myProducts.stats.total', value: stats.data?.total },
    { label: 'myProducts.stats.draft', value: stats.data?.draft },
    { label: 'myProducts.stats.active', value: stats.data?.active },
    { label: 'myProducts.stats.sold', value: stats.data?.sold },
    { label: 'myProducts.stats.paused', value: stats.data?.inactive },
  ]

  return (
    <ScrollReveal>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 rounded-2xl border border-mynted-border bg-white px-5 py-4">
            <dt className="text-xs font-medium text-mynted-gray">{t(item.label)}</dt>
            <dd className="font-heading text-[28px] leading-none font-semibold text-mynted-ink">
              {item.value ??
                (stats.isError ? '—' : <span className="inline-block h-7 w-10 animate-pulse rounded bg-mynted-bg align-middle" />)}
            </dd>
          </div>
        ))}
      </dl>
    </ScrollReveal>
  )
}

function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T | undefined; label: TranslationKey }[]
  value: T | undefined
  onChange: (value: T | undefined) => void
}) {
  const { t } = useLanguage()
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 min-w-12 text-xs font-semibold text-mynted-gray">{label}</span>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:cursor-pointer ${
              selected
                ? 'border-mynted-orange bg-mynted-orange/10 text-mynted-orange'
                : 'border-mynted-border text-mynted-ink hover:border-mynted-orange/60'
            }`}
          >
            {t(option.label)}
          </button>
        )
      })}
    </div>
  )
}

type PendingKind = 'sold' | 'inactive' | 'delete'
interface PendingChange {
  product: MyProductCard
  kind: PendingKind
}

function ProductRow({
  product,
  isBusy,
  onPublish,
  onReactivate,
  onChange,
}: {
  product: MyProductCard
  isBusy: boolean
  onPublish: () => void
  onReactivate: () => void
  onChange: (kind: PendingKind) => void
}) {
  const { t } = useLanguage()
  const detail = [
    product.type ? t(product.type === 'sale' ? 'products.type.sale' : 'products.type.exchange') : null,
    product.condition ? t(CONDITION_LABEL[product.condition]) : null,
    product.community?.name ?? t('products.create.noCommunity'),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-mynted-border bg-white p-4 sm:flex-row sm:items-center">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="block size-24 shrink-0 overflow-hidden rounded-xl bg-mynted-bg sm:size-20"
      >
        {product.imageUrl && <img src={product.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/products/$productId"
            params={{ productId: String(product.id) }}
            className="truncate text-base font-semibold text-mynted-ink hover:underline"
          >
            {product.title}
          </Link>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[product.status]}`}>
            {t(STATUS_LABEL[product.status])}
          </span>
          {!product.isVisible && (
            <span className="rounded-full bg-mynted-bg px-2.5 py-0.5 text-[11px] font-semibold text-mynted-gray">
              {t('myProducts.badge.hidden')}
            </span>
          )}
        </div>
        {product.price !== null && product.currency ? (
          <ProductPrice
            price={product.price}
            finalPrice={product.finalPrice}
            discountPercent={product.discountPercent}
            currency={product.currency}
            className="text-sm font-semibold text-mynted-orange"
          />
        ) : (
          <p className="text-sm text-mynted-gray">—</p>
        )}
        <p className="text-xs text-mynted-gray">{detail}</p>
        <ul className="flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <li key={tag.tagId} className="rounded-full bg-mynted-bg px-2.5 py-0.5 text-[11px] text-mynted-ink">
              #{tag.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {product.status === 'draft' && (
          <Button type="button" variant="primary" size="sm" disabled={isBusy} onClick={onPublish}>
            <Rocket className="size-4" aria-hidden="true" />
            {t('myProducts.action.publish')}
          </Button>
        )}
        {product.status === 'inactive' && (
          <Button type="button" variant="secondary" size="sm" disabled={isBusy} onClick={onReactivate}>
            <Play className="size-4" aria-hidden="true" />
            {t('myProducts.action.reactivate')}
          </Button>
        )}
        <Link
          to="/products/$productId/edit"
          params={{ productId: String(product.id) }}
          className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-mynted-border bg-white px-3 text-sm font-medium text-mynted-ink transition-colors hover:border-mynted-orange/60"
        >
          <Pencil className="size-4" aria-hidden="true" />
          {t('myProducts.action.edit')}
        </Link>
        {product.status === 'active' && (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => onChange('inactive')}>
              <PauseCircle className="size-4" aria-hidden="true" />
              {t('myProducts.action.pause')}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => onChange('sold')}>
              <PackageCheck className="size-4" aria-hidden="true" />
              {t('myProducts.action.markSold')}
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-red-600"
          onClick={() => onChange('delete')}
          aria-label={t('myProducts.action.deleteLabel', { title: product.title })}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {t('myProducts.action.delete')}
        </Button>
      </div>
    </article>
  )
}

/**
 * Pide confirmación antes de pausar, marcar como vendido (el backend no deja
 * volver de "vendido" a "activo") o eliminar un producto.
 */
function StatusConfirmDialog({ change, onClose }: { change: PendingChange | null; onClose: () => void }) {
  const { t } = useLanguage()
  const statusMutation = useUpdateProductStatusMutation()
  const deleteMutation = useDeleteProductMutation()
  const mutation = change?.kind === 'delete' ? deleteMutation : statusMutation

  // Se conserva el último cambio para que el texto no desaparezca durante la animación de cierre.
  const [last, setLast] = useState(change)
  if (change && change !== last) setLast(change)
  const shown = change ?? last

  async function confirm() {
    if (!change) return
    try {
      if (change.kind === 'delete') {
        await deleteMutation.mutateAsync(change.product.id)
      } else {
        const next: PublishedProductStatus = change.kind
        await statusMutation.mutateAsync({ productId: change.product.id, status: next })
      }
      onClose()
    } catch {
      // el error se muestra abajo (mutation.error)
    }
  }

  const titleKey: TranslationKey =
    shown?.kind === 'sold'
      ? 'myProducts.confirm.soldTitle'
      : shown?.kind === 'delete'
        ? 'myProducts.confirm.deleteTitle'
        : 'myProducts.confirm.pauseTitle'
  const bodyKey: TranslationKey =
    shown?.kind === 'sold'
      ? 'myProducts.confirm.soldBody'
      : shown?.kind === 'delete'
        ? 'myProducts.confirm.deleteBody'
        : 'myProducts.confirm.pauseBody'

  return (
    <Dialog
      open={change !== null}
      onOpenChange={(open) => {
        if (!open) {
          statusMutation.reset()
          deleteMutation.reset()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t(titleKey)}</DialogTitle>
          <DialogDescription>{shown ? t(bodyKey, { title: shown.product.title }) : ''}</DialogDescription>
        </DialogHeader>
        {mutation.isError && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {getApiErrorMessage(mutation.error)}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" size="md" disabled={mutation.isPending} onClick={onClose}>
            {t('profile.edit.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={mutation.isPending}
            isLoading={mutation.isPending}
            onClick={() => void confirm()}
          >
            {t('myProducts.confirm.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
