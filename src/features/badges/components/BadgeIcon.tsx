import { useState } from 'react'
import { Award } from 'lucide-react'
import { cx } from '@/utils/cx'
import type { BadgeRarity } from '../models/badges'
import { getBadgeIconUrl, RARITY_STYLES } from '../utils/badgeDisplay'

interface BadgeIconProps {
  code: string
  rarity: BadgeRarity
  /** Clases de tamaño, p. ej. "size-14". */
  className?: string
}

/**
 * Ícono de un badge desde /public/badges/<code>.svg. Si el archivo no existe
 * (un badge nuevo o un SVG que todavía no se subió), muestra un ícono genérico
 * coloreado según la rareza en vez de una imagen rota.
 */
export function BadgeIcon({ code, rarity, className = 'size-14' }: BadgeIconProps) {
  const [failedCode, setFailedCode] = useState<string | null>(null)
  const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.low

  if (failedCode === code) {
    return (
      <span
        aria-hidden="true"
        className={cx('flex shrink-0 items-center justify-center rounded-full ring-2', styles.ring, styles.fallback, className)}
      >
        <Award className="size-1/2" />
      </span>
    )
  }

  return (
    <img
      src={getBadgeIconUrl(code)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailedCode(code)}
      className={cx('shrink-0 object-contain', className)}
    />
  )
}
