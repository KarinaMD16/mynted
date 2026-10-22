import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { Link, useParams } from '@tanstack/react-router'
import { isNotFoundError } from '@/api/apiError'
import { ErrorState } from '@/components/errors/ErrorState'
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

  if (productId === undefined || isNotFoundError(product.error)) {
    return (
      <ErrorState kind="notFound" title={t('itemDetail.notFound')}>
        <Link to="/my-products" className="rounded-lg bg-mynted-orange px-4 py-2 text-sm font-semibold text-white hover:bg-mynted-orange/80">
          {t('header.myProducts')}
        </Link>
      </ErrorState>
    )
  }

  if (product.isError) {
    return (
      <QueryErrorState error={product.error} onRetry={() => void product.refetch()}>
        <Link to="/my-products" className="rounded-lg px-4 py-2 text-sm font-semibold text-mynted-ink hover:bg-mynted-bg">
          {t('header.myProducts')}
        </Link>
      </QueryErrorState>
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
