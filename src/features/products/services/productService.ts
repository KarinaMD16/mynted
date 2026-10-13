import myntedAPI from '@/api/apiConfig'
import type {
  CreateProductPayload,
  ExploreFilters,
  MyProductsFilters,
  MyProductsPage,
  ProductDetail,
  ProductListItem,
  ProductPage,
  ProductStatus,
  ShopPage,
  ShopTag,
  UpdateProductPayload,
} from '../models/product'

/**
 * POST communities/:communityId/products — solo vendedores aprobados
 * (JwtAuthGuard + SellerGuard en el backend). Va como multipart: la portada
 * en `image`, la galería repetida en `images` y los tags como arreglo JSON,
 * igual que al crear una comunidad (ver CreateCommunityForm).
 */
export async function createProduct(communityId: number, payload: CreateProductPayload): Promise<ProductDetail> {
  const formData = new FormData()
  formData.append('title', payload.title.trim())
  formData.append('description', payload.description.trim())
  formData.append('price', String(payload.price))
  formData.append('type', payload.type)
  formData.append('condition', payload.condition)
  formData.append('tagIds', JSON.stringify(payload.tagIds))
  formData.append('image', payload.image)
  payload.images.forEach((file) => formData.append('images', file))

  const { data } = await myntedAPI.post<ProductDetail>(`/communities/${communityId}/products`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Productos del vendedor autenticado en todos sus estados, para la pestaña
 * "Productos en venta" del perfil. Usa GET /products/me (el mismo del panel
 * "Mis productos"), que viene agrupado por tag: cada "página" son unas
 * cuantas secciones, aplanadas a una lista con la forma de ProductPage.
 */
export async function getMyProducts(page: number, limit: number): Promise<ProductPage> {
  const result = await getMyProductsDashboard(page, Math.min(limit, 20), 50)
  return {
    data: result.sections.flatMap((section) =>
      section.products.map((product) => ({
        ...product,
        description: '',
        communityId: product.community.id,
        community: { ...product.community, slug: '' },
        createdAt: '',
        productTags: product.tags.map((tag) => ({ tag })),
      })),
    ),
    pagination: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.totalSections,
      totalPages: result.pagination.totalPages,
    },
  }
}

/** GET /products?communityId= — productos activos publicados en una comunidad. */
export async function getCommunityProducts(communityId: number, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { communityId, page, limit } })
  return data
}

/**
 * GET /products/shop — pantalla Shop (sesión opcional). `limit` es la cantidad
 * de secciones (tags) por página, para el scroll infinito; `productsLimit`,
 * los productos de cada sección.
 */
export async function getShop(page: number, limit: number, productsLimit: number): Promise<ShopPage> {
  const { data } = await myntedAPI.get<ShopPage>('/products/shop', { params: { page, limit, productsLimit } })
  return data
}

/** GET /tags/:id — para el título de la página "Ver todo" de un tag. */
export async function getTag(tagId: number): Promise<ShopTag> {
  const { data } = await myntedAPI.get<ShopTag>(`/tags/${tagId}`)
  return data
}

/** GET /products?tag= — productos activos de un tag, paginados. */
export async function getProductsByTag(tagId: number, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { tag: tagId, page, limit } })
  return data
}

/** GET /products/:id — detalle de un producto (galería, tags y vendedor). Pide sesión. */
export async function getProduct(productId: number): Promise<ProductDetail> {
  const { data } = await myntedAPI.get<ProductDetail>(`/products/${productId}`)
  return data
}

/** GET /products/recommended?currentProductId= — "También te puede interesar" (sesión opcional). */
export async function getRecommendedProducts(currentProductId: number, limit: number): Promise<ProductListItem[]> {
  const { data } = await myntedAPI.get<ProductListItem[]>('/products/recommended', { params: { currentProductId, limit } })
  return data
}

/**
 * GET /products/me — productos del vendedor agrupados por tag (JWT + vendedor).
 * `page`/`limit` paginan las secciones (tags); `productsLimit`, los productos de cada una.
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

/** PATCH /products/:id — edición parcial (multipart, igual que al crear). */
export async function updateProduct(productId: number, payload: UpdateProductPayload): Promise<ProductDetail> {
  const formData = new FormData()
  if (payload.title !== undefined) formData.append('title', payload.title.trim())
  if (payload.description !== undefined) formData.append('description', payload.description.trim())
  if (payload.price !== undefined) formData.append('price', String(payload.price))
  if (payload.type !== undefined) formData.append('type', payload.type)
  if (payload.condition !== undefined) formData.append('condition', payload.condition)
  if (payload.tagIds !== undefined) formData.append('tagIds', JSON.stringify(payload.tagIds))
  if (payload.image) formData.append('image', payload.image)
  payload.images?.forEach((file) => formData.append('images', file))

  const { data } = await myntedAPI.patch<ProductDetail>(`/products/${productId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** PATCH /products/:id/status — el backend solo acepta pasar a "sold" o "inactive". */
export async function updateProductStatus(productId: number, status: Exclude<ProductStatus, 'active'>): Promise<void> {
  await myntedAPI.patch(`/products/${productId}/status`, { status })
}

/** GET /products — catálogo general de productos activos con filtros (pide sesión). */
export async function getProducts(filters: ExploreFilters, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { ...filters, page, limit } })
  return data
}
