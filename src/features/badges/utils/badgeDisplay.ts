import type { TranslateFn } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { isKnownBadgeCode, type AwardedBadge, type BadgeRarity } from '../models/badges'

/** Ícono de un badge: /public/badges/<code>.svg (Vite sirve /public en la raíz). */
export function getBadgeIconUrl(code: string): string {
  return `${import.meta.env.BASE_URL}badges/${encodeURIComponent(code)}.svg`
}

/** Aro, fondo del ícono de respaldo y etiqueta según la rareza (common < … < legendary). */
export const RARITY_STYLES: Record<BadgeRarity, { ring: string; fallback: string; pill: string }> = {
  common: { ring: 'ring-mynted-border', fallback: 'bg-mynted-bg text-mynted-gray', pill: 'bg-mynted-bg text-mynted-gray' },
  uncommon: { ring: 'ring-green-300', fallback: 'bg-green-50 text-green-600', pill: 'bg-green-50 text-green-700' },
  rare: { ring: 'ring-mynted-blue/40', fallback: 'bg-mynted-blue/10 text-mynted-blue', pill: 'bg-mynted-blue/10 text-mynted-blue-dark' },
  epic: { ring: 'ring-purple-300', fallback: 'bg-purple-50 text-purple-600', pill: 'bg-purple-50 text-purple-700' },
  legendary: { ring: 'ring-mynted-orange/60', fallback: 'bg-mynted-orange/10 text-mynted-orange', pill: 'bg-mynted-orange/10 text-mynted-orange' },
}

export function getRarityStyles(rarity: string) {
  return RARITY_STYLES[rarity as BadgeRarity] ?? RARITY_STYLES.common
}

/**
 * Textos del badge en el idioma de la app. El backend solo manda nombre y
 * descripción en español (y ya no manda cómo se consigue): si el código es
 * conocido se usan las traducciones de i18n; si es uno nuevo que todavía no
 * está en los diccionarios, nombre y descripción del backend y sin criterio.
 */
export function getBadgeTexts(badge: AwardedBadge, t: TranslateFn): { name: string; description: string; criteria: string | null } {
  if (!isKnownBadgeCode(badge.code)) {
    return { name: badge.name, description: badge.description, criteria: null }
  }
  return {
    name: t(`badges.${badge.code}.name` as TranslationKey),
    description: t(`badges.${badge.code}.description` as TranslationKey),
    criteria: t(`badges.${badge.code}.criteria` as TranslationKey),
  }
}
