/** Rareza de un badge (BadgeRarity en el backend), de menor a mayor. */
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** user: se otorga a la cuenta. community: al perfil de la persona dentro de una comunidad. */
export type BadgeScope = 'user' | 'community'

/**
 * Badge tal como lo devuelven GET /badges (catálogo), GET /users/me/badges,
 * GET /users/:id/badges y GET /community-profiles/:id/badges (BadgeItem en el backend).
 * - `awardedAt`: null en el catálogo y en los derivados.
 * - `derived`: community_founder / moderator salen del rol actual en la comunidad
 *   (no se guardan; si cambia el rol, desaparecen solos).
 * El ícono vive en /public/badges/<code>.svg.
 */
export interface AwardedBadge {
  code: string
  name: string
  description: string
  scope: BadgeScope
  rarity: BadgeRarity
  awardedAt: string | null
  derived: boolean
}

/** Códigos que siembra el backend (BADGE_CODES): los que tienen traducción e ícono. */
export const KNOWN_BADGE_CODES = [
  'verified_seller',
  'trusted_seller',
  'successful_exchange',
  'founding_member',
  'anniversary',
  'first_post',
  'talkative',
  'community_voice',
  'community_collector',
  'community_founding_member',
  'community_founder',
  'moderator',
  // Derivado: aparece mientras la suscripción Mynted Pro esté vigente (no se guarda).
  'pro',
] as const

export type KnownBadgeCode = (typeof KNOWN_BADGE_CODES)[number]

export function isKnownBadgeCode(code: string): code is KnownBadgeCode {
  return (KNOWN_BADGE_CODES as readonly string[]).includes(code)
}
