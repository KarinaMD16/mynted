import { Link, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '@/api/apiError'
import { Button } from '@/components/ui/Button'
import { useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'
import {
  ProductEditorForm,
  ProductEditorLayout,
  type TargetCommunity,
} from '@/features/products/components/ProductEditor'
import { useProduct, useRelatedProducts } from '@/features/products/hooks/useProductQueries'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * Edición de un producto propio (PATCH /products/:id), en una pantalla igual a
 * la de publicar. Carga el detalle (GET /products/:id), los relacionados que el
 * vendedor ya eligió (GET /products/:id/related, solo `isSellerChoice`) y las
 * comunidades de la persona; con todo listo monta el formulario.
 */
export default function EditProductPage() {
  const { productId: rawId } = useParams({ from: '/products/$productId/edit' })
  const parsed = Number(rawId)
  const productId = Number.isInteger(parsed) && parsed > 0 ? parsed : undefined

  return (
    <ProductEditorLayout>
      <EditProductContent productId={productId} />
    </ProductEditorLayout>
  )
}

function EditProductContent({ productId }: { productId: number | undefined }) {
  const { t } = useLanguage()
  const product = useProduct(productId)
  const isDraft = product.data?.status === 'draft'
  // Un borrador no tiene relacionados que cargar.
  const related = useRelatedProducts(productId, product.isSuccess && !isDraft)
  const communities = useMyCommunities({ limit: 100 })

  if (productId === undefined || product.isError) {
    const notFound = productId === undefined || (isAxiosError(product.error) && product.error.response?.status === 404)
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-mynted-border bg-white px-6 py-14 text-center" role="alert">
        <p className="text-sm font-semibold text-mynted-ink">{t(notFound ? 'itemDetail.notFound' : 'products.list.loadError')}</p>
        {product.error && <p className="text-sm text-mynted-gray">{getApiErrorMessage(product.error)}</p>}
        <div className="mt-2 flex gap-2">
          {productId !== undefined && !notFound && (
            <Button type="button" onClick={() => void product.refetch()} variant="secondary" size="sm">
              {t('communities.list.retry')}
            </Button>
          )}
          <Link
            to="/my-products"
            className="rounded-lg bg-mynted-orange px-3 py-1.5 text-sm font-semibold text-white hover:bg-mynted-orange-hover"
          >
            {t('header.myProducts')}
          </Link>
        </div>
      </div>
    )
  }

  if (product.isPending || related.isLoading || communities.isPending) {
    return <div className="h-96 animate-pulse rounded-2xl bg-white" aria-busy="true" />
  }

  const communityOptions: TargetCommunity[] = (communities.data?.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.category?.categoryId ?? null,
  }))
  // Si los relacionados no cargaron, el formulario arranca sin ellos: no se bloquea la edición por eso.
  const initialRelatedIds = (related.data ?? []).filter((item) => item.isSellerChoice).map((item) => item.id)

  return (
    <ProductEditorForm
      key={product.data.id}
      product={product.data}
      communityOptions={communityOptions}
      isLoadingCommunities={false}
      initialRelatedIds={initialRelatedIds}
    />
  )
}
