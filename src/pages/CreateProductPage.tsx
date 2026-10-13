import { useId, useMemo, useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useCanGoBack, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { ArrowLeft, CircleCheck, ImagePlus, Repeat, Tag, Trash2, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useCommunityDetailBySlug, useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import { ChoiceChip, ProductTagPicker } from '@/features/products/components/ProductFormParts'
import { CONDITION_LABEL, errorClass, hintClass, labelClass } from '@/features/products/components/productFormShared'
import { useObjectUrl } from '@/features/products/hooks/useObjectUrl'
import { useCreateProductMutation } from '@/features/products/hooks/useProductMutations'
import {
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  PRODUCT_CONDITIONS,
  type ProductCondition,
  type ProductType,
} from '@/features/products/models/product'
import { makeCreateProductSchema } from '@/features/products/schema/createProductSchema'
import { useLanguage } from '@/i18n/LanguageContext'
import { formatPrice } from '@/utils/formatPrice'
import { PUBLISH_FALLBACK_CURRENCY } from '@/utils/locale'
import { getFieldErrorMessage } from '@/utils/form'

/** Comunidad destino de la publicación (elegida o fija si viene en ?community=). */
interface TargetCommunity {
  id: number
  name: string
  categoryId: number | null
}

const CARD_CLASS = 'rounded-2xl border border-mynted-border bg-white p-5 shadow-[0_2px_8px_0_rgba(13,13,20,0.04)]'
const FORM_ID = 'create-product-form'

/**
 * Pantalla para publicar un producto (POST communities/:id/products), en lugar
 * del antiguo diálogo. Solo ofrece lo que acepta el backend (CreateProductDto):
 * comunidad, título, descripción, precio, tipo, estado, 3 tags, portada y
 * galería. Solo cuentas con rol "seller" (el backend lo exige con SellerGuard).
 * Con `?community=<slug>` la comunidad queda fija.
 */
export default function CreateProductPage() {
  const { t } = useLanguage()
  const { data: user, isLoggedIn, isLoading: isLoadingUser } = useCurrentUser()
  const isSeller = user?.role === 'seller'

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        {isLoadingUser ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <MessageCard text={t('myProducts.loginPrompt')} action={{ to: '/login', label: t('header.login') }} />
        ) : !isSeller ? (
          <MessageCard text={t('myProducts.sellerOnly')} action={{ to: '/profile', label: t('header.myProfile') }} />
        ) : (
          <CreateProductContent />
        )}
      </main>
    </div>
  )
}

function MessageCard({ text, action }: { text: string; action: { to: '/login' | '/profile'; label: string } }) {
  return (
    <div className={`${CARD_CLASS} flex flex-col items-center gap-4 py-12 text-center`}>
      <p className="max-w-md text-sm text-mynted-gray">{text}</p>
      <Link
        to={action.to}
        className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
      >
        {action.label}
      </Link>
    </div>
  )
}

/** Resuelve las comunidades posibles (fija por ?community= o las de la persona) y monta el formulario. */
function CreateProductContent() {
  const { community: communitySlug } = useSearch({ from: '/products/new' })
  const fixedQuery = useCommunityDetailBySlug(communitySlug ?? '', Boolean(communitySlug))
  const myCommunitiesQuery = useMyCommunities({ limit: 100 }, !communitySlug)

  if (communitySlug) {
    // El formulario se monta solo cuando la comunidad ya está resuelta: así arranca con ella elegida.
    if (fixedQuery.isPending) return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
    const fixed: TargetCommunity | null = fixedQuery.data
      ? { id: fixedQuery.data.id, name: fixedQuery.data.name, categoryId: fixedQuery.data.category?.categoryId ?? null }
      : null
    return <CreateProductForm communityOptions={fixed ? [fixed] : []} isLoadingCommunities={false} fixed />
  }

  const options: TargetCommunity[] = (myCommunitiesQuery.data?.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.category?.categoryId ?? null,
  }))
  return <CreateProductForm communityOptions={options} isLoadingCommunities={myCommunitiesQuery.isPending} />
}

