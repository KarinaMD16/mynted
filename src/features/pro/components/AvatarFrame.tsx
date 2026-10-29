import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'
import type { CosmeticAsset } from '../models/cosmetics'
import { getFrameStyle } from '../utils/cosmeticVisuals'

/** Grosor del aro según el tamaño del avatar. */
const RING = {
  sm: 'p-[2px]',
  md: 'p-[2.5px]',
  lg: 'p-1',
}

interface AvatarFrameProps {
  /**
   * Marco EFECTIVO (el que manda el backend en `frame` o `cosmetics.frame`).
   * Sin marco, `frame_default` o un código desconocido: el avatar se ve igual que siempre.
   */
  frame?: CosmeticAsset | null
  size?: keyof typeof RING
  /** Posición y tamaño del avatar: el hijo ocupa todo el espacio (size-full). */
  className?: string
  children: ReactNode
}

/**
 * Envuelve un avatar redondo con el marco cosmético del usuario. El hijo debe
 * ser el círculo del avatar con `size-full`: el aro se dibuja por fuera de él
 * (padding + fondo), así el tamaño total del avatar no cambia con o sin marco.
 */
export function AvatarFrame({ frame, size = 'md', className, children }: AvatarFrameProps) {
  const style = frame?.assetUrl ? null : getFrameStyle(frame?.code)

  return (
    <span className={cx('relative inline-flex shrink-0 rounded-full', style && RING[size], className)} style={style ?? undefined}>
      {children}
      {/* Un marco con imagen propia (assetUrl) se superpone al avatar. */}
      {frame?.assetUrl && (
        <img
          src={frame.assetUrl}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute -top-[12%] -left-[12%] size-[124%] max-w-none object-contain"
        />
      )}
    </span>
  )
}
