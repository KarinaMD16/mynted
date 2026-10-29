import { useState } from 'react'
import { cx } from '@/utils/cx'
import type { EffectiveBanner } from '../models/cosmetics'
import { getBannerVisual, type BannerDecor } from '../utils/cosmeticVisuals'

interface ProfileBannerProps {
  /** Banner EFECTIVO (`cosmetics.banner`). Sin él se dibuja el banner por defecto. */
  banner?: EffectiveBanner | null
  /**
   * `animated` (perfil y tienda): usa `url`, que puede ser un GIF animado.
   * `static` (miniaturas, selector): usa `staticUrl`, el primer fotograma.
   */
  mode?: 'animated' | 'static'
  /** URL ya resuelta por el backend (p. ej. `bannerUrl` de la tienda) si no hay `banner`. */
  fallbackUrl?: string | null
  /** Decoración más chica, para miniaturas. */
  compact?: boolean
  /** Alto y bordes. Por defecto, el del perfil. */
  className?: string
}

/**
 * Banner de la cabecera del perfil y de la tienda. Pinta el banner propio
 * (imagen o GIF, solo Pro) o el del catálogo, que se dibuja por `code`
 * (ver getBannerVisual). Es decorativo: se oculta a lectores de pantalla.
 */
export function ProfileBanner({
  banner,
  mode = 'animated',
  fallbackUrl = null,
  compact = false,
  className = 'h-[110px] rounded-2xl sm:h-[140px]',
}: ProfileBannerProps) {
  const bannerUrl = banner ? (mode === 'animated' ? banner.url : (banner.staticUrl ?? banner.url)) : null
  const imageUrl = bannerUrl ?? fallbackUrl
  // Si la imagen no carga (borrada, bloqueada), se cae al dibujo del catálogo.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (imageUrl && imageUrl !== failedUrl) {
    return (
      <div aria-hidden="true" className={cx('relative overflow-hidden bg-mynted-border', className)}>
        <img src={imageUrl} alt="" onError={() => setFailedUrl(imageUrl)} className="size-full object-cover" />
      </div>
    )
  }

  const visual = getBannerVisual(banner?.code)
  return (
    <div aria-hidden="true" className={cx('relative overflow-hidden', className)} style={{ background: visual.background }}>
      <BannerDecoration decor={visual.decor} compact={compact} />
    </div>
  )
}

function BannerDecoration({ decor, compact }: { decor: BannerDecor; compact: boolean }) {
  if (decor === 'aurora') {
    return (
      <>
        <div className="absolute -top-1/2 left-[5%] h-full w-1/2 rounded-full bg-[#2ee6c5]/60 blur-2xl" />
        <div className="absolute -bottom-1/2 left-[35%] h-full w-1/2 rounded-full bg-[#7b5cff]/55 blur-2xl" />
        <div className="absolute -top-1/3 right-[2%] h-3/4 w-1/3 rounded-full bg-[#5cff9d]/45 blur-2xl" />
        {!compact && (
          <>
            <span className="absolute top-[22%] left-[18%] size-1 rounded-full bg-white/80" />
            <span className="absolute top-[60%] left-[72%] size-1 rounded-full bg-white/70" />
            <span className="absolute top-[30%] left-[86%] size-0.5 rounded-full bg-white/80" />
            <span className="absolute top-[70%] left-[30%] size-0.5 rounded-full bg-white/70" />
          </>
        )}
      </>
    )
  }

  if (decor === 'shine') {
    return (
      <>
        <div className="absolute inset-y-0 left-[30%] w-[18%] -skew-x-12 bg-white/30 blur-sm" />
        <div className="absolute inset-y-0 left-[52%] w-[6%] -skew-x-12 bg-white/25 blur-[2px]" />
        <div className={cx('absolute rounded-full bg-white/15', compact ? '-top-4 right-[6%] size-12' : '-top-10 right-[8%] size-40')} />
      </>
    )
  }

  return (
    <>
      <div className={cx('absolute rounded-full bg-white/10', compact ? '-top-4 right-[8%] size-14' : '-top-10 right-[8%] size-40')} />
      <div className={cx('absolute rounded-full bg-white/10', compact ? '-bottom-5 left-[6%] size-10' : '-bottom-12 left-[6%] size-32')} />
      <div className={cx('absolute top-1/3 left-[42%] rounded-full bg-white/10', compact ? 'size-5' : 'size-16')} />
    </>
  )
}
