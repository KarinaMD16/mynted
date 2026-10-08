import myntedAPI from '@/api/apiConfig'
import type {
  CreateProductPayload,
  ExploreFilters,
  MyProductCard,
  MyProductsFilters,
  MyProductsPage,
  MyProductsStats,
  ProductDetail,
  ProductListItem,
  ProductPage,
  ProductReview,
  ProductReviewsPage,
  PublishedProductStatus,
  RelatedProduct,
  ReviewPayload,
  ShopPage,
  ShopTag,
  UpdateProductPayload,
} from '../models/product'

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } }

/**
 * Los campos de texto del multipart de producto (el mismo formato en crear y
 * editar). Los arreglos viajan como JSON (`[1,3,5]`, `["CR","MX"]`) y los
 * booleanos como "true"/"false", que es lo que leen los parse* del backend.
 * Solo se agrega lo que viene definido: el backend deja intacto lo demás.
 */
function appendProductFields(formData: FormData, payload: CreateProductPayload | UpdateProductPayload) {
  if (payload.title !== undefined) formData.append('title', payload.title.trim())
  if (payload.description !== undefined) formData.append('description', payload.description.trim())
  if (payload.price !== undefined) formData.append('price', String(payload.price))
  if (payload.type !== undefined) formData.append('type', payload.type)
  if (payload.condition !== undefined) formData.append('condition', payload.condition)
  if (payload.tagIds !== undefined) formData.append('tagIds', JSON.stringify(payload.tagIds))
  if (payload.discountPercent !== undefined) formData.append('discountPercent', String(payload.discountPercent))
  if (payload.isVisible !== undefined) formData.append('isVisible', String(payload.isVisible))
  if (payload.shipsTo !== undefined) formData.append('shipsTo', JSON.stringify(payload.shipsTo))
  if (payload.relatedProductIds !== undefined) {
    formData.append('relatedProductIds', JSON.stringify(payload.relatedProductIds))
  }
  if (payload.image) formData.append('image', payload.image)
  payload.images?.forEach((file) => formData.append('images', file))
}

/**
 * Publica un producto (o lo guarda como borrador con `saveAsDraft`). Solo
 * vendedores aprobados (JwtAuthGuard + SellerGuard en el backend).
 *
 * Son la misma acción y cambia solo dónde queda: sin `communityId` va a
 * POST /products (producto sin comunidad); con comunidad, a
 * POST /communities/:id/products, donde además hay que ser miembro (si no, 403).
 * La comunidad va en la URL, nunca en el body.
 */
export async function createProduct(communityId: number | null, payload: CreateProductPayload): Promise<ProductDetail> {
  const formData = new FormData()
  appendProductFields(formData, payload)
  if (payload.saveAsDraft) formData.append('saveAsDraft', 'true')

  const url = communityId === null ? '/products' : `/communities/${communityId}/products`
  const { data } = await myntedAPI.post<ProductDetail>(url, formData, MULTIPART)
  return data
}

/** POST /products/:id/publish — publica un borrador propio; si falta algo responde 400 con la lista (arreglo). */
export async function publishProduct(productId: number): Promise<ProductDetail> {
  const { data } = await myntedAPI.post<ProductDetail>(`/products/${productId}/publish`)
  return data
}

/** Adapta una tarjeta de GET /products/me a la forma de un listado público (la usa el perfil). */
function myCardToListItem(product: MyProductCard): ProductListItem {
  return {
    id: product.id,
    title: product.title,
    description: '',
    price: product.price ?? 0,
    discountPercent: product.discountPercent,
    finalPrice: product.finalPrice ?? product.price ?? 0,
    currency: product.currency ?? '',
    imageUrl: product.imageUrl ?? '',
    status: product.status,
    type: product.type ?? 'sale',
    condition: product.condition ?? 'new',
    communityId: product.community?.id ?? null,
    community: product.community ? { ...product.community, slug: '' } : null,
    createdAt: product.publishedAt ?? '',
    productTags: product.tags.map((tag) => ({ tag })),
  }
}

