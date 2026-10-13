/** Espeja los enums de products/entities/product.entity.ts del backend. */
export const PRODUCT_TYPES = ['sale', 'exchange'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const PRODUCT_CONDITIONS = ['new', 'like_new', 'good_condition', 'used_with_details'] as const
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]

export type ProductStatus = 'active' | 'sold' | 'inactive'

/** El backend exige exactamente esta cantidad de tags por producto (ver CreateProductDto). */
export const REQUIRED_PRODUCT_TAGS = 3
/** Límites del FileFieldsInterceptor de POST communities/:id/products. */
export const MAX_GALLERY_IMAGES = 6
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export interface CreateProductPayload {
  title: string
  description: string
  price: number
  type: ProductType
  condition: ProductCondition
  tagIds: number[]
  /** Portada, obligatoria. */
  image: File
  /** Galería opcional del detalle. */
  images: File[]
}

/** Respuesta de POST communities/:communityId/products (detalle del producto creado). */
export interface ProductDetail {
  id: number
  title: string
  description: string
  price: string | number
  currency: string
  imageUrl: string
  status: ProductStatus
  type: ProductType
  condition: ProductCondition
  communityId: number
  createdAt: string
  seller: { sellerId: number; displayName: string; isVerified: boolean }
  productTags: { tag: { tagId: number; name: string } }[]
  images: { url: string; order: number }[]
}

/**
 * Producto en un listado: GET /users/me/products (trae `community`) y
 * GET /products?communityId= (sin `community`). El precio llega como número
 * (el backend lo transforma desde el decimal de Postgres).
 */
export interface ProductListItem {
  id: number
  title: string
  description: string
  price: string | number
  currency: string
  imageUrl: string
  status: ProductStatus
  type: ProductType
  condition: ProductCondition
  communityId: number
  createdAt: string
  community?: { id: number; name: string; slug: string }
  productTags?: { tag: { tagId: number; name: string } }[]
}

export interface ProductPage {
  data: ProductListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Tarjeta de producto de GET /products/shop (con todos sus tags y el vendedor). */
export interface ShopProduct {
  id: number
  title: string
  price: number
  currency: string
  imageUrl: string
  type: ProductType
  condition: ProductCondition
  tags: { tagId: number; name: string }[]
  seller: { sellerId: number; displayName: string; photoUrl: string | null; isVerified: boolean }
}

/** Una sección de la pantalla Shop: un tag con sus productos. */
export interface ShopSection {
  tag: { tagId: number; name: string }
  /** 'interest' si el tag viene de los intereses del usuario, 'popular' si es de relleno. */
  source: 'interest' | 'popular'
  totalProducts: number
  products: ShopProduct[]
  pagination: { page: number; limit: number; totalPages: number }
}

/** Respuesta de GET /products/shop: la paginación (`pagination`) es de secciones, no de productos. */
export interface ShopPage {
  sections: ShopSection[]
  pagination: { page: number; limit: number; totalSections: number; totalPages: number }
}

/** Tag tal como lo devuelve GET /tags/:id (solo lo que la pantalla usa). */
export interface ShopTag {
  tagId: number
  name: string
}

/** Tarjeta de GET /products/me (panel del vendedor). */
export interface MyProductCard {
  id: number
  title: string
  price: number
  currency: string
  imageUrl: string
  status: ProductStatus
  type: ProductType
  condition: ProductCondition
  tags: { tagId: number; name: string }[]
  community: { id: number; name: string }
}

export interface MyProductsSection {
  tag: { tagId: number; name: string }
  totalProducts: number
  products: MyProductCard[]
  pagination: { page: number; limit: number; totalPages: number }
}

export interface MyProductsPage {
  totalProducts: number
  sections: MyProductsSection[]
  pagination: { page: number; limit: number; totalSections: number; totalPages: number }
}

export interface MyProductsFilters {
  status?: ProductStatus
  type?: ProductType
}

/** Campos editables de PATCH /products/:id; todos son opcionales. */
export interface UpdateProductPayload {
  title?: string
  description?: string
  price?: number
  type?: ProductType
  condition?: ProductCondition
  tagIds?: number[]
  /** Nueva portada. */
  image?: File
  /** Si viene, reemplaza por completo la galería. */
  images?: File[]
}

/** Filtros de GET /products para la pantalla Explorar. */
export interface ExploreFilters {
  category?: number
  type?: ProductType
  condition?: ProductCondition
  priceMin?: number
  priceMax?: number
}
