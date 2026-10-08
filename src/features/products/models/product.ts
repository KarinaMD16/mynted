/** Espeja los enums de products/entities/product.entity.ts del backend. */
export const PRODUCT_TYPES = ['sale', 'exchange'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const PRODUCT_CONDITIONS = ['new', 'like_new', 'good_condition', 'used_with_details'] as const
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]

/**
 * draft: borrador (solo lo ve su dueño). active: publicado. inactive: pausado
 * (se puede reactivar). sold: vendido (no vuelve a active).
 */
export type ProductStatus = 'draft' | 'active' | 'sold' | 'inactive'

/** Estados que puede tener un producto que ya es público (todo menos borrador). */
export type PublishedProductStatus = Exclude<ProductStatus, 'draft'>

/** El backend exige exactamente esta cantidad de tags para publicar (ver CreateProductDto). */
export const REQUIRED_PRODUCT_TAGS = 3
/** Límites del FileFieldsInterceptor de POST products y POST communities/:id/products. */
export const MAX_GALLERY_IMAGES = 6
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
/** Máximo de productos relacionados que el vendedor puede elegir (MAX_RELATED_PRODUCTS en el backend). */
export const MAX_RELATED_PRODUCTS = 6

export interface ProductTagRef {
  tagId: number
  name: string
}

/**
 * Campos de POST /products y POST /communities/:id/products. Al publicar el
 * backend exige description, price, type, condition, 3 tags y la portada; un
 * borrador (`saveAsDraft`) solo exige el título.
 */
export interface CreateProductPayload {
  title: string
  description?: string
  price?: number
  type?: ProductType
  condition?: ProductCondition
  tagIds?: number[]
  /** Portada: obligatoria al publicar. */
  image?: File
  /** Galería opcional del detalle. */
  images?: File[]
  /** 0–100. Opcional. */
  discountPercent?: number
  /** false = no sale en listados públicos. Por defecto true. */
  isVisible?: boolean
  /** Países a los que envía (ISO 3166-1 alfa-2). */
  shipsTo?: string[]
  /** Productos propios y activos elegidos por el vendedor (máx. 6). */
  relatedProductIds?: number[]
  /** true = guardar como borrador. */
  saveAsDraft?: boolean
}

/** Vendedor tal como viene en el detalle de un producto. */
export interface ProductSeller {
  sellerId: number
  displayName: string
  isVerified: boolean
  photoUrl: string | null
  /** null si todavía no tiene reseñas. */
  ratingAverage: number | null
  reviewsCount: number
}

/**
 * Detalle de un producto (GET /products/:id, y respuesta de crear, editar y
 * cambiar de estado). En un borrador pueden faltar campos, por eso son null.
 */
export interface ProductDetail {
  id: number
  title: string
  description: string | null
  /** Precio original: nunca se modifica. */
  price: string | number | null
  discountPercent: number | string | null
  /** Precio con descuento (calculado por el backend). Se muestra este y se tacha `price`. */
  finalPrice: number | null
  currency: string | null
  imageUrl: string | null
  status: ProductStatus
  type: ProductType | null
  condition: ProductCondition | null
  shipsTo: string[] | null
  isVisible: boolean
  /** null = producto sin comunidad. */
  communityId: number | null
  publishedAt: string | null
  createdAt: string
  seller: ProductSeller
  productTags: { tag: ProductTagRef }[]
  images: { url: string; order: number }[]
  isSaved: boolean
  /** null si no hay reseñas. */
  ratingAverage: number | null
  reviewsCount: number
}

/**
 * Producto en un listado público (GET /products, /products/recommended,
 * /products/:id/related, /search). El precio llega como número (el backend lo
 * transforma desde el decimal de Postgres).
 */
