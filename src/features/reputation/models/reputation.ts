import type { AwardedBadge } from '@/features/badges/models/badges'
import type { CosmeticAsset } from '@/features/pro/models/cosmetics'

/** Reseñas por estrellas: siempre trae las 5 claves (0 si no hay). */
export type RatingDistribution = Record<'1' | '2' | '3' | '4' | '5', number>

/**
 * GET /profiles/:userId/reputation (público). Si el usuario no es vendedor
 * aprobado: `isSeller: false`, `ratingAverage: null` y conteos en 0.
 */
export interface UserReputation {
  userId: string
  isSeller: boolean
  isPro: boolean
  frame: CosmeticAsset
  /** Promedio (1 decimal) de las reseñas de todos sus productos; null si no tiene. */
  ratingAverage: number | null
  reviewsCount: number
  completedSalesCount: number
  ratingDistribution: RatingDistribution
  badges: AwardedBadge[]
}
