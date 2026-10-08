import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PackageCheck, PauseCircle, Pencil, Plus } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { CONDITION_LABEL } from '@/features/products/components/productFormShared'
import { EditProductDialog } from '@/features/products/components/EditProductDialog'
import { useUpdateProductStatusMutation } from '@/features/products/hooks/useProductMutations'
import { useMyProductsDashboard, useMyProductsStats } from '@/features/products/hooks/useProductQueries'
import type { MyProductCard, MyProductsFilters, ProductStatus, ProductType } from '@/features/products/models/product'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES, type AppLanguage } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'

const STATUS_FILTERS: { value: ProductStatus | undefined; label: TranslationKey }[] = [
  { value: undefined, label: 'myProducts.filter.all' },
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
  active: 'myProducts.status.active',
  sold: 'products.status.sold',
  inactive: 'products.status.inactive',
}

const STATUS_STYLE: Record<ProductStatus, string> = {
  active: 'bg-teal-50 text-teal-700',
  sold: 'bg-mynted-ink/10 text-mynted-ink',
  inactive: 'bg-amber-50 text-amber-700',
}

function formatPrice(price: number, currency: string, language: AppLanguage): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALES[language], { style: 'currency', currency }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}

/**
 * Panel del vendedor ("Mis productos"): lista sus publicaciones agrupadas por
 * tag (GET /products/me), con filtros por estado/tipo, edición
 * (PATCH /products/:id) y cambio de estado a vendido/pausado
 * (PATCH /products/:id/status, no se puede volver a "activo").
 */
export default function MyProductsPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data: user, isLoggedIn, isLoading: isLoadingUser } = useCurrentUser()
  const isSeller = user?.role === 'seller'

  const [status, setStatus] = useState<ProductStatus | undefined>(undefined)
  const [type, setType] = useState<ProductType | undefined>(undefined)
  const filters: MyProductsFilters = { ...(status && { status }), ...(type && { type }) }

  const query = useMyProductsDashboard(filters, isSeller)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingChange, setPendingChange] = useState<{ product: MyProductCard; status: 'sold' | 'inactive' } | null>(null)

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
            </ScrollReveal>

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
                  {status || type ? t('myProducts.emptyFiltered.title') : t('myProducts.empty.title')}
                </p>
                <p className="max-w-sm text-sm text-mynted-gray">
                  {status || type ? t('myProducts.emptyFiltered.body') : t('myProducts.empty.body')}
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
                            onEdit={() => setEditingId(product.id)}
                            onChangeStatus={(next) => setPendingChange({ product, status: next })}
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
      <EditProductDialog productId={editingId} onClose={() => setEditingId(null)} />
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
    { label: 'myProducts.stats.active', value: stats.data?.active },
    { label: 'myProducts.stats.sold', value: stats.data?.sold },
    { label: 'myProducts.stats.paused', value: stats.data?.inactive },
  ]

  return (
    <ScrollReveal>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

function ProductRow({
  product,
  onEdit,
  onChangeStatus,
}: {
  product: MyProductCard
  onEdit: () => void
  onChangeStatus: (status: 'sold' | 'inactive') => void
}) {
  const { t, language } = useLanguage()
  const isActive = product.status === 'active'

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-mynted-border bg-white p-4 sm:flex-row sm:items-center">
      <Link
        to="/products/$productId"
        params={{ productId: String(product.id) }}
        className="block size-24 shrink-0 overflow-hidden rounded-xl bg-mynted-bg sm:size-20"
      >
        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
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
        </div>
        <p className="text-sm font-semibold text-mynted-orange">{formatPrice(product.price, product.currency, language)}</p>
        <p className="text-xs text-mynted-gray">
          {t(product.type === 'sale' ? 'products.type.sale' : 'products.type.exchange')} · {t(CONDITION_LABEL[product.condition])} ·{' '}
          {product.community.name}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <li key={tag.tagId} className="rounded-full bg-mynted-bg px-2.5 py-0.5 text-[11px] text-mynted-ink">
              #{tag.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" />
          {t('myProducts.action.edit')}
        </Button>
        {isActive && (
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => onChangeStatus('inactive')}>
              <PauseCircle className="size-4" aria-hidden="true" />
              {t('myProducts.action.pause')}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => onChangeStatus('sold')}>
              <PackageCheck className="size-4" aria-hidden="true" />
              {t('myProducts.action.markSold')}
            </Button>
          </>
        )}
      </div>
    </article>
  )
}

/** Pide confirmación antes de cambiar el estado: el backend no permite volver a "activo". */
function StatusConfirmDialog({
  change,
  onClose,
}: {
  change: { product: MyProductCard; status: 'sold' | 'inactive' } | null
  onClose: () => void
}) {
  const { t } = useLanguage()
  const mutation = useUpdateProductStatusMutation()

  // Se conserva el último cambio para que el texto no desaparezca durante la animación de cierre.
  const [last, setLast] = useState(change)
  if (change && change !== last) setLast(change)
  const shown = change ?? last

  async function confirm() {
    if (!change) return
    try {
      await mutation.mutateAsync({ productId: change.product.id, status: change.status })
      onClose()
    } catch {
      // el error se muestra abajo (mutation.error)
    }
  }

  return (
    <Dialog
      open={change !== null}
      onOpenChange={(open) => {
        if (!open) {
          mutation.reset()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {shown?.status === 'sold' ? t('myProducts.confirm.soldTitle') : t('myProducts.confirm.pauseTitle')}
          </DialogTitle>
          <DialogDescription>
            {shown
              ? t(shown.status === 'sold' ? 'myProducts.confirm.soldBody' : 'myProducts.confirm.pauseBody', {
                  title: shown.product.title,
                })
              : ''}
          </DialogDescription>
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
