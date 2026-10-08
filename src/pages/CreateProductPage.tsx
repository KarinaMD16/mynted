import { useSearch } from '@tanstack/react-router'
import { ProductEditorForm, ProductEditorLayout, type TargetCommunity } from '@/features/products/components/ProductEditor'
import { useCommunityDetailBySlug, useMyCommunities } from '@/features/community/hooks/useCommunitiesQueries'

/**
 * Pantalla para publicar un producto, o guardarlo como borrador. Sin comunidad
 * usa POST /products; con una comunidad de la que la persona es miembro, POST
 * /communities/:id/products. Con `?community=<slug>` la comunidad queda fija.
 * El formulario es el mismo de la edición (ProductEditorForm).
 */
export default function CreateProductPage() {
  return (
    <ProductEditorLayout>
      <CreateProductContent />
    </ProductEditorLayout>
  )
}

/** Resuelve las comunidades posibles (fija por ?community= o las de la persona) y monta el formulario. */
function CreateProductContent() {
  const { community: communitySlug } = useSearch({ from: '/products/new' })
  const fixedQuery = useCommunityDetailBySlug(communitySlug ?? '', Boolean(communitySlug))
  // Si el slug no resuelve a una comunidad, se cae al selector normal.
  const myCommunitiesQuery = useMyCommunities({ limit: 100 }, !communitySlug || fixedQuery.isError)

  if (communitySlug && fixedQuery.isPending) {
    // El formulario se monta solo cuando la comunidad ya está resuelta: así arranca con ella elegida.
    return <div className="h-64 animate-pulse rounded-2xl bg-white" aria-busy="true" />
  }

  if (fixedQuery.data) {
    const fixed: TargetCommunity = {
      id: fixedQuery.data.id,
      name: fixedQuery.data.name,
      categoryId: fixedQuery.data.category?.categoryId ?? null,
    }
    return <ProductEditorForm communityOptions={[fixed]} isLoadingCommunities={false} fixed />
  }

  const options: TargetCommunity[] = (myCommunitiesQuery.data?.data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.category?.categoryId ?? null,
  }))
  return <ProductEditorForm communityOptions={options} isLoadingCommunities={myCommunitiesQuery.isPending} />
}
