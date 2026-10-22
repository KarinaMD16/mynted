import { useId, useRef, useState, type ReactNode } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, CircleCheck, ImagePlus, Repeat, Tag, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/api/apiError'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useTags } from '@/features/community/hooks/useCommunitiesQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { getFieldErrorMessage } from '@/utils/form'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
  useCreateProductMutation,
  usePublishProductMutation,
  useUpdateProductMutation,
} from '../hooks/useProductMutations'
import {
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  PRODUCT_CONDITIONS,
  type ProductCondition,
  type ProductDetail,
  type ProductType,
} from '../models/product'
import { validateProductForm, type ProductFormMode, type ProductFormValues } from '../schema/createProductSchema'
import {
  ChoiceChip,
  DiscountField,
  ProductTagPicker,
  RelatedProductsPicker,
  ShipsToPicker,
  VisibilityToggle,
} from './ProductFormParts'
import { discountOf } from '../utils/discount'
import { ProductPrice } from './ProductPrice'
import { CONDITION_LABEL, errorClass, hintClass, labelClass } from './productFormShared'

/** Comunidad a la que puede ir el producto (la fija de ?community= o las de la persona). */
export interface TargetCommunity {
  id: number
  name: string
  categoryId: number | null
}

const CARD_CLASS = 'rounded-2xl border border-mynted-border bg-white p-5 shadow-[0_2px_8px_0_rgba(13,13,20,0.04)]'
const FORM_ID = 'product-editor-form'
/** `communityId` del formulario cuando el producto no va en ninguna comunidad. */
const NO_COMMUNITY = 0

/**
 * Marco de las pantallas de publicar y editar un producto: cabecera del sitio
 * y acceso solo para vendedores (el backend lo exige con SellerGuard).
 */