export interface ProductListItem {
  id: number
  title: string
  description: string
  price: string | number
  discountPercent?: number | string | null
  finalPrice?: number | null
  currency: string
  imageUrl: string
  status: ProductStatus
  type: ProductType
  condition: ProductCondition
  shipsTo?: string[] | null
  communityId: number | null
  createdAt: string
  /** Solo lo trae el listado propio del perfil (ver getMyProducts). */
  community?: { id: number; name: string; slug: string } | null
  productTags?: { tag: ProductTagRef }[]
  isSaved?: boolean
}

export interface ProductPage {
  data: ProductListItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

/** Elemento de GET /products/:id/related: además trae si lo eligió el vendedor. */
export interface RelatedProduct extends ProductListItem {
  isSellerChoice: boolean
}

/** Tarjeta de producto de GET /products/shop (con todos sus tags y el vendedor). */
export interface ShopProduct {
  id: number
  title: string
  price: number
  discountPercent: number | null
  finalPrice: number
  currency: string
  imageUrl: string
  type: ProductType
  condition: ProductCondition
  isSaved: boolean
  tags: ProductTagRef[]
  seller: { sellerId: number; displayName: string; photoUrl: string | null; isVerified: boolean }
}

/** Una sección de la pantalla Shop: un tag con sus productos. */
export interface ShopSection {
  tag: ProductTagRef
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
export type ShopTag = ProductTagRef

/**
 * Tarjeta de GET /products/me (panel del vendedor). Un borrador puede no
 * tener todavía precio, moneda, portada, tipo ni estado de conservación.
 */
export interface MyProductCard {
  id: number
  title: string
  price: number | null
  discountPercent: number | null
  finalPrice: number | null
  currency: string | null
  imageUrl: string | null
  status: ProductStatus
  isVisible: boolean
  publishedAt: string | null
  type: ProductType | null
  condition: ProductCondition | null
  tags: ProductTagRef[]
  /** null = producto sin comunidad. */
  community: { id: number; name: string } | null
}

export interface MyProductsSection {
  tag: ProductTagRef
  totalProducts: number
  products: MyProductCard[]
  pagination: { page: number; limit: number; totalPages: number }
}

export interface MyProductsPage {
  totalProducts: number
  sections: MyProductsSection[]
  pagination: { page: number; limit: number; totalSections: number; totalPages: number }
}

/** Respuesta de GET /products/me/stats: contadores del vendedor por estado y total. */
export interface MyProductsStats {
  total: number
  draft: number
  active: number
  sold: number
  inactive: number
}

export interface MyProductsFilters {
  status?: ProductStatus
  type?: ProductType
  /** Busca entre mis productos por título. */
  q?: string
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
  /** Mueve el producto a esa comunidad (hay que ser miembro); null lo deja sin comunidad; undefined no cambia. */
  communityId?: number | null
  /** 0 quita el descuento. */
  discountPercent?: number
  isVisible?: boolean
  /** Reemplaza los países de envío; [] los quita. */
  shipsTo?: string[]
  /** Reemplaza los relacionados; [] los quita. */
  relatedProductIds?: number[]
}

/** Filtros de GET /products para la pantalla Explorar. */
export interface ExploreFilters {
  category?: number
  type?: ProductType
  condition?: ProductCondition
  /** Rango sobre el precio FINAL (con descuento). Conviene mandarlo junto con `currency`. */
  priceMin?: number
  priceMax?: number
  /** Solo productos en esta moneda (ISO 4217). */
  currency?: string
  /** Solo productos que envían a este país (ISO 3166-1 alfa-2). */
  shipTo?: string
}

// -----------------------------------------------------------------------------
// Reseñas (GET/POST/PATCH/DELETE /products/:id/reviews)
// -----------------------------------------------------------------------------

export const REVIEW_COMMENT_MAX_LENGTH = 1000

export interface ProductReview {
  id: number
  productId: number
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  author: { id: string; username: string; photoUrl: string | null }
  isMine: boolean
}

export interface ProductReviewsPage {
  /** null si no hay reseñas. */
  ratingAverage: number | null
  reviewsCount: number
  data: ProductReview[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ReviewPayload {
  rating: number
  comment?: string
}