function CreateProductForm({
  communityOptions,
  isLoadingCommunities,
  fixed = false,
}: {
  communityOptions: TargetCommunity[]
  isLoadingCommunities: boolean
  /** Comunidad fija (vino en ?community=): no se muestra el selector. */
  fixed?: boolean
}) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()
  const currency = useCurrentUser().data?.currency ?? PUBLISH_FALLBACK_CURRENCY
  const schema = useMemo(() => makeCreateProductSchema(t), [t])
  const mutation = useCreateProductMutation()
  const fixedCommunity = fixed ? communityOptions[0] : undefined

  const [cover, setCover] = useState<File | null>(null)
  const [gallery, setGallery] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [published, setPublished] = useState<{ title: string; communityName: string } | null>(null)

  const form = useForm({
    defaultValues: {
      communityId: fixedCommunity?.id ?? 0,
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
    setImageError(valid.length < files.length ? t('products.create.imageInvalid') : null)
    return valid
  }

  function goBack() {
    if (canGoBack) router.history.back()
    else void navigate({ to: '/my-products' })
  }

  if (published) {
    return (
      <ScrollReveal className={`${CARD_CLASS} flex flex-col items-center gap-3 py-12 text-center`}>
        <span className="grid size-14 place-items-center rounded-full bg-teal-50 text-teal-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-xl font-semibold text-mynted-ink">{t('products.create.successTitle')}</h1>
        <p className="max-w-md text-sm text-mynted-gray">
          {t('products.create.successBody', { title: published.title, community: published.communityName })}
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              form.reset()
              setCover(null)
              setGallery([])
              setCoverTouched(false)
              setImageError(null)
              mutation.reset()
              setPublished(null)
            }}
          >
            {t('products.create.publishAnother')}
          </Button>
          <Button type="button" variant="primary" size="md" onClick={() => void navigate({ to: '/my-products' })}>
            {t('header.myProducts')}
          </Button>
        </div>
      </ScrollReveal>
    )
  }

  const hasNoCommunities = !isLoadingCommunities && communityOptions.length === 0
  const isPending = mutation.isPending

  return (
    <>
      {/* Barra superior: volver, título y acciones */}
      <ScrollReveal className={`${CARD_CLASS} flex flex-wrap items-center justify-between gap-4 py-4`}>
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={goBack}
            aria-label={t('products.create.back')}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold text-mynted-ink">{t('products.create.title')}</h1>
            <p className="truncate text-xs text-mynted-gray">{t('products.create.subtitle')}</p>
          </div>
        </div>
        {!hasNoCommunities && (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" onClick={goBack} disabled={isPending}>
              {t('profile.edit.cancel')}
            </Button>
            <Button type="submit" form={FORM_ID} variant="primary" size="md" disabled={isPending} isLoading={isPending}>
              {isPending ? t('products.create.publishing') : t('products.create.submit')}
            </Button>
          </div>
        )}
      </ScrollReveal>

      {hasNoCommunities ? (
        <div className={`${CARD_CLASS} flex flex-col items-center gap-3 border-dashed py-12 text-center`}>
          <p className="text-sm font-semibold text-mynted-ink">{t('products.create.noCommunitiesTitle')}</p>
          <p className="max-w-sm text-sm text-mynted-gray">{t('products.create.noCommunitiesBody')}</p>
          <Link
            to="/communities"
            className="mt-1 rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
          >
            {t('landing.hero.communitiesCta')}
          </Link>
        </div>
      ) : (
        <form
          id={FORM_ID}
          noValidate
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setCoverTouched(true)
            void form.handleSubmit()
          }}
        >
          {/* Columna izquierda: imágenes + vista previa */}
          <div className="flex flex-col gap-6">
            <ScrollReveal className={CARD_CLASS}>
              <ImagesCard
                cover={cover}
                gallery={gallery}
                coverError={coverTouched && !cover ? t('validation.product.coverRequired') : undefined}
                imageError={imageError}
                onCoverChange={(file) => {
                  const [valid] = acceptImages(file ? [file] : [])
                  setCover(valid ?? null)
                  setCoverTouched(true)
                }}
                onAddGallery={(files) =>
                  setGallery((current) => [...current, ...acceptImages(files)].slice(0, MAX_GALLERY_IMAGES))
                }
                onRemoveGallery={(index) => setGallery((current) => current.filter((_, i) => i !== index))}
              />
            </ScrollReveal>

            <ScrollReveal className={CARD_CLASS} delay={0.1}>
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <PreviewCard
                    cover={cover}
                    title={values.title}
                    price={values.price}
                    type={values.type}
                    condition={values.condition}
                    formatPriceLabel={(price) => formatPrice(price, currency, language)}
                  />
                )}
              </form.Subscribe>
            </ScrollReveal>
          </div>

          {/* Columna derecha: detalles del producto */}
          <ScrollReveal className={CARD_CLASS} delay={0.05}>
            <div className="mb-5 flex flex-col gap-1">
              <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('products.create.detailsTitle')}</h2>
              <p className="text-[13px] text-mynted-gray">{t('products.create.detailsSubtitle')}</p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Comunidad */}
              {fixed ? (
                <p className="rounded-xl bg-mynted-bg px-4 py-3 text-sm text-mynted-ink">
                  {t('products.create.publishingIn', { community: fixedCommunity?.name ?? '' })}
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
                        <Select
                          id="product-community"
                          value={field.state.value}
                          options={communityOptions.map((option) => ({ value: option.id, label: option.name }))}
                          placeholder={isLoadingCommunities ? t('loader.default') : t('products.create.communityPlaceholder')}
                          disabled={isLoadingCommunities}
                          invalid={Boolean(error)}
                          onBlur={field.handleBlur}
                          onChange={(id) => {
                            field.handleChange(id)
                            // Los tags dependen de la categoría de la comunidad: se reinician.
                            form.setFieldValue('tagIds', [])
                          }}
                        />
                        <span className={hintClass}>{t('products.create.communityHint')}</span>
                        {error && <span className={errorClass}>{error}</span>}
                      </div>
                    )
                  }}
                </form.Field>
              )}

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
                        rows={7}
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
            </div>

            {mutation.isError && (
              <p className="mt-5 text-sm text-red-500" role="alert">
                {getApiErrorMessage(mutation.error)}
              </p>
            )}
          </ScrollReveal>
        </form>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Imágenes: portada grande + galería en mosaico