export function ProductEditorLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const { isLoggedIn, isLoading, data: user } = useCurrentUser()
  const isSeller = user?.role === 'seller'

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-7 pb-24 sm:px-6 lg:px-14">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
        ) : !isLoggedIn ? (
          <MessageCard text={t('myProducts.loginPrompt')} action={{ to: '/login', label: t('header.login') }} />
        ) : !isSeller ? (
          <MessageCard text={t('myProducts.sellerOnly')} action={{ to: '/profile', label: t('header.myProfile') }} />
        ) : (
          children
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

/** Texto del form → valor del payload; vacío = no se manda. */
function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Formulario de producto compartido por "Publicar" y "Editar". Sin `product`
 * crea (publica o guarda un borrador); con `product` edita ese producto, y si
 * es un borrador permite guardarlo o publicarlo.
 */
export function ProductEditorForm({
  communityOptions,
  isLoadingCommunities,
  fixed = false,
  product,
  initialRelatedIds = [],
}: {
  communityOptions: TargetCommunity[]
  isLoadingCommunities: boolean
  /** Comunidad fija (vino en ?community=): no se muestra el selector. */
  fixed?: boolean
  /** Producto a editar; sin él se crea uno nuevo. */
  product?: ProductDetail
  /** Relacionados que el vendedor ya eligió (solo al editar). */
  initialRelatedIds?: number[]
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()
  const isEdit = product !== undefined
  const isDraftProduct = product?.status === 'draft'
  const userCurrency = useCurrentUser().data?.currency ?? null
  const currency = userCurrency ?? product?.currency ?? null
  // Publicar exige moneda en la cuenta (el backend responde 400 si falta); un borrador no.
  // Guardar cambios de un producto ya publicado no vuelve a pedirla.
  const canPublish = userCurrency !== null || (isEdit && !isDraftProduct)
  const createMutation = useCreateProductMutation()
  const updateMutation = useUpdateProductMutation()
  const publishMutation = usePublishProductMutation()
  const submitError = createMutation.error ?? updateMutation.error ?? publishMutation.error
  const isPending = createMutation.isPending || updateMutation.isPending || publishMutation.isPending
  const tagsQuery = useTags()
  const fixedCommunity = fixed ? communityOptions[0] : undefined
  // Modo con el que se valida y se envía; lo fijan los botones "Publicar" y "Guardar borrador".
  const modeRef = useRef<ProductFormMode>('publish')

  const [cover, setCover] = useState<File | null>(null)
  const [gallery, setGallery] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  // Se muestra el aviso de portada obligatoria solo tras intentar publicar sin ella.
  const [coverMissing, setCoverMissing] = useState(false)
  const [done, setDone] = useState<{ title: string; communityName: string; isDraft: boolean } | null>(null)

  const defaultValues: ProductFormValues = product
    ? {
        communityId: product.communityId ?? NO_COMMUNITY,
        title: product.title,
        description: product.description ?? '',
        price: product.price != null ? String(Number(product.price)) : '',
        type: product.type ?? 'sale',
        condition: product.condition ?? '',
        tagIds: product.productTags.map((item) => item.tag.tagId),
        discountPercent: discountOf(product.discountPercent) !== null ? String(Number(product.discountPercent)) : '',
        isVisible: product.isVisible,
        shipsTo: product.shipsTo ?? [],
        relatedProductIds: initialRelatedIds,
      }
    : {
        communityId: fixedCommunity?.id ?? NO_COMMUNITY,
        title: '',
        description: '',
        price: '',
        type: 'sale',
        condition: '',
        tagIds: [],
        discountPercent: '',
        isVisible: true,
        shipsTo: [],
        relatedProductIds: [],
      }

  const form = useForm({
    defaultValues,
    validators: {
      onChange: ({ value }) => validateProductForm(t, modeRef.current, value),
      onSubmit: ({ value }) => validateProductForm(t, modeRef.current, value),
    },
    onSubmit: async ({ value }) => {
      const isDraft = modeRef.current === 'draft'
      if (!isDraft && !cover && !product?.imageUrl) return

      const discount = optionalText(value.discountPercent)
      const description = optionalText(value.description)
      const price = optionalText(value.price) !== undefined ? Number(value.price) : undefined
      const condition = (PRODUCT_CONDITIONS as readonly string[]).includes(value.condition)
        ? (value.condition as ProductCondition)
        : undefined
      const tagIds = value.tagIds.length > 0 ? value.tagIds : undefined
      const nextCommunityId = value.communityId === NO_COMMUNITY ? null : value.communityId

      try {
        if (product) {
          await updateMutation.mutateAsync({
            productId: product.id,
            payload: {
              title: value.title.trim(),
              description,
              price,
              type: value.type,
              condition,
              tagIds,
              image: cover ?? undefined,
              images: gallery.length > 0 ? gallery : undefined,
              // Solo se manda si cambió: así no se revalida la membresía sin necesidad.
              communityId: nextCommunityId !== product.communityId ? nextCommunityId : undefined,
              // 0 quita el descuento.
              discountPercent: discount !== undefined ? Number(discount) : 0,
              isVisible: value.isVisible,
              shipsTo: value.shipsTo,
              relatedProductIds: value.relatedProductIds,
            },
          })
          // Un borrador se publica después de guardar sus cambios; el backend avisa si falta algo.
          const publishing = isDraftProduct && !isDraft
          if (publishing) await publishMutation.mutateAsync(product.id)
          toast.success(t(publishing ? 'myProducts.edit.published' : 'myProducts.edit.saved'))
          void navigate({ to: '/my-products' })
          return
        }

        await createMutation.mutateAsync({
          communityId: nextCommunityId,
          payload: {
            title: value.title.trim(),
            description,
            price,
            type: value.type,
            condition,
            tagIds,
            image: cover ?? undefined,
            images: gallery.length > 0 ? gallery : undefined,
            discountPercent: discount !== undefined ? Number(discount) : undefined,
            isVisible: value.isVisible,
            shipsTo: value.shipsTo.length > 0 ? value.shipsTo : undefined,
            relatedProductIds: value.relatedProductIds.length > 0 ? value.relatedProductIds : undefined,
            saveAsDraft: isDraft,
          },
        })
        setDone({
          title: value.title.trim(),
          communityName: communityOptions.find((item) => item.id === value.communityId)?.name ?? '',
          isDraft,
        })
      } catch {
        // el error se muestra abajo del form (submitError)
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

  function submitAs(mode: ProductFormMode) {
    modeRef.current = mode
    setCoverMissing(mode === 'publish' && !cover && !product?.imageUrl)
    void form.handleSubmit()
  }

  /** Al cambiar de comunidad se descartan los tags que esa comunidad no admite. */
  function pruneTagsFor(categoryId: number | null) {
    const allowed = new Set(
      tagsQuery.data
        ?.filter((tag) => categoryId === null || tag.categoryId === null || tag.categoryId === categoryId)
        .map((tag) => tag.tagId),
    )
    const current = form.getFieldValue('tagIds')
    if (tagsQuery.data && current.some((id) => !allowed.has(id))) {
      form.setFieldValue('tagIds', current.filter((id) => allowed.has(id)))
    }
  }

  if (done) {
    return (
      <ScrollReveal className={`${CARD_CLASS} flex flex-col items-center gap-3 py-12 text-center`}>
        <span className="grid size-14 place-items-center rounded-full bg-teal-50 text-teal-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-xl font-semibold text-mynted-ink">
          {t(done.isDraft ? 'products.create.draftSavedTitle' : 'products.create.successTitle')}
        </h1>
        <p className="max-w-md text-sm text-mynted-gray">
          {done.isDraft
            ? t('products.create.draftSavedBody', { title: done.title })
            : done.communityName
              ? t('products.create.successBody', { title: done.title, community: done.communityName })
              : t('products.create.successBodyNoCommunity', { title: done.title })}
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
              setCoverMissing(false)
              setImageError(null)
              createMutation.reset()
              setDone(null)
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

  const communitySelectOptions = [
    { value: NO_COMMUNITY, label: t('products.create.noCommunity') },
    ...communityOptions.map((option) => ({ value: option.id, label: option.name })),
  ]

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
            <h1 className="font-heading text-lg font-semibold text-mynted-ink">
              {t(isEdit ? 'myProducts.edit.title' : 'products.create.title')}
            </h1>
            <p className="truncate text-xs text-mynted-gray">
              {t(isEdit ? 'myProducts.edit.subtitle' : 'products.create.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="md" onClick={goBack} disabled={isPending}>
            {t('profile.edit.cancel')}
          </Button>
          {(!isEdit || isDraftProduct) && (
            <Button type="button" variant="secondary" size="md" onClick={() => submitAs('draft')} disabled={isPending}>
              {t('products.create.saveDraft')}
            </Button>
          )}
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="md"
            disabled={isPending || !canPublish}
            isLoading={isPending}
          >
            {isEdit && !isDraftProduct
              ? t(isPending ? 'profile.edit.saving' : 'myProducts.edit.save')
              : t(isPending ? 'products.create.publishing' : 'products.create.submit')}
          </Button>
        </div>
      </ScrollReveal>

      {!canPublish && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff4d6] px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-sm font-semibold text-[#8a5a00]">{t('products.create.currencyMissingTitle')}</p>
            <p className="text-[13px] text-[#8a5a00]">{t('products.create.currencyMissingBody')}</p>
          </div>
          <Link
            to="/settings"
            search={{ tab: 'profile' }}
            className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
          >
            {t('products.create.currencyMissingCta')}
          </Link>
        </div>
      )}

      <form
        id={FORM_ID}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          submitAs('publish')
        }}
      >
        {/* Columna izquierda: imágenes + vista previa */}
        <div className="flex flex-col gap-6">
          <ScrollReveal className={CARD_CLASS}>
            <ImagesCard
              cover={cover}
              gallery={gallery}
              coverError={coverMissing ? t('validation.product.coverRequired') : undefined}
              currentCoverUrl={product?.imageUrl ?? null}
              currentGallery={product?.images.map((image) => image.url) ?? []}
              imageError={imageError}
              onCoverChange={(file) => {
                const [valid] = acceptImages(file ? [file] : [])
                setCover(valid ?? null)
                setCoverMissing(false)
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
                  coverUrl={product?.imageUrl ?? null}
                  title={values.title}
                  price={values.price}
                  discountPercent={values.discountPercent}
                  currency={currency}
                  type={values.type}
                  condition={values.condition}
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
            {/* Comunidad (opcional) */}
            {fixed ? (
              <p className="rounded-xl bg-mynted-bg px-4 py-3 text-sm text-mynted-ink">
                {t('products.create.publishingIn', { community: fixedCommunity?.name ?? '' })}
              </p>
            ) : (
              <form.Field name="communityId">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="product-community" className={labelClass}>
                      {t('products.create.communityLabel')}
                    </label>
                    <Select
                      id="product-community"
                      value={field.state.value}
                      options={communitySelectOptions}
                      placeholder={isLoadingCommunities ? t('loader.default') : t('products.create.noCommunity')}
                      disabled={isLoadingCommunities}
                      onBlur={field.handleBlur}
                      onChange={(id) => {
                        field.handleChange(id)
                        pruneTagsFor(communityOptions.find((item) => item.id === id)?.categoryId ?? null)
                      }}
                    />
                    <span className={hintClass}>{t('products.create.communityHint')}</span>
                  </div>
                )}
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
                          label={currency ? t('products.create.priceLabel', { currency }) : t('products.create.priceLabelNoCurrency')}
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

            <form.Field name="discountPercent">
              {(field) => (
                <DiscountField
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
                />
              )}
            </form.Field>

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

            <form.Field name="shipsTo">
              {(field) => <ShipsToPicker selected={field.state.value} onChange={field.handleChange} />}
            </form.Field>

            <form.Field name="relatedProductIds">
              {(field) => <RelatedProductsPicker selected={field.state.value} onChange={field.handleChange} excludeId={product?.id} />}
            </form.Field>

            <form.Field name="isVisible">
              {(field) => <VisibilityToggle checked={field.state.value} onChange={field.handleChange} />}
            </form.Field>
          </div>

          {submitError && (
            <p className="mt-5 text-sm text-red-500" role="alert">
              {getApiErrorMessage(submitError)}
            </p>
          )}
        </ScrollReveal>
      </form>
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
  currentCoverUrl,
  currentGallery,
  imageError,
  onCoverChange,
  onAddGallery,
  onRemoveGallery,
}: {
  cover: File | null
  gallery: File[]
  coverError?: string
  /** Portada actual del producto que se edita; se muestra mientras no se elija otra. */
  currentCoverUrl: string | null
  /** Galería actual; se muestra mientras no se agreguen imágenes nuevas (que la reemplazan). */
  currentGallery: string[]
  imageError: string | null
  onCoverChange: (file: File | null) => void
  onAddGallery: (files: File[]) => void
  onRemoveGallery: (index: number) => void
}) {
  const { t } = useLanguage()
  const coverInputId = useId()
  const galleryInputId = useId()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const newCoverPreview = useObjectUrl(cover)
  const coverPreview = newCoverPreview ?? currentCoverUrl
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
                {cover && (
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
                )}
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

        {gallery.length === 0 &&
          currentGallery.map((url, index) => (
            <div key={`${url}-${index}`} className="aspect-square overflow-hidden rounded-xl border border-mynted-border bg-mynted-bg">
              <img src={url} alt="" className="size-full object-cover" />
            </div>
          ))}

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

      {currentGallery.length > 0 && gallery.length === 0 && (
        <span className={hintClass}>{t('myProducts.edit.galleryReplaceHint')}</span>
      )}
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
  coverUrl,
  title,
  price,
  discountPercent,
  currency,
  type,
  condition,
}: {
  cover: File | null
  /** Portada ya guardada (al editar), mientras no se elija otra. */
  coverUrl: string | null
  title: string
  price: string
  discountPercent: string
  currency: string | null
  type: ProductType
  condition: string
}) {
  const { t } = useLanguage()
  const preview = useObjectUrl(cover) ?? coverUrl
  const numericPrice = Number(price)
  const hasPrice = price.trim() !== '' && Number.isFinite(numericPrice)
  const discount = discountOf(discountPercent)
  // Mismo cálculo que hace el backend: el precio original no cambia, se muestra el final.
  const finalPrice = hasPrice && discount !== null ? Math.round(numericPrice * (100 - discount)) / 100 : null
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
        {hasPrice && currency ? (
          <ProductPrice
            price={numericPrice}
            finalPrice={finalPrice}
            discountPercent={discount}
            currency={currency}
            className="font-heading text-[17px] font-semibold text-mynted-ink"
          />
        ) : (
          <span className="font-heading text-[17px] font-semibold text-mynted-ink">{hasPrice ? numericPrice.toFixed(2) : '—'}</span>
        )}
      </article>
    </div>
  )
}
