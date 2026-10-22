import myntedAPI from '@/api/apiConfig'
import type { ProductPage } from '@/features/products/models/product'
import type { SellerStore, StoreProductFilters, StoreTag } from '../models/store'

/** GET /sellers/:sellerId — 404 si no existe, no está aprobado o la cuenta está desactivada. */
export async function getStore(sellerId: number): Promise<SellerStore> {
  const { data } = await myntedAPI.get<SellerStore>(`/sellers/${sellerId}`)
  return data
}

/**
 * GET /sellers/:sellerId/products — misma forma que GET /products (con los
 * precios `display*`; la moneda viaja en el header X-Display-Currency).
 */
export async function getStoreProducts(
  sellerId: number,
  filters: StoreProductFilters,
  page: number,
  limit: number,
): Promise<ProductPage> {
  const { data } = await myntedAPI.get<ProductPage>(`/sellers/${sellerId}/products`, {
    params: { ...filters, page, limit },
  })
  return data
}

/** GET /sellers/:sellerId/tags — para los chips de filtro. */
export async function getStoreTags(sellerId: number): Promise<StoreTag[]> {
  const { data } = await myntedAPI.get<StoreTag[]>(`/sellers/${sellerId}/tags`)
  return data
}
