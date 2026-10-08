import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Slider as AriaSlider, SliderThumb as AriaSliderThumb, SliderTrack as AriaSliderTrack } from 'react-aria-components'
import { getApiErrorMessage, isUnauthorizedError } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { FilterGroup } from '@/components/ui/FilterGroup'
import { TalkFeed } from '@/features/community/components/sections/TalkFeed'
import { LoginPrompt } from '@/components/ui/LoginPrompt'
import { ScrollReveal, StaggerItem } from '@/components/ui/ScrollReveal'
import { useCategories } from '@/features/community/hooks/useCommunitiesQueries'
import { CONDITION_LABEL } from '@/features/products/components/productFormShared'
import { ShopProductCard } from '@/features/products/components/ShopProductCard'
import { useExploreProducts } from '@/features/products/hooks/useProductQueries'
import {
  PRODUCT_CONDITIONS,
  type ExploreFilters,
  type ProductCondition,
  type ProductType,
} from '@/features/products/models/product'
import { useLanguage } from '@/i18n/LanguageContext'
import { useDisplayCurrency } from '@/features/auth/hooks/useDisplayCurrency'
import type { TranslationKey } from '@/i18n/translations/es'
import { INTL_LOCALES } from '@/utils/locale'
import { SiteHeader } from '../components/layout/SiteHeader'

type ExploreTab = 'shop' | 'talk'

const EXPLORE_TABS: { id: ExploreTab; labelKey: TranslationKey }[] = [
  { id: 'shop', labelKey: 'shop.tab.shop' },
  { id: 'talk', labelKey: 'shop.tab.talk' },
]

const EXPLORE_GRID_CLASS = 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3'

/** Conteo de resultados: entra con un fade y se anima otra vez cuando cambia el número (al filtrar). */
function ResultsCount({ total }: { total: number }) {
  const { t, language } = useLanguage()
  const reduceMotion = useReducedMotion()
  const locale = INTL_LOCALES[language]
  // Intl.PluralRules aplica la regla de cada idioma (en francés 0 es singular, en español es plural).
  const isSingular = new Intl.PluralRules(locale).select(total) === 'one'

  return (
    <p className="text-sm text-mynted-gray" aria-live="polite">
      <motion.span
        key={total}
        className="inline-block"
        initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {t(isSingular ? 'explore.results.one' : 'explore.results.other', { count: total.toLocaleString(locale) })}
      </motion.span>
    </p>
  )
}

/**
 * Escala del slider de precio. Los precios van de unos pocos dólares a
 * cientos de miles de colones, así que el slider recorre estos escalones (no
 * una escala lineal). El primer escalón es "sin mínimo" y el último "sin máximo".
 */
const PRICE_STEPS = [
  0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000,
]
const LAST_STEP = PRICE_STEPS.length - 1

/**
 * Explorar: catálogo general de productos activos (GET /products) con filtros
 * por categoría, tipo, condición y rango de precio, y scroll infinito. Se ve
 * sin sesión: si el backend responde 401 (GET /products todavía exige login),
 * se muestra una invitación a entrar en vez del catálogo.
 */
