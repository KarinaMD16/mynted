import type { TranslateFn } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import { isKnownBadgeCode, type AwardedBadge, type BadgeRarity } from '../models/badges'

/** Ícono de un badge: /public/badges/<code>.svg (Vite sirve /public en la raíz). */
export function getBadgeIconUrl(code: string): string {
  return `${import.meta.env.BASE_URL}badges/${encodeURIComponent(code)}.svg`
}

/** Aro y fondo según la rareza, también para el ícono de respaldo si falta el SVG. */
export const RARITY_STYLES: Record<BadgeRarity, { ring: string; fallback: string; pill: string }> = {
  low: { ring: 'ring-mynted-border', fallback: 'bg-mynted-bg text-mynted-gray', pill: 'bg-mynted-bg text-mynted-gray' },
  medium: {
    ring: 'ring-mynted-blue/40',
    fallback: 'bg-mynted-blue/10 text-mynted-blue',
    pill: 'bg-mynted-blue/10 text-mynted-blue-dark',
  },
  high: {
    ring: 'ring-mynted-orange/60',
    fallback: 'bg-mynted-orange/10 text-mynted-orange',
    pill: 'bg-mynted-orange/10 text-mynted-orange',
  },
}

/**
 * Textos del badge en el idioma de la app. El backend solo los manda en
 * español: si el código es conocido se usa la traducción de i18n; si es uno
 * nuevo que todavía no está en los diccionarios, se usa lo que mande el backend.
 */
export function getBadgeTexts(badge: AwardedBadge, t: TranslateFn) {
  if (!isKnownBadgeCode(badge.code)) {
    return { name: badge.name, description: badge.description, criteria: badge.criteria }
  }
  return {
    name: t(`badges.${badge.code}.name` as TranslationKey),
    description: t(`badges.${badge.code}.description` as TranslationKey),
    criteria: t(`badges.${badge.code}.criteria` as TranslationKey),
  }
}