/**
 * Productos del vendedor autenticado para la pestaña "Productos en venta" del
 * perfil. Usa GET /products/me (el mismo del panel "Mis productos"), que viene
 * agrupado por tag: cada "página" son unas cuantas secciones, aplanadas a una
 * lista con la forma de ProductPage. Los borradores no se muestran: viven en
 * el panel "Mis productos".
 */
export async function getMyProducts(page: number, limit: number): Promise<ProductPage> {
  const result = await getMyProductsDashboard(page, Math.min(limit, 20), 50)
  const seen = new Set<number>()
  const data: ProductListItem[] = []
  for (const section of result.sections) {
    for (const product of section.products) {
      // Un producto con varios tags sale en cada sección: se deja una sola vez.
      if (product.status === 'draft' || seen.has(product.id)) continue
      seen.add(product.id)
      data.push(myCardToListItem(product))
    }
  }
  return {
    data,
    pagination: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.totalSections,
      totalPages: result.pagination.totalPages,
    },
  }
}

/** GET /products?communityId= — productos activos publicados en una comunidad (sesión opcional). */
export async function getCommunityProducts(communityId: number, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { communityId, page, limit } })
  return data
}

/**
 * GET /products/shop — pantalla Shop (sesión opcional). `limit` es la cantidad
 * de secciones (tags) por página, para el scroll infinito; `productsLimit`,
 * los productos de cada sección; `shipTo` (opcional) deja solo los que envían a
 * ese país (los que no indicaron países de envío quedan fuera).
 */
export async function getShop(page: number, limit: number, productsLimit: number, shipTo?: string | null): Promise<ShopPage> {
  const { data } = await myntedAPI.get<ShopPage>('/products/shop', {
    params: { page, limit, productsLimit, ...(shipTo && { shipTo }) },
  })
  return data
}

/** GET /tags/:id — para el título de la página "Ver todo" de un tag. */
export async function getTag(tagId: number): Promise<ShopTag> {
  const { data } = await myntedAPI.get<ShopTag>(`/tags/${tagId}`)
  return data
}

/** GET /products?tag= — productos activos de un tag, paginados (sesión opcional). */
export async function getProductsByTag(tagId: number, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { tag: tagId, page, limit } })
  return data
}

/**
 * GET /products/:id — detalle de un producto (galería, tags, vendedor con foto
 * y reputación). Funciona sin sesión; un borrador solo lo ve su dueño (404 para
 * los demás).
 */
export async function getProduct(productId: number): Promise<ProductDetail> {
  const { data } = await myntedAPI.get<ProductDetail>(`/products/${productId}`)
  return data
}

/**
 * GET /products/recommended — "También te puede interesar" (sesión opcional).
 * Señales: intereses del usuario, últimos productos vistos y tags/comunidad del
 * producto actual. Sin sesión se mandan los ids vistos (`recentProductIds`, máx. 10).
 */
export async function getRecommendedProducts(
  currentProductId: number | undefined,
  limit: number,
  recentProductIds: number[] = [],
): Promise<ProductListItem[]> {
  const { data } = await myntedAPI.get<ProductListItem[]>('/products/recommended', {
    params: {
      ...(currentProductId !== undefined && { currentProductId }),
      limit,
      ...(recentProductIds.length > 0 && { recentProductIds: recentProductIds.join(',') }),
    },
  })
  return data
}

/** GET /products/:id/related — hasta 6: primero los que eligió el vendedor (`isSellerChoice`) y luego automáticos. */
export async function getRelatedProducts(productId: number): Promise<RelatedProduct[]> {
  const { data } = await myntedAPI.get<RelatedProduct[]>(`/products/${productId}/related`)
  return data
}

