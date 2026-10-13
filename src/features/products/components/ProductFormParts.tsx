import { useId, useRef, type ReactNode } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTags } from '@/features/community/hooks/useCommunitiesQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { MAX_GALLERY_IMAGES, REQUIRED_PRODUCT_TAGS } from '../models/product'
import { errorClass, hintClass, labelClass } from './productFormShared'

/**
 * Piezas compartidas de los formularios de producto (crear en
 * CreateProductPage, editar en EditProductDialog).
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

export function CoverPicker({ file, error, onChange }: { file: File | null; error?: string; onChange: (file: File | null) => void }) {
  const { t } = useLanguage()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = useObjectUrl(file)

  return (
    // relative: el <input type="file"> (sr-only, posición absoluta) queda anclado a
    // este bloque; así, cuando el navegador le devuelve el foco al cerrar el
    // explorador de archivos, no hace saltar el scroll del diálogo.
    <div className="relative flex flex-col gap-1.5">
      <span className={labelClass}>{t('products.create.coverLabel')}</span>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-mynted-border">
          <img src={preview} alt={t('products.create.coverPreviewAlt')} className="h-52 w-full object-cover" />
          <div className="absolute right-3 bottom-3 flex gap-2">
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              variant="secondary"
              size="sm"
              className="border-0 bg-white/95 shadow hover:bg-white"
            >
              {t('products.create.changeImage')}
            </Button>
            <Button
              type="button"
              onClick={() => onChange(null)}
              aria-label={t('products.create.removeImage')}
              variant="secondary"
              size="icon-sm"
              className="border-0 bg-white/95 text-red-600 shadow hover:bg-white"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-mynted-bg/60 text-center transition-colors hover:border-mynted-orange ${
            error ? 'border-red-300' : 'border-mynted-border'
          }`}
        >
          <ImagePlus className="size-7 text-mynted-orange" aria-hidden="true" />
          <span className="text-sm font-semibold text-mynted-ink">{t('products.create.coverCta')}</span>
          <span className={hintClass}>{t('products.create.imageHint')}</span>
        </label>
      )}
      {error && <span className={errorClass}>{error}</span>}
    </div>
  )
}

export function GalleryThumb({ file, index, onRemove }: { file: File; index: number; onRemove: () => void }) {
  const { t } = useLanguage()
  const preview = useObjectUrl(file)
  return (
    <li className="relative aspect-square overflow-hidden rounded-lg border border-mynted-border">
      {preview && <img src={preview} alt={t('products.create.galleryImageAlt', { number: index + 1 })} className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('products.create.removeGalleryImage', { number: index + 1 })}
        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-white/95 text-mynted-ink shadow hover:cursor-pointer"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  )
}

export function GalleryPicker({
  files,
  onAdd,
  onRemove,
}: {
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
}) {
  const { t } = useLanguage()
  const inputId = useId()
  const canAdd = files.length < MAX_GALLERY_IMAGES

  return (
    <div className="relative flex flex-col gap-1.5">
      <span className={labelClass}>{t('products.create.galleryLabel')}</span>
      <span className={hintClass}>
        {t('products.create.galleryHint', { count: files.length, max: MAX_GALLERY_IMAGES })}
      </span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={!canAdd}
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <ul className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {files.map((file, index) => (
          <GalleryThumb key={`${file.name}-${file.lastModified}-${index}`} file={file} index={index} onRemove={() => onRemove(index)} />
        ))}
        {canAdd && (
          <li>
            <label
              htmlFor={inputId}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-mynted-border px-1.5 text-center text-mynted-gray transition-colors hover:border-mynted-orange hover:text-mynted-orange"
            >
              <ImagePlus className="size-5 shrink-0" aria-hidden="true" />
              <span className="text-[11px] leading-tight font-semibold">{t('products.create.addImages')}</span>
            </label>
          </li>
        )}
      </ul>
    </div>
  )
}

/**
 * Selector de exactamente 3 tags. Muestra los tags generales y los de la
 * categoría de la comunidad elegida (mismo criterio que TagPicker al crear
 * una comunidad).
 */
export function ProductTagPicker({
  hasCommunity,
  categoryId,
  selected,
  onChange,
  error,
  showAllCategories = false,
}: {
  hasCommunity: boolean
  categoryId: number | null
  /** Sin categoría conocida: muestra todos los tags en vez de solo los generales. */
  showAllCategories?: boolean
  selected: number[]
  onChange: (ids: number[]) => void
  error?: string
}) {
  const { t } = useLanguage()
  const tagsQuery = useTags()
  // Los tags dependen de la categoría de la comunidad: sin comunidad elegida no se muestran.
  const tags = hasCommunity
    ? tagsQuery.data?.filter((tag) => showAllCategories || tag.categoryId === null || tag.categoryId === categoryId)
    : []

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={labelClass}>{t('products.create.tagsLabel')}</legend>
      <p className={`${hintClass} mt-1.5`}>
        {t('products.create.tagsHint', { required: REQUIRED_PRODUCT_TAGS, count: selected.length })}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {hasCommunity &&
          tagsQuery.isPending &&
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
      {!hasCommunity && <span className={hintClass}>{t('products.create.tagsChooseCommunity')}</span>}
      {hasCommunity && tags?.length === 0 && <span className={hintClass}>{t('communities.tags.empty')}</span>}
      {tagsQuery.isError && <span className={errorClass}>{t('communities.tags.loadError')}</span>}
      {error && <span className={errorClass}>{error}</span>}
    </fieldset>
  )
}

