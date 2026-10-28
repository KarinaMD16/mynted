import type { CSSProperties } from 'react'
import type { TranslateFn } from '@/i18n/LanguageContext'
import type { TranslationKey } from '@/i18n/translations/es'
import type { Cosmetic } from '../models/cosmetics'

/**
 * Recursos gráficos de los cosméticos que viven en el frontend.
 *
 * El backend manda `assetUrl: null` para todos los del catálogo base: el
 * frontend los dibuja por `code` (que es estable). Si algún día un cosmético
 * trae `assetUrl`, se usa esa imagen y esto queda como respaldo. Un `code`
 * desconocido (uno nuevo que todavía no se dibujó aquí) cae al valor por
 * defecto del tipo en vez de romper la pantalla.
 */

/** Degradado de marca de Mynted Pro (naranja → azul), el mismo del badge. */
export const PRO_GRADIENT = 'linear-gradient(135deg, #fd8552 0%, #c45fd6 55%, #2f5fff 100%)'

// -----------------------------------------------------------------------------
// Banners
// -----------------------------------------------------------------------------

export type BannerDecor = 'circles' | 'aurora' | 'shine'

export interface BannerVisual {
  background: string
  decor: BannerDecor
}

const BANNER_VISUALS: Record<string, BannerVisual> = {
  // El degradado azul → naranja de siempre (era el CoverBanner del perfil).
  banner_default: { background: 'linear-gradient(135deg, #2561f3 0%, #fd8552 100%)', decor: 'circles' },
  banner_sunset: { background: 'linear-gradient(135deg, #ffb36b 0%, #ff6f91 55%, #845ec2 100%)', decor: 'circles' },
  banner_aurora: { background: 'linear-gradient(160deg, #0b1437 0%, #10224f 60%, #1b0f3d 100%)', decor: 'aurora' },
  banner_gold: { background: 'linear-gradient(135deg, #fbe7a1 0%, #e0a526 45%, #9a6b12 100%)', decor: 'shine' },
}

export function getBannerVisual(code: string | null | undefined): BannerVisual {
  return (code && BANNER_VISUALS[code]) || BANNER_VISUALS.banner_default
}

// -----------------------------------------------------------------------------
// Marcos del avatar
// -----------------------------------------------------------------------------

/** null = sin marco (frame_default): el avatar se ve como siempre. */
export function getFrameStyle(code: string | null | undefined): CSSProperties | null {
  switch (code) {
    case 'frame_simple':
      return { background: '#1c1c1f' }
    case 'frame_gold':
      return {
        background: 'conic-gradient(from 210deg, #fff3b0, #e0a526, #fff6c8, #b8860b, #fff3b0)',
        boxShadow: '0 0 0 1px rgba(184, 134, 11, 0.25), 0 4px 14px -4px rgba(224, 165, 38, 0.55)',
      }
    case 'frame_neon':
      return {
        background: 'conic-gradient(from 0deg, #22d3ee, #a855f7, #ec4899, #22d3ee)',
        boxShadow: '0 0 14px rgba(168, 85, 247, 0.55)',
      }
    default:
      return null
  }
}

// -----------------------------------------------------------------------------
// Skins del ganso
// -----------------------------------------------------------------------------

export type GooseAccessory = 'ninja' | 'astronaut' | null

export interface GooseVisual {
  /** Filtro CSS sobre la ilustración (el ganso es blanco: se tiñe). */
  filter?: string
  accessory: GooseAccessory
}

const GOOSE_VISUALS: Record<string, GooseVisual> = {
  goose_default: { accessory: null },
  goose_blue: { filter: 'sepia(0.55) saturate(3.2) hue-rotate(170deg) brightness(0.97)', accessory: null },
  goose_ninja: { accessory: 'ninja' },
  goose_astronaut: { accessory: 'astronaut' },
}

export function getGooseVisual(code: string | null | undefined): GooseVisual {
  return (code && GOOSE_VISUALS[code]) || GOOSE_VISUALS.goose_default
}

// -----------------------------------------------------------------------------
// Nombres
// -----------------------------------------------------------------------------

/** Cosméticos con nombre traducido. Uno nuevo usa el nombre (en español) que manda el backend. */
const KNOWN_COSMETIC_CODES = new Set([
  'banner_default',
  'banner_sunset',
  'banner_aurora',
  'banner_gold',
  'goose_default',
  'goose_blue',
  'goose_ninja',
  'goose_astronaut',
  'frame_default',
  'frame_simple',
  'frame_gold',
  'frame_neon',
])

export function getCosmeticName(cosmetic: Pick<Cosmetic, 'code' | 'name'>, t: TranslateFn): string {
  return KNOWN_COSMETIC_CODES.has(cosmetic.code) ? t(`cosmetics.${cosmetic.code}` as TranslationKey) : cosmetic.name
}
