/**
 * Cosméticos de perfil (sección 8 y 9 de docs/GUIA_PRO_FRONTEND.md).
 *
 * Tres tipos: banner, skin del ganso y marco del avatar. Cada uno tiene un
 * `code` estable y, si `assetUrl` es null, el recurso vive en el frontend y se
 * mapea por `code` (ver utils/cosmeticVisuals.ts).
 *
 * Regla de oro: se pinta siempre lo EFECTIVO (`cosmetics`, `frame`), nunca lo
 * EQUIPADO (`equipped`). El backend ya resolvió si el usuario tiene derecho a
 * usarlo (gratuito, o Pro vigente).
 */

export const COSMETIC_TYPES = ['banner', 'goose_skin', 'frame'] as const
export type CosmeticType = (typeof COSMETIC_TYPES)[number]

/** Elemento del catálogo (GET /cosmetics). */
export interface Cosmetic {
  id: number
  code: string
  type: CosmeticType
  name: string
  assetUrl: string | null
  /** Solo se aplica con Pro vigente. */
  proOnly: boolean
  /** Lo que se muestra cuando no hay nada equipado (uno por tipo, nunca Pro). */
  isDefault: boolean
  sortOrder: number
}

/** Recurso efectivo de un tipo (ganso o marco). `assetUrl` null = mapear por `code`. */
export interface CosmeticAsset {
  code: string
  assetUrl: string | null
}

/** custom: banner propio (Pro) · catalog: uno del catálogo · default: el por defecto. */
export type BannerSource = 'custom' | 'catalog' | 'default'

export interface EffectiveBanner {
  source: BannerSource
  /** null con el banner propio. */
  code: string | null
  /** Imagen tal cual (puede ser GIF animado): solo en el perfil. null si se mapea por `code`. */
  url: string | null
  /** Primer fotograma si es animado (igual a `url` si no): para listados, chat y posts. */
  staticUrl: string | null
  isAnimated: boolean
}

/** Lo que se aplica ahora (perfil, tienda, búsqueda de usuarios y GET /users/me). */
export interface EffectiveCosmetics {
  banner: EffectiveBanner
  gooseSkin: CosmeticAsset
  frame: CosmeticAsset
}

export interface CosmeticRef {
  id: number
  code: string
}

export interface CustomBanner {
  url: string
  staticUrl: string
  isAnimated: boolean
}

/** Preferencia guardada: no cambia al vencer Pro (vuelve sola al renovar). */
export interface EquippedCosmetics {
  banner: CosmeticRef | null
  gooseSkin: CosmeticRef | null
  frame: CosmeticRef | null
  useCustomBanner: boolean
  customBanner: CustomBanner | null
}

/** GET/PUT /users/me/cosmetics, PUT /users/me/banner. */
export interface MyCosmetics {
  isPro: boolean
  equipped: EquippedCosmetics
  cosmetics: EffectiveCosmetics
}

/**
 * PUT /users/me/cosmetics: solo cambia lo que se manda. `null` deja el tipo en
 * su valor por defecto. Elegir un banner (o null) desactiva el banner propio
 * sin borrarlo; para volver a usarlo, `useCustomBanner: true`.
 */
export interface EquipCosmeticsPayload {
  bannerId?: number | null
  gooseSkinId?: number | null
  frameId?: number | null
  useCustomBanner?: boolean
}

/**
 * Resumen liviano que traen los listados (chat, reseñas, búsquedas, tienda,
 * Shop, detalle de producto) para pintar el badge Pro y el marco. Opcionales
 * porque una respuesta vieja en cache puede no traerlos todavía.
 */
export interface UserDisplaySummary {
  isPro?: boolean
  frame?: CosmeticAsset
}

/** Marco "sin marco": lo que se pinta si el listado no trae `frame`. */
export const DEFAULT_FRAME_CODE = 'frame_default'
export const DEFAULT_BANNER_CODE = 'banner_default'
export const DEFAULT_GOOSE_CODE = 'goose_default'

/** Límites de PUT /users/me/banner (la foto de perfil sigue en 5 MB). */
export const BANNER_MAX_BYTES = 8 * 1024 * 1024
export const BANNER_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