/** POST /products/:id/view (con sesión, 204) — alimenta las recomendaciones. Las vistas del propio vendedor no cuentan. */
export async function recordProductView(productId: number): Promise<void> {
  await myntedAPI.post(`/products/${productId}/view`)
}

/**
 * GET /products/me — productos del vendedor agrupados por tag (JWT + vendedor),
 * borradores incluidos. `page`/`limit` paginan las secciones (tags);
 * `productsLimit`, los productos de cada una.
 */
export async function getMyProductsDashboard(
  page: number,
  limit: number,
  productsLimit: number,
  filters: MyProductsFilters = {},
): Promise<MyProductsPage> {
  const { data } = await myntedAPI.get<MyProductsPage>('/products/me', {
    params: { page, limit, productsLimit, ...filters },
  })
  return data
}

/** GET /products/me/stats — contadores de los productos del vendedor por estado (JWT + vendedor). */
export async function getMyProductsStats(): Promise<MyProductsStats> {
  const { data } = await myntedAPI.get<MyProductsStats>('/products/me/stats')
  return data
}

/**
 * PATCH /products/:id — edición parcial (multipart, igual que al crear), de un
 * producto publicado o de un borrador. Tags, países, relacionados y galería
 * REEMPLAZAN lo anterior. `communityId` mueve el producto de comunidad (el texto
 * "null" lo deja sin comunidad); si no se manda, no cambia.
 */
export async function updateProduct(productId: number, payload: UpdateProductPayload): Promise<ProductDetail> {
  const formData = new FormData()
  appendProductFields(formData, payload)
  if (payload.communityId !== undefined) formData.append('communityId', payload.communityId === null ? 'null' : String(payload.communityId))

  const { data } = await myntedAPI.patch<ProductDetail>(`/products/${productId}`, formData, MULTIPART)
  return data
}

/**
 * PATCH /products/:id/status — `inactive` pausa, `sold` marca como vendido y
 * `active` reactiva un producto pausado. Un `sold` no vuelve a `active` (400).
 * Publicar un borrador se hace con publishProduct.
 */
export async function updateProductStatus(productId: number, status: PublishedProductStatus): Promise<ProductDetail> {
  const { data } = await myntedAPI.patch<ProductDetail>(`/products/${productId}/status`, { status })
  return data
}

/** DELETE /products/:id (204) — borrado lógico: desaparece de todo, se conservan favoritos y conversaciones. */
export async function deleteProduct(productId: number): Promise<void> {
  await myntedAPI.delete(`/products/${productId}`)
}

/** GET /products — catálogo general de productos activos con filtros (sesión opcional). */
export async function getProducts(filters: ExploreFilters, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { ...filters, page, limit } })
  return data
}

// -----------------------------------------------------------------------------
// Reseñas
// -----------------------------------------------------------------------------

/** GET /products/:id/reviews (sin sesión) — promedio, total y reseñas paginadas; `isMine` marca la propia si hay sesión. */
export async function getProductReviews(productId: number, page: number, limit: number): Promise<ProductReviewsPage> {
  const { data } = await myntedAPI.get<ProductReviewsPage>(`/products/${productId}/reviews`, { params: { page, limit } })
  return data
}

/** POST /products/:id/reviews — 403 si es tu propio producto, 409 si ya reseñaste. */
export async function createReview(productId: number, payload: ReviewPayload): Promise<ProductReview> {
  const { data } = await myntedAPI.post<ProductReview>(`/products/${productId}/reviews`, payload)
  return data
}

/** PATCH /products/:id/reviews/me — edita mi reseña (rating y/o comment). */
export async function updateMyReview(productId: number, payload: Partial<ReviewPayload>): Promise<ProductReview> {
  const { data } = await myntedAPI.patch<ProductReview>(`/products/${productId}/reviews/me`, payload)
  return data
}

/** DELETE /products/:id/reviews/me (204). */
export async function deleteMyReview(productId: number): Promise<void> {
  await myntedAPI.delete(`/products/${productId}/reviews/me`)
}
