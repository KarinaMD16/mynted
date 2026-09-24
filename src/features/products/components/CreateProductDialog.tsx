import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import { CircleCheck, ImagePlus, LoaderCircle, Repeat, Tag, Trash2, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { TextField } from '@/components/ui/TextField'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useMyCommunities, useTags } from '@/features/community/hooks/useCommunitiesQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { getFieldErrorMessage } from '@/utils/form'
import { useCreateProductMutation } from '../hooks/useProductMutations'
import {
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  PRODUCT_CONDITIONS,
  REQUIRED_PRODUCT_TAGS,
  type ProductCondition,
  type ProductType,
} from '../models/product'
import { makeCreateProductSchema } from '../schema/createProductSchema'

/** Comunidad ya elegida (cuando se abre desde la tienda de una comunidad). */
export interface ProductTargetCommunity {
  id: number
  name: string
  categoryId: number | null
}

interface CreateProductDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Si viene, el producto se publica ahí y no se muestra el selector de comunidad. */
  community?: ProductTargetCommunity
}

const CONDITION_LABEL: Record<ProductCondition, TranslationKey> = {
  new: 'products.condition.new',
  like_new: 'products.condition.likeNew',
  good_condition: 'products.condition.good',
  used_with_details: 'products.condition.usedWithDetails',
}

const labelClass = 'text-[13px] font-medium text-mynted-ink'
const hintClass = 'text-xs text-mynted-gray'
const errorClass = 'text-xs text-red-500'

/**
 * Formulario para publicar un producto (POST communities/:id/products). Solo
 * se ofrece a cuentas con rol "seller" (ver ProfilePage y
 * CommunityDetailPage); el backend además lo exige con SellerGuard.
 */
export function CreateProductDialog({ isOpen, onClose, community }: CreateProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <CreateProductBody onClose={onClose} community={community} />
      </DialogContent>
    </Dialog>
  )
}

