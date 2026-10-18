/** Rareza de un badge (BadgeRarity en el backend). */
export type BadgeRarity = 'low' | 'medium' | 'high'

/** user: se otorga a la cuenta. community_profile: al perfil dentro de una comunidad. */
export type BadgeScope = 'user' | 'community_profile'

/**
 * Badge ya ganado, tal como lo devuelven GET /users/:id/badges y
 * GET /community-profiles/:id/badges (AwardedBadge en el backend).
 * `icon` llega siempre en null: el ícono vive en /public/badges/<code>.svg.
 */
export interface AwardedBadge {
  code: string
  name: string
  description: string
  criteria: string
  icon: string | null
  rarity: BadgeRarity
  scope: BadgeScope
  awardedAt: string
}

/** Códigos que el backend siembra (BADGE_CODES). Los que tienen traducción en i18n. */
export const KNOWN_BADGE_CODES = [
  'first_post',
  'community_voice',
  'conversationalist',
  'franchise_collector',
  'community_founder',
  'moderator',
  'verified_seller',
  'founding_member',
  'anniversary',
  'trusted_seller',
  'successful_exchange',
] as const

export type KnownBadgeCode = (typeof KNOWN_BADGE_CODES)[number]

export function isKnownBadgeCode(code: string): code is KnownBadgeCode {
  return (KNOWN_BADGE_CODES as readonly string[]).includes(code)
}
