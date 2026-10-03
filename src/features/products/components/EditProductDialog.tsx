import { useMemo, useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Repeat, Tag } from 'lucide-react'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { BlurAppear } from '@/components/ui/BlurAppear'
import { TextField } from '@/components/ui/TextField'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import { useLanguage } from '@/i18n/LanguageContext'
import { getFieldErrorMessage } from '@/utils/form'
import { useUpdateProductMutation } from '../hooks/useProductMutations'
import { useProduct } from '../hooks/useProductQueries'
import {
  MAX_GALLERY_IMAGES,
  MAX_IMAGE_BYTES,
  PRODUCT_CONDITIONS,
  type ProductCondition,
  type ProductDetail,
  type ProductType,
} from '../models/product'
import { makeCreateProductSchema } from '../schema/createProductSchema'
import {
  CONDITION_LABEL,
  ChoiceChip,
  CoverPicker,
  GalleryPicker,
  ProductTagPicker,
  errorClass,
  hintClass,
  labelClass,
} from './CreateProductDialog'

interface EditProductDialogProps {
  /** Producto a editar; `null` mantiene el diálogo cerrado. */
  productId: number | null
  onClose: () => void
}

/**
 * Edición de un producto propio (PATCH /products/:id). Carga el detalle con
 * GET /products/:id y manda el formulario completo; la portada y la galería
 * solo se envían si se eligen archivos nuevos (la galería nueva reemplaza la actual).
 */
export function EditProductDialog({ productId, onClose }: EditProductDialogProps) {
  return (
    <Dialog open={productId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <BlurAppear>{productId !== null && <EditProductLoader productId={productId} onClose={onClose} />}</BlurAppear>
      </DialogContent>
    </Dialog>
  )
}

function EditProductLoader({ productId, onClose }: { productId: number; onClose: () => void }) {
  const { t } = useLanguage()
  const product = useProduct(productId)

  if (product.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <DialogTitle className="text-xl">{t('myProducts.edit.title')}</DialogTitle>
        <div className="h-72 animate-pulse rounded-2xl bg-mynted-bg" />
      </div>
    )
  }

  if (product.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <DialogTitle className="text-xl">{t('myProducts.edit.title')}</DialogTitle>
        <DialogDescription>{getApiErrorMessage(product.error)}</DialogDescription>
        <Button type="button" variant="secondary" size="md" onClick={onClose}>
          {t('profile.edit.cancel')}
        </Button>
      </div>
    )
  }

  return <EditProductForm product={product.data} onClose={onClose} />
}

function EditProductForm({ product, onClose }: { product: ProductDetail; onClose: () => void }) {
  const { t } = useLanguage()
  const currency = useCurrentUser().data?.currency ?? product.currency
  const schema = useMemo(() => makeCreateProductSchema(t), [t])
  const mutation = useUpdateProductMutation()

  // La categoría de la comunidad define qué tags se ofrecen; se toma de las comunidades de la persona.
  const communities = useMyCommunities({ limit: 100 })
  const categoryId = communities.data?.data.find((item) => item.id === product.communityId)?.category?.categoryId ?? null

  const [cover, setCover] = useState<File | null>(null)
  const [gallery, setGallery] = useState<File[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const dialogTopRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    defaultValues: {
      communityId: product.communityId,
      title: product.title,
      description: product.description,
      price: String(Number(product.price)),
      type: product.type as ProductType,
      condition: product.condition as string,
      tagIds: product.productTags.map((item) => item.tag.tagId),
    },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          productId: product.id,
          payload: {
            title: value.title,
            description: value.description,
            price: Number(value.price),
            type: value.type,
            condition: value.condition as ProductCondition,
            tagIds: value.tagIds,
            image: cover ?? undefined,
            images: gallery.length > 0 ? gallery : undefined,
          },
        })
        onClose()
      } catch {
        dialogTopRef.current?.scrollIntoView({ block: 'nearest' })
      }
    },
  })

  function acceptImages(files: File[]): File[] {
    const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_BYTES)
    if (valid.length < files.length) setImageError(t('products.create.imageInvalid'))
    else setImageError(null)
    return valid
  }

  const currentGallery = product.images

  return (
    <>
      <div ref={dialogTopRef} />
      <DialogHeader>
        <DialogTitle className="text-xl">{t('myProducts.edit.title')}</DialogTitle>
        <DialogDescription>{t('myProducts.edit.subtitle')}</DialogDescription>
      </DialogHeader>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div className="mt-6 flex flex-col gap-5">
          {/* Portada actual (si no se elige otra) */}
          {!cover && (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>{t('myProducts.edit.currentCover')}</span>
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-44 w-full rounded-xl border border-mynted-border object-cover"
              />
              <span className={hintClass}>{t('myProducts.edit.coverHint')}</span>
            </div>
          )}
          <CoverPicker
            file={cover}
            onChange={(file) => {
              const [valid] = acceptImages(file ? [file] : [])
              setCover(valid ?? null)
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
                  <label htmlFor="edit-product-description" className={labelClass}>
                    {t('products.create.descriptionLabel')}
                  </label>
                  <textarea
                    id="edit-product-description"
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

            <form.Field name="price">
              {(field) => (
                <TextField
                  label={t('products.create.priceLabel', { currency })}
                  placeholder="0.00"
                  inputMode="decimal"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value.replace(',', '.'))}
                  onBlur={field.handleBlur}
                  error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
                />
              )}
            </form.Field>
          </div>

          <form.Field name="condition">
            {(field) => (
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
                      onSelect={() => field.handleChange(condition)}
                    >
                      {t(CONDITION_LABEL[condition])}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="tagIds">
            {(field) => (
              <ProductTagPicker
                hasCommunity
                categoryId={categoryId}
                // Mientras no se sabe la categoría de la comunidad, se ofrecen todos los tags.
                showAllCategories={categoryId === null}
                selected={field.state.value}
                onChange={(ids) => {
                  field.handleChange(ids)
                  field.handleBlur()
                }}
                error={field.state.meta.isTouched ? getFieldErrorMessage(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          {/* Galería actual + reemplazo */}
          <div className="flex flex-col gap-2">
            {currentGallery.length > 0 && gallery.length === 0 && (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>{t('myProducts.edit.currentGallery')}</span>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {currentGallery.map((image, index) => (
                    <li key={`${image.url}-${index}`} className="aspect-square overflow-hidden rounded-lg border border-mynted-border">
                      <img src={image.url} alt="" className="h-full w-full object-cover" />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <span className={hintClass}>{t('myProducts.edit.galleryReplaceHint')}</span>
            <GalleryPicker
              files={gallery}
              onAdd={(files) => setGallery((current) => [...current, ...acceptImages(files)].slice(0, MAX_GALLERY_IMAGES))}
              onRemove={(index) => setGallery((current) => current.filter((_, i) => i !== index))}
            />
          </div>

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
          <Button type="button" onClick={onClose} disabled={mutation.isPending} variant="secondary" size="md">
            {t('profile.edit.cancel')}
          </Button>
          <Button type="submit" disabled={mutation.isPending} variant="primary" size="md" isLoading={mutation.isPending}>
            {mutation.isPending ? t('profile.edit.saving') : t('myProducts.edit.save')}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
