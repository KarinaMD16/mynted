import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import type { MessageType } from '../models/chat'

interface MessageBubbleProps {
  own: boolean
  type: MessageType
  content: string | null
  imageUrl: string | null
  /** Último de un grupo de mensajes seguidos del mismo autor: lleva la "colita" y el pie. */
  isLastInGroup: boolean
  /** Se está enviando (se ve atenuado; las imágenes llevan un spinner encima). */
  isSending?: boolean
  /** Falló el envío (borde rojo). */
  isFailed?: boolean
  onOpenImage?: (url: string) => void
  /** Hora, "Visto", error… debajo de la burbuja. */
  footer?: ReactNode
}

/**
 * Burbuja de un mensaje. Las propias van a la derecha en azul (el mismo azul
 * de "Contactar vendedor"); las del otro, a la izquierda en blanco con borde,
 * como las tarjetas de la app, para que contrasten con el fondo gris del hilo.
 */
export function MessageBubble({
  own,
  type,
  content,
  imageUrl,
  isLastInGroup,
  isSending = false,
  isFailed = false,
  onOpenImage,
  footer,
}: MessageBubbleProps) {
  const { t } = useLanguage()

  return (
    <div className={cx('flex flex-col', own ? 'items-end' : 'items-start')}>
      {type === 'image' && imageUrl ? (
        <button
          type="button"
          onClick={() => onOpenImage?.(imageUrl)}
          disabled={isSending || !onOpenImage}
          aria-label={t('chat.message.openImage')}
          className={cx(
            'relative h-[165px] w-[220px] max-w-[75%] cursor-zoom-in overflow-hidden rounded-2xl border bg-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid disabled:cursor-default',
            isFailed ? 'border-[#e5484d]' : 'border-mynted-border',
          )}
        >
          <img
            src={imageUrl}
            alt={t('chat.message.image')}
            loading="lazy"
            className={cx('size-full object-cover', isSending && 'opacity-60')}
          />
          {isSending && (
            <span className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="size-7 animate-spin text-white drop-shadow" aria-hidden="true" />
            </span>
          )}
        </button>
      ) : (
        <p
          className={cx(
            'max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-[1.45] break-words whitespace-pre-wrap sm:max-w-[75%]',
            own ? 'bg-mynted-blue text-white' : 'border border-mynted-border bg-white text-mynted-ink',
            isLastInGroup && (own ? 'rounded-br-md' : 'rounded-bl-md'),
            isSending && 'opacity-70',
            isFailed && 'ring-2 ring-[#e5484d] ring-offset-1',
          )}
        >
          {content}
        </p>
      )}
      {footer && <div className={cx('mt-1 flex items-center gap-2 px-1 text-[11px] text-mynted-gray', own && 'flex-row-reverse')}>{footer}</div>}
    </div>
  )
}
