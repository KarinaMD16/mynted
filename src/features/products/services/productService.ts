import myntedAPI from '@/api/apiConfig'
import type { CreateProductPayload, ProductDetail, ProductPage } from '../models/product'

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

/** GET /users/me/products — productos del vendedor autenticado, en todos sus estados. */
export async function getMyProducts(page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/users/me/products', { params: { page, limit } })
  return data
}

/** GET /products?communityId= — productos activos publicados en una comunidad. */
export async function getCommunityProducts(communityId: number, page: number, limit: number): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>('/products', { params: { communityId, page, limit } })
  return data
}
