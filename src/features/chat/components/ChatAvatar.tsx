import { useState } from 'react'
import { AvatarFrame } from '@/features/pro/components/AvatarFrame'
import type { CosmeticAsset } from '@/features/pro/models/cosmetics'
import { cx } from '@/utils/cx'
import { getChatInitials } from '../utils/chatFormat'

interface ChatAvatarProps {
  name: string
  photoUrl: string | null
  /** Muestra el punto verde de "activo ahora". */
  online?: boolean
  size?: 'sm' | 'md'
  /** Marco cosmético efectivo (`otherParticipant.frame`). Sin él, el avatar de siempre. */
  frame?: CosmeticAsset
  className?: string
}

const SIZES = {
  sm: { box: 'size-10', text: 'text-sm', dot: 'size-2.5' },
  md: { box: 'size-11', text: 'text-[15px]', dot: 'size-3' },
}

/**
 * Avatar del otro participante: su foto o sus iniciales sobre amarillo, igual
 * que el avatar del vendedor en el detalle de producto. Si la foto no carga
 * (url vencida, bloqueada), cae a las iniciales en vez de mostrar una imagen rota.
 */
export function ChatAvatar({ name, photoUrl, online = false, size = 'md', frame, className }: ChatAvatarProps) {
  const styles = SIZES[size]
  // Se guarda QUÉ url falló (no un booleano) para que si cambia la foto se vuelva a intentar.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const showPhoto = Boolean(photoUrl) && photoUrl !== failedUrl
  return (
    <span className={cx('relative inline-flex shrink-0', styles.box, className)} aria-hidden="true">
      <AvatarFrame frame={frame} size="sm" className="size-full">
        {showPhoto && photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            // Las fotos de Google (lh3.googleusercontent.com) responden 403 si llega un Referer
            // de otro sitio; igual que en el resto de avatares de la app.
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(photoUrl)}
            className="size-full rounded-full bg-mynted-bg object-cover"
          />
        ) : (
          <span
            className={cx(
              'flex size-full items-center justify-center rounded-full bg-mynted-yellow font-heading font-semibold text-mynted-ink',
              styles.text,
            )}
          >
            {getChatInitials(name)}
          </span>
        )}
      </AvatarFrame>
      {online && (
        <span className={cx('absolute right-0 bottom-0 rounded-full bg-[#22c55e] ring-2 ring-white', styles.dot)} />
      )}
    </span>
  )
}
