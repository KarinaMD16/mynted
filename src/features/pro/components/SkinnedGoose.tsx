import { useState } from 'react'
import { cx } from '@/utils/cx'
import type { CosmeticAsset } from '../models/cosmetics'
import { getGooseVisual, type GooseAccessory } from '../utils/cosmeticVisuals'

/**
 * El gansito de Mynted con la skin EFECTIVA del usuario (`cosmetics.gooseSkin`).
 * Las skins del catálogo base se dibujan sobre la misma ilustración: un tinte
 * (ganso azul) o un accesorio vectorial encima (ninja, astronauta). Si la skin
 * trae `assetUrl`, se usa esa imagen. Es decorativo (aria-hidden).
 */
export function SkinnedGoose({ skin, className }: { skin?: CosmeticAsset | null; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const customUrl = skin?.assetUrl && skin.assetUrl !== failedUrl ? skin.assetUrl : null
  const visual = getGooseVisual(skin?.code)

  return (
    <span aria-hidden="true" className={cx('relative inline-block shrink-0', className)}>
      <img
        src={customUrl ?? `${import.meta.env.BASE_URL}goose-avatar.webp`}
        alt=""
        draggable={false}
        onError={customUrl ? () => setFailedUrl(customUrl) : undefined}
        className="size-full object-contain"
        style={customUrl ? undefined : { filter: visual.filter }}
      />
      {!customUrl && visual.accessory && <GooseAccessoryOverlay accessory={visual.accessory} />}
    </span>
  )
}

/** Accesorio sobre la ilustración (coordenadas en % de la imagen del ganso). */
function GooseAccessoryOverlay({ accessory }: { accessory: NonNullable<GooseAccessory> }) {
  if (accessory === 'ninja') {
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" fill="none">
        {/* Cintas del nudo, saliendo por detrás de la cabeza. */}
        <path d="M39 23c-7-4-13 0-21-3" stroke="#1f2937" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M39 25.5c-6 2-10 7-17 8" stroke="#1f2937" strokeWidth="2.8" strokeLinecap="round" />
        <g transform="rotate(-5 53 25)">
          <rect x="37" y="21" width="34" height="7.5" rx="3" fill="#1f2937" />
          <rect x="38.5" y="24" width="31" height="1.5" rx="0.75" fill="#ef4444" />
          <circle cx="39.5" cy="24.8" r="2.4" fill="#1f2937" />
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" fill="none">
      {/* Casco de burbuja con reflejo y antena. */}
      <circle cx="52" cy="40" r="37" fill="rgba(186, 230, 253, 0.16)" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="52" cy="40" r="37" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.6" />
      <path d="M26 26a30 30 0 0 1 18-14" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 14l5-8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="84" cy="5" r="2.5" fill="#fd8552" />
    </svg>
  )
}