export default function ExplorePage() {
  const { t } = useLanguage()

  const [category, setCategory] = useState<number | undefined>()
  const [type, setType] = useState<ProductType | undefined>()
  const [condition, setCondition] = useState<ProductCondition | undefined>()
  const [priceSteps, setPriceSteps] = useState<[number, number]>([0, LAST_STEP])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ExploreTab>('shop')

  const filters: ExploreFilters = {
    ...(category !== undefined && { category }),
    ...(type && { type }),
    ...(condition && { condition }),
    ...(priceSteps[0] > 0 && { priceMin: PRICE_STEPS[priceSteps[0]] }),
    ...(priceSteps[1] < LAST_STEP && { priceMax: PRICE_STEPS[priceSteps[1]] }),
  }
  const activeCount = Object.keys(filters).length

  const products = useExploreProducts(filters)
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
    setCategory(undefined)
    setType(undefined)
    setCondition(undefined)
    setPriceSteps([0, LAST_STEP])
  }

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        <ScrollReveal>
          <div role="tablist" className="flex items-center gap-2">
            {EXPLORE_TABS.map(({ id, labelKey }) => {
              const isActive = activeTab === id
              return (
                <Button
                  key={id}
                  variant="ghost"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(id)}
                  className={`rounded-[10px] px-[18px] text-[15px] ${
                    isActive
                      ? 'bg-[#ffdfd1] font-semibold text-mynted-orange hover:bg-[#ffdfd1] hover:text-mynted-orange'
                      : 'bg-[#f3f3f2] font-medium text-mynted-gray hover:text-mynted-ink'
                  }`}
                >
                  {t(labelKey)}
                </Button>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-[26px] font-semibold text-mynted-ink">{t('explore.title')}</h1>
            <p className="text-sm text-mynted-gray">
              {t(activeTab === 'talk' ? 'talk.subtitle' : 'explore.subtitle')}
            </p>
          </div>
          {activeTab === 'shop' && (
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
                <span className="grid size-5 place-items-center rounded-full bg-mynted-orange text-[11px] text-white">
                  {activeCount}
                </span>
              )}
            </Button>
          )}
        </ScrollReveal>

        {activeTab === 'talk' ? (
          <TalkFeed source="all" />
        ) : (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-8">
            <ScrollReveal className={`${filtersOpen ? 'block' : 'hidden'} lg:sticky lg:top-28 lg:block`}>
              <aside
                aria-label={t('explore.filters.title')}
                className="flex flex-col gap-5 rounded-2xl border border-mynted-border bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('explore.filters.title')}</h2>
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

                <CategoryFilter value={category} onChange={setCategory} />

                <FilterGroup label={t('explore.filters.type')}>
                  <Chip selected={type === undefined} onClick={() => setType(undefined)}>
                    {t('explore.filters.all')}
                  </Chip>
                  <Chip selected={type === 'sale'} onClick={() => setType('sale')}>
                    {t('products.type.sale')}
                  </Chip>
                  <Chip selected={type === 'exchange'} onClick={() => setType('exchange')}>
                    {t('products.type.exchange')}
                  </Chip>
                </FilterGroup>

                <FilterGroup label={t('explore.filters.condition')}>
                  <Chip selected={condition === undefined} onClick={() => setCondition(undefined)}>
                    {t('explore.filters.all')}
                  </Chip>
                  {PRODUCT_CONDITIONS.map((item) => (
                    <Chip key={item} selected={condition === item} onClick={() => setCondition(item)}>
                      {t(CONDITION_LABEL[item])}
                    </Chip>
                  ))}
                </FilterGroup>

                <PriceSlider value={priceSteps} onChange={setPriceSteps} />
              </aside>
            </ScrollReveal>

            <section aria-label={t('explore.title')} className="flex min-w-0 flex-col gap-4">
              {/* Altura reservada: así la lista no salta hacia abajo cuando aparece el conteo. */}
              <div className="min-h-5">{total !== undefined && <ResultsCount total={total} />}</div>

              {products.isPending ? (
                <div className={EXPLORE_GRID_CLASS} aria-busy="true">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="h-[300px] animate-pulse rounded-[14px] bg-white" />
                  ))}
                </div>
              ) : products.isError && isUnauthorizedError(products.error) ? (
                <LoginPrompt message={t('explore.loginPrompt')} />
              ) : products.isError ? (
                <div
                  className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center"
                  role="alert"
                >
                  <p className="text-sm font-semibold text-mynted-ink">{t('products.list.loadError')}</p>
                  <p className="text-sm text-mynted-gray">{getApiErrorMessage(products.error)}</p>
                  <Button type="button" onClick={() => void products.refetch()} variant="secondary" size="sm" className="mt-2">
                    {t('communities.list.retry')}
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center">
                  <p className="text-sm font-semibold text-mynted-ink">{t('explore.empty.title')}</p>
                  <p className="max-w-sm text-sm text-mynted-gray">{t('explore.empty.body')}</p>
                  {activeCount > 0 && (
                    <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={clearFilters}>
                      {t('explore.filters.clear')}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <ul className={EXPLORE_GRID_CLASS}>
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
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:cursor-pointer ${
        selected
          ? 'border-mynted-orange bg-mynted-orange/10 text-mynted-orange'
          : 'border-mynted-border text-mynted-ink hover:border-mynted-orange/60'
      }`}
    >
      {children}
    </button>
  )
}

function PriceSlider({ value, onChange }: { value: [number, number]; onChange: (value: [number, number]) => void }) {
  const { t, language } = useLanguage()
  const currency = useDisplayCurrency()
  // Mientras se arrastra solo cambia el texto; el filtro se aplica al soltar.
  const [draft, setDraft] = useState<[number, number]>(value)
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  function format(step: number): string {
    const amount = PRICE_STEPS[step]
    try {
      return new Intl.NumberFormat(INTL_LOCALES[language], {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return String(amount)
    }
  }

  const minLabel = draft[0] === 0 ? t('explore.price.noMin') : format(draft[0])
  const maxLabel = draft[1] === LAST_STEP ? `${format(LAST_STEP)}+` : format(draft[1])

  return (
    <div role="group" aria-label={t('explore.filters.price')} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-mynted-gray">{t('explore.filters.price')}</span>
        <span className="text-xs font-semibold text-mynted-ink tabular-nums">
          {minLabel} – {maxLabel}
        </span>
      </div>
      <AriaSlider
        minValue={0}
        maxValue={LAST_STEP}
        step={1}
        value={draft}
        onChange={(next) => setDraft(next as [number, number])}
        onChangeEnd={(next) => onChange(next as [number, number])}
        aria-label={t('explore.filters.price')}
      >
        <AriaSliderTrack className="relative flex h-6 w-full items-center">
          {({ state }) => (
            <>
              <div className="absolute h-1.5 w-full rounded-full bg-mynted-border" />
              <div
                className="absolute h-1.5 rounded-full bg-mynted-orange"
                style={{
                  left: `${state.getThumbPercent(0) * 100}%`,
                  width: `${(state.getThumbPercent(1) - state.getThumbPercent(0)) * 100}%`,
                }}
              />
              <AriaSliderThumb
                index={0}
                aria-label={t('explore.price.min')}
                className="top-1/2 size-5 cursor-grab rounded-full border-2 border-mynted-orange bg-white shadow outline-none transition-transform focus-visible:ring-2 focus-visible:ring-mynted-orange/40 dragging:scale-110 dragging:cursor-grabbing"
              />
              <AriaSliderThumb
                index={1}
                aria-label={t('explore.price.max')}
                className="top-1/2 size-5 cursor-grab rounded-full border-2 border-mynted-orange bg-white shadow outline-none transition-transform focus-visible:ring-2 focus-visible:ring-mynted-orange/40 dragging:scale-110 dragging:cursor-grabbing"
              />
            </>
          )}
        </AriaSliderTrack>
      </AriaSlider>
    </div>
  )
}

function CategoryFilter({ value, onChange }: { value: number | undefined; onChange: (id: number | undefined) => void }) {
  const { t } = useLanguage()
  const categories = useCategories()

  return (
    <FilterGroup label={t('explore.filters.category')}>
      <Chip selected={value === undefined} onClick={() => onChange(undefined)}>
        {t('explore.filters.all')}
      </Chip>
      {categories.isPending &&
        Array.from({ length: 3 }, (_, index) => <span key={index} className="h-7 w-16 animate-pulse rounded-full bg-mynted-bg" />)}
      {categories.data?.map((category) => (
        <Chip key={category.categoryId} selected={value === category.categoryId} onClick={() => onChange(category.categoryId)}>
          {category.name}
        </Chip>
      ))}
    </FilterGroup>
  )
}
