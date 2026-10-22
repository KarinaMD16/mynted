import { useId, useMemo, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useTags } from '@/features/community/hooks/useCommunitiesQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import { SHIPPING_REGIONS, regionFlag, regionName } from '@/utils/locale'
import { useMyProducts } from '../hooks/useProductQueries'
import { MAX_RELATED_PRODUCTS, REQUIRED_PRODUCT_TAGS } from '../models/product'
import { errorClass, hintClass, labelClass } from './productFormShared'

/**
 * Piezas del formulario de producto compartido por las pantallas de publicar
 * y de editar (ver ProductEditor.tsx).
 */

export function ChoiceChip({
  selected,
  onSelect,
  icon,
  children,
}: {
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center justify-center gap-2 h-10 rounded-xl border px-3 text-center text-sm font-medium transition-colors hover:cursor-pointer ${
        selected
          ? 'border-mynted-orange bg-mynted-orange/10 text-mynted-orange'
          : 'border-mynted-border text-mynted-ink hover:border-mynted-orange/60'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

/**
 * Selector de 3 tags. Si el producto va en una comunidad con categoría muestra
 * los tags generales y los de esa categoría (mismo criterio que TagPicker al
 * crear una comunidad); sin comunidad, o si no se conoce su categoría, muestra
 * todos.
 */
export function ProductTagPicker({
  categoryId,
  selected,
  onChange,
  error,
}: {
  /** Categoría de la comunidad elegida; null = sin comunidad (o categoría desconocida). */
  categoryId: number | null
  selected: number[]
  onChange: (ids: number[]) => void
  error?: string
}) {
  const { t } = useLanguage()
  const tagsQuery = useTags()
  const tags = tagsQuery.data?.filter((tag) => categoryId === null || tag.categoryId === null || tag.categoryId === categoryId)

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={labelClass}>{t('products.create.tagsLabel')}</legend>
      <p className={`${hintClass} mt-1.5`}>
        {t('products.create.tagsHint', { required: REQUIRED_PRODUCT_TAGS, count: selected.length })}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {tagsQuery.isPending &&
          Array.from({ length: 5 }, (_, index) => <span key={index} className="h-7 w-20 animate-pulse rounded-full bg-mynted-bg" />)}
        {tags?.map((tag) => {
          const isSelected = selected.includes(tag.tagId)
          const isDisabled = !isSelected && selected.length >= REQUIRED_PRODUCT_TAGS
          return (
            <button
              key={tag.tagId}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onChange(isSelected ? selected.filter((id) => id !== tag.tagId) : [...selected, tag.tagId])}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? 'border-mynted-yellow bg-mynted-yellow text-mynted-ink'
                  : 'border-mynted-border bg-white text-mynted-ink enabled:hover:border-mynted-orange'
              }`}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
      {tags?.length === 0 && <span className={hintClass}>{t('communities.tags.empty')}</span>}
      {tagsQuery.isError && <span className={errorClass}>{t('communities.tags.loadError')}</span>}
      {error && <span className={errorClass}>{error}</span>}
    </fieldset>
  )
}

/** Descuento en porcentaje (0–100). El precio original no cambia: el backend calcula el precio final. */
export function DiscountField({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-1.5">
      <TextField
        label={t('products.create.discountLabel')}
        placeholder="0"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(',', '.'))}
        onBlur={onBlur}
        error={error}
      />
      <span className={hintClass}>{t('products.create.discountHint')}</span>
    </div>
  )
}

/** Si el producto aparece en los listados públicos o queda oculto (solo se llega con el enlace). */
export function VisibilityToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const { t } = useLanguage()
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-mynted-orange"
      />
      <label htmlFor={id} className="flex cursor-pointer flex-col gap-0.5">
        <span className={labelClass}>{t('products.create.visibleLabel')}</span>
        <span className={hintClass}>{t('products.create.visibleHint')}</span>
      </label>
    </div>
  )
}

/** Países a los que se envía: se agregan desde una lista y se quitan con la X de cada chip. */
export function ShipsToPicker({ selected, onChange }: { selected: string[]; onChange: (regions: string[]) => void }) {
  const { t, language } = useLanguage()
  const options = useMemo(
    () =>
      SHIPPING_REGIONS.filter((region) => !selected.includes(region))
        .map((region) => ({ value: region, label: `${regionFlag(region)} ${regionName(region, language)}` }))
        .sort((a, b) => a.label.localeCompare(b.label, language)),
    [selected, language],
  )

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{t('products.create.shipsToLabel')}</span>
      <Select
        value=""
        options={options}
        placeholder={t('products.create.shipsToAdd')}
        searchable
        searchPlaceholder={t('select.searchPlaceholder')}
        emptyLabel={(query) => t('select.noOptions', { query })}
        disabled={options.length === 0}
        onChange={(region) => onChange([...selected, region])}
      />
      {selected.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-2">
          {selected.map((region) => (
            <li
              key={region}
              className="flex items-center gap-1.5 rounded-full border border-mynted-border bg-white py-1 pr-1.5 pl-3 text-xs font-medium text-mynted-ink"
            >
              <span aria-hidden="true">{regionFlag(region)}</span>
              {regionName(region, language)}
              <button
                type="button"
                onClick={() => onChange(selected.filter((item) => item !== region))}
                aria-label={t('products.create.shipsToRemove', { country: regionName(region, language) })}
                className="grid size-5 place-items-center rounded-full text-mynted-gray hover:cursor-pointer hover:bg-mynted-bg hover:text-mynted-ink"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className={hintClass}>{t('products.create.shipsToHint')}</span>
    </div>
  )
}

/**
 * Productos relacionados que elige el vendedor (los muestra en el detalle como
 * "Más del vendedor"). Solo se pueden elegir productos propios y activos, hasta
 * MAX_RELATED_PRODUCTS. `excludeId` es el producto que se está editando.
 */
export function RelatedProductsPicker({
  selected,
  onChange,
  excludeId,
}: {
  selected: number[]
  onChange: (ids: number[]) => void
  excludeId?: number
}) {
  const { t } = useLanguage()
  const query = useMyProducts()
  const items = (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
    (product) => product.status === 'active' && product.id !== excludeId,
  )

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={labelClass}>{t('products.create.relatedLabel')}</legend>
      <p className={`${hintClass} mt-1.5`}>
        {t('products.create.relatedHint', { count: selected.length, max: MAX_RELATED_PRODUCTS })}
      </p>

      {query.isPending ? (
        <div className="mt-1.5 h-16 animate-pulse rounded-xl bg-mynted-bg" aria-busy="true" />
      ) : query.isError ? (
        <span className={errorClass}>{t('products.list.loadError')}</span>
      ) : items.length === 0 ? (
        <span className={hintClass}>{t('products.create.relatedEmpty')}</span>
      ) : (
        <ul className="mt-1.5 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
          {items.map((product) => {
            const isSelected = selected.includes(product.id)
            const isDisabled = !isSelected && selected.length >= MAX_RELATED_PRODUCTS
            return (
              <li key={product.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isDisabled}
                  onClick={() => onChange(isSelected ? selected.filter((id) => id !== product.id) : [...selected, product.id])}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
                    isSelected ? 'border-mynted-orange bg-mynted-orange/10' : 'border-mynted-border bg-white enabled:hover:border-mynted-orange/60',
                  )}
                >
                  <img src={product.imageUrl} alt="" className="size-10 shrink-0 rounded-lg bg-mynted-bg object-cover" />
                  <span className="line-clamp-2 min-w-0 flex-1 text-xs font-medium text-mynted-ink">{product.title}</span>
                  {isSelected && <Check className="size-4 shrink-0 text-mynted-orange" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {query.hasNextPage && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t('products.create.relatedMore')}
        </Button>
      )}
    </fieldset>
  )
}
