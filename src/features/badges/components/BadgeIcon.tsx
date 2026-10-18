import { useState } from 'react'
import { Award } from 'lucide-react'
import { cx } from '@/utils/cx'
import { getBadgeIconUrl, getRarityStyles } from '../utils/badgeDisplay'

interface BadgeIconProps {
  code: string
  rarity: string
  /** Badge todavía no ganado: se pinta en gris y transparente. */
  locked?: boolean
  /** Clases de tamaño, p. ej. "size-14". */
  className?: string
}

/**
 * Ícono de un badge desde /public/badges/<code>.svg. Si el archivo no existe
 * (un badge nuevo o un SVG que todavía no se subió), muestra un ícono genérico
 * coloreado según la rareza en vez de una imagen rota.
 */
export function BadgeIcon({ code, rarity, locked = false, className = 'size-14' }: BadgeIconProps) {
  const [failedCode, setFailedCode] = useState<string | null>(null)
  const styles = getRarityStyles(rarity)
  const lockedClass = locked && 'opacity-40 grayscale'

  if (failedCode === code) {
    return (
      <span
        aria-hidden="true"
        className={cx('flex shrink-0 items-center justify-center rounded-full ring-2', styles.ring, styles.fallback, lockedClass, className)}
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
      className={cx('shrink-0 object-contain', lockedClass, className)}
    />
  )
}