function CreateProductBody({ onClose, community }: { onClose: () => void; community?: ProductTargetCommunity }) {
  const { t } = useLanguage()
  const currency = useCurrentUser().data?.currency ?? 'CRC'
  const schema = useMemo(() => makeCreateProductSchema(t), [t])
  const mutation = useCreateProductMutation()

  // Si no viene una comunidad fija, se elige entre las comunidades de la persona.
  const myCommunitiesQuery = useMyCommunities({ limit: 100 }, !community)
  const communityOptions = useMemo<ProductTargetCommunity[]>(
    () =>
      community
        ? [community]
        : (myCommunitiesQuery.data?.data ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            categoryId: item.category?.categoryId ?? null,
          })),
    [community, myCommunitiesQuery.data],
  )

  const [cover, setCover] = useState<File | null>(null)
  const [gallery, setGallery] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [published, setPublished] = useState<{ title: string; communityName: string } | null>(null)

  const form = useForm({
    defaultValues: {
      communityId: community?.id ?? 0,
      title: '',
      description: '',
      price: '',
      type: 'sale' as ProductType,
      condition: '' as string,
      tagIds: [] as number[],
    },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      setCoverTouched(true)
      if (!cover) return
      try {
        await mutation.mutateAsync({
          communityId: value.communityId,
          payload: {
            title: value.title,
            description: value.description,
            price: Number(value.price),
            type: value.type,
            condition: value.condition as ProductCondition,
            tagIds: value.tagIds,
            image: cover,
            images: gallery,
          },
        })
        setPublished({
          title: value.title.trim(),
          communityName: communityOptions.find((item) => item.id === value.communityId)?.name ?? '',
        })
      } catch {
        // el error se muestra abajo del form (mutation.error)
      }
    },
  })

  /** Valida tamaño y tipo; devuelve solo los archivos aceptables. */
  function acceptImages(files: File[]): File[] {
    const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES)
    if (valid.length < files.length) setImageError(t('products.create.imageInvalid'))
    else setImageError(null)
    return valid
  }

  if (published) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-teal-50 text-teal-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <DialogTitle className="text-xl">{t('products.create.successTitle')}</DialogTitle>
        <DialogDescription>
          {t('products.create.successBody', { title: published.title, community: published.communityName })}
        </DialogDescription>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              form.reset()
              setCover(null)
              setGallery([])
              setCoverTouched(false)
              setImageError(null)
              mutation.reset()
              setPublished(null)
            }}
            className="rounded-xl border border-mynted-border bg-white px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg"
          >
            {t('products.create.publishAnother')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-mynted-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover"
          >
            {t('profile.becomeSeller.done')}
          </button>
        </div>
      </div>
    )
  }

  const hasNoCommunities = !community && myCommunitiesQuery.isSuccess && communityOptions.length === 0

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">{t('products.create.title')}</DialogTitle>
        <DialogDescription>{t('products.create.subtitle')}</DialogDescription>
      </DialogHeader>

      {hasNoCommunities ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-mynted-border px-6 py-10 text-center">
          <p className="text-sm font-semibold text-mynted-ink">{t('products.create.noCommunitiesTitle')}</p>
          <p className="max-w-sm text-sm text-mynted-gray">{t('products.create.noCommunitiesBody')}</p>
          <Link
            to="/communities"
            onClick={onClose}
            className="mt-1 rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
          >
            {t('landing.hero.communitiesCta')}
          </Link>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setCoverTouched(true)
            void form.handleSubmit()
          }}
        >
          <div className="mt-6 flex flex-col gap-5">
            {/* Comunidad */}
            {community ? (
              <p className="rounded-xl bg-mynted-bg px-4 py-3 text-sm text-mynted-ink">
                {t('products.create.publishingIn', { community: community.name })}
              </p>
            ) : (
              <form.Field name="communityId">
                {(field) => {
                  const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
                  return (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="product-community" className={labelClass}>
                        {t('products.create.communityLabel')}
                      </label>
                      <select
                        id="product-community"
                        value={field.state.value || ''}
                        disabled={myCommunitiesQuery.isPending}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(Number(event.target.value))
                          // Los tags dependen de la categoría de la comunidad: se reinician.
                          form.setFieldValue('tagIds', [])
                        }}
                        className={`w-full cursor-pointer rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none focus:ring-2 focus:ring-mynted-orange/20 ${
                          error ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange'
                        }`}
                      >
                        <option value="" disabled>
                          {myCommunitiesQuery.isPending ? t('loader.default') : t('products.create.communityPlaceholder')}
                        </option>
                        {communityOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      <span className={hintClass}>{t('products.create.communityHint')}</span>
                      {error && <span className={errorClass}>{error}</span>}
                    </div>
                  )
                }}
              </form.Field>
            )}

            {/* Portada */}
            <CoverPicker
              file={cover}
              error={coverTouched && !cover ? t('validation.product.coverRequired') : undefined}
              onChange={(file) => {
                const [valid] = acceptImages(file ? [file] : [])
                setCover(valid ?? null)
                setCoverTouched(true)
              }}
            />

            <form.Field name="title">
              {(field) => (
                <TextField
                  label={t('products.create.titleLabel')}
                  placeholder={t('products.create.titlePlaceholder')}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
                />
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => {
                const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
                return (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="product-description" className={labelClass}>
                      {t('products.create.descriptionLabel')}
                    </label>
                    <textarea
                      id="product-description"
                      rows={4}
                      placeholder={t('products.create.descriptionPlaceholder')}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={Boolean(error)}
                      className={`w-full resize-y rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-mynted-ink outline-none placeholder:text-mynted-gray-light focus:ring-2 focus:ring-mynted-orange/20 ${
                        error ? 'border-red-400' : 'border-mynted-border focus:border-mynted-orange'
                      }`}
                    />
                    {error && <span className={errorClass}>{error}</span>}
                  </div>
                )
              }}
            </form.Field>

            {/* Tipo + precio */}
            <div className="grid gap-5 sm:grid-cols-2">
              <form.Field name="type">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <span className={labelClass}>{t('products.create.typeLabel')}</span>
                    <div role="radiogroup" aria-label={t('products.create.typeLabel')} className="grid grid-cols-2 gap-2">
                      <ChoiceChip
                        selected={field.state.value === 'sale'}
                        onSelect={() => field.handleChange('sale')}
                        icon={<Tag className="size-4" aria-hidden="true" />}
                      >
                        {t('products.type.sale')}
                      </ChoiceChip>
                      <ChoiceChip
                        selected={field.state.value === 'exchange'}
                        onSelect={() => field.handleChange('exchange')}
                        icon={<Repeat className="size-4" aria-hidden="true" />}
                      >
                        {t('products.type.exchange')}
                      </ChoiceChip>
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.type}>
                {(type) => (
                  <form.Field name="price">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <TextField
                          label={t('products.create.priceLabel', { currency })}
                          placeholder="0.00"
                          inputMode="decimal"
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value.replace(',', '.'))}
                          onBlur={field.handleBlur}
                          error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
                        />
                        {type === 'exchange' && <span className={hintClass}>{t('products.create.priceExchangeHint')}</span>}
                      </div>
                    )}
                  </form.Field>
                )}
              </form.Subscribe>
            </div>

            <form.Field name="condition">
              {(field) => {
                const error = field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined
                return (
                  <div className="flex flex-col gap-1.5">
                    <span className={labelClass}>{t('products.create.conditionLabel')}</span>
                    <div
                      role="radiogroup"
                      aria-label={t('products.create.conditionLabel')}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    >
                      {PRODUCT_CONDITIONS.map((condition) => (
                        <ChoiceChip
                          key={condition}
                          selected={field.state.value === condition}
                          onSelect={() => {
                            field.handleChange(condition)
                            field.handleBlur()
                          }}
                        >
                          {t(CONDITION_LABEL[condition])}
                        </ChoiceChip>
                      ))}
                    </div>
                    {error && <span className={errorClass}>{error}</span>}
                  </div>
                )
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.communityId}>
              {(communityId) => (
                <form.Field name="tagIds">
                  {(field) => (
                    <ProductTagPicker
                      hasCommunity={communityId > 0}
                      categoryId={communityOptions.find((item) => item.id === communityId)?.categoryId ?? null}
                      selected={field.state.value}
                      onChange={(ids) => {
                        field.handleChange(ids)
                        field.handleBlur()
                      }}
                      error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
                    />
                  )}
                </form.Field>
              )}
            </form.Subscribe>

            <GalleryPicker
              files={gallery}
              onAdd={(files) => setGallery((current) => [...current, ...acceptImages(files)].slice(0, MAX_GALLERY_IMAGES))}
              onRemove={(index) => setGallery((current) => current.filter((_, i) => i !== index))}
            />

            {imageError && (
              <p className={errorClass} role="alert">
                {imageError}
              </p>
            )}
          </div>

          {mutation.isError && (
            <p className="mt-4 text-sm text-red-500" role="alert">
              {getApiErrorMessage(mutation.error)}
            </p>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-xl border border-mynted-border bg-white px-5 py-2.5 text-sm font-semibold text-mynted-ink transition-colors hover:cursor-pointer hover:bg-mynted-bg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('profile.edit.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-mynted-orange px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:cursor-pointer hover:bg-mynted-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {mutation.isPending ? t('products.create.publishing') : t('products.create.submit')}
            </button>
          </DialogFooter>
        </form>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Piezas del formulario
// ---------------------------------------------------------------------------

function ChoiceChip({
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
      className={`flex items-center justify-center gap-2 rounded-[10px] border px-3 py-2.5 text-center text-sm font-medium transition-colors hover:cursor-pointer ${
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

/** URL temporal para previsualizar un File, liberada al desmontar o cambiar. */
/**
 * Vista previa de un archivo local como data URL. Se lee con FileReader (y no
 * con URL.createObjectURL + revoke en un efecto) para que el ciclo
 * montar/desmontar de StrictMode no deje la imagen apuntando a una URL ya
 * revocada. Las imágenes pesan como máximo 5 MB, así que no es un problema.
 */
function useObjectUrl(file: File | null) {
  const [entry, setEntry] = useState<{ file: File; url: string } | null>(null)
  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setEntry({ file, url: reader.result })
    }
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])
  return file && entry?.file === file ? entry.url : null
}

function CoverPicker({ file, error, onChange }: { file: File | null; error?: string; onChange: (file: File | null) => void }) {
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
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-mynted-ink shadow hover:cursor-pointer hover:bg-white"
            >
              {t('products.create.changeImage')}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={t('products.create.removeImage')}
              className="grid size-8 place-items-center rounded-lg bg-white/95 text-red-600 shadow hover:cursor-pointer hover:bg-white"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
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

function GalleryThumb({ file, index, onRemove }: { file: File; index: number; onRemove: () => void }) {
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

function GalleryPicker({
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
function ProductTagPicker({
  hasCommunity,
  categoryId,
  selected,
  onChange,
  error,
}: {
  hasCommunity: boolean
  categoryId: number | null
  selected: number[]
  onChange: (ids: number[]) => void
  error?: string
}) {
  const { t } = useLanguage()
  const tagsQuery = useTags()
  // Los tags dependen de la categoría de la comunidad: sin comunidad elegida no se muestran.
  const tags = hasCommunity
    ? tagsQuery.data?.filter((tag) => tag.categoryId === null || tag.categoryId === categoryId)
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