// ---------------------------------------------------------------------------

function ImagesCard({
  cover,
  gallery,
  coverError,
  imageError,
  onCoverChange,
  onAddGallery,
  onRemoveGallery,
}: {
  cover: File | null
  gallery: File[]
  coverError?: string
  imageError: string | null
  onCoverChange: (file: File | null) => void
  onAddGallery: (files: File[]) => void
  onRemoveGallery: (index: number) => void
}) {
  const { t } = useLanguage()
  const coverInputId = useId()
  const galleryInputId = useId()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const coverPreview = useObjectUrl(cover)
  const canAdd = gallery.length < MAX_GALLERY_IMAGES

  return (
    // relative: los <input type="file"> (sr-only) quedan anclados a este bloque y,
    // al cerrar el explorador de archivos, el foco no hace saltar el scroll.
    <div className="relative flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('products.create.imagesTitle')}</h2>
        <p className="text-[13px] text-mynted-gray">
          {t('products.create.galleryHint', { count: gallery.length, max: MAX_GALLERY_IMAGES })} · {t('products.create.imageHint')}
        </p>
      </div>

      <input
        ref={coverInputRef}
        id={coverInputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          onCoverChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
      <input
        id={galleryInputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={!canAdd}
        onChange={(event) => {
          onAddGallery(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Portada: ocupa 2x2 */}
        <div className="col-span-2 row-span-2">
          {coverPreview ? (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-mynted-border bg-mynted-bg">
              <img src={coverPreview} alt={t('products.create.coverPreviewAlt')} className="size-full object-cover" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-mynted-ink shadow">
                {t('products.create.coverBadge')}
              </span>
              <div className="absolute right-3 bottom-3 flex gap-2">
                <Button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                  className="border-0 bg-white/95 shadow hover:bg-white"
                >
                  {t('products.create.changeImage')}
                </Button>
                <Button
                  type="button"
                  onClick={() => onCoverChange(null)}
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
              htmlFor={coverInputId}
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-mynted-bg/60 px-4 text-center transition-colors hover:border-mynted-orange ${
                coverError ? 'border-red-300' : 'border-mynted-border'
              }`}
            >
              <ImagePlus className="size-8 text-mynted-orange" aria-hidden="true" />
              <span className="text-sm font-semibold text-mynted-ink">{t('products.create.coverCta')}</span>
              <span className={hintClass}>{t('products.create.coverLabel')}</span>
            </label>
          )}
        </div>

        {gallery.map((file, index) => (
          <GalleryTile
            key={`${file.name}-${file.lastModified}-${index}`}
            file={file}
            index={index}
            onRemove={() => onRemoveGallery(index)}
          />
        ))}

        {canAdd && (
          <label
            htmlFor={galleryInputId}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-mynted-border px-1.5 text-center text-mynted-gray transition-colors hover:border-mynted-orange hover:text-mynted-orange"
          >
            <ImagePlus className="size-5 shrink-0" aria-hidden="true" />
            <span className="text-[11px] leading-tight font-semibold">{t('products.create.addImages')}</span>
          </label>
        )}
      </div>

      {coverError && <span className={errorClass}>{coverError}</span>}
      {imageError && (
        <p className={errorClass} role="alert">
          {imageError}
        </p>
      )}
    </div>
  )
}

function GalleryTile({ file, index, onRemove }: { file: File; index: number; onRemove: () => void }) {
  const { t } = useLanguage()
  const preview = useObjectUrl(file)
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-mynted-border bg-mynted-bg">
      {preview && (
        <img src={preview} alt={t('products.create.galleryImageAlt', { number: index + 1 })} className="size-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('products.create.removeGalleryImage', { number: index + 1 })}
        className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-white/95 text-mynted-ink shadow hover:cursor-pointer"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista previa: cómo se verá la tarjeta en la tienda (solo front, con lo escrito)
// ---------------------------------------------------------------------------

function PreviewCard({
  cover,
  title,
  price,
  type,
  condition,
  formatPriceLabel,
}: {
  cover: File | null
  title: string
  price: string
  type: ProductType
  condition: string
  formatPriceLabel: (price: number) => string
}) {
  const { t } = useLanguage()
  const preview = useObjectUrl(cover)
  const numericPrice = Number(price)
  const hasPrice = price.trim() !== '' && Number.isFinite(numericPrice)
  const conditionLabel = (PRODUCT_CONDITIONS as readonly string[]).includes(condition)
    ? t(CONDITION_LABEL[condition as ProductCondition])
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-base font-semibold text-mynted-ink">{t('products.create.previewTitle')}</h2>
        <p className="text-[13px] text-mynted-gray">{t('products.create.previewHint')}</p>
      </div>

      <article className="flex max-w-[260px] flex-col gap-2 overflow-hidden rounded-[14px] border border-mynted-border bg-white px-3 pt-3 pb-3.5 shadow-[0_2px_8px_0_rgba(13,13,20,0.06)]">
        <div className="grid h-[170px] w-full place-items-center overflow-hidden rounded-[10px] bg-mynted-bg">
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-7 text-mynted-gray-light" aria-hidden="true" />
          )}
        </div>
        <h3 className="line-clamp-2 min-h-10 font-heading text-sm font-semibold text-mynted-ink">
          {title.trim() || <span className="text-mynted-gray-light">{t('products.create.previewPlaceholder')}</span>}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-mynted-blue/10 px-2.5 py-1 text-[10px] font-semibold text-mynted-blue">
            {t(type === 'sale' ? 'products.type.sale' : 'products.type.exchange')}
          </span>
          {conditionLabel && (
            <span className="rounded-full bg-mynted-bg px-2.5 py-1 text-[10px] font-semibold text-mynted-ink">
              {conditionLabel}
            </span>
          )}
        </div>
        <span className="font-heading text-[17px] font-semibold text-mynted-ink">
          {hasPrice ? formatPriceLabel(numericPrice) : '—'}
        </span>
      </article>
    </div>
  )
}
