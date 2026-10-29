import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, X } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageContext'
import { ProBadge } from '@/features/pro/components/ProBadge'
import { cx } from '@/utils/cx'
import type { ChatParticipant } from '../models/chat'
import { ChatAvatar } from './ChatAvatar'
import { VerifiedMark } from './VerifiedMark'

export const chatIconButtonClass =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-mynted-ink outline-none transition-colors hover:bg-mynted-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid'

interface ChatHeaderProps {
  participant: ChatParticipant
  isOnline: boolean
  /** Flecha "volver" (bandeja en móvil). */
  onBack?: () => void
  /** Botón "cerrar" (panel del detalle de producto). */
  onClose?: () => void
  /** Acciones a la derecha del nombre; hoy es el menú de reportar. */
  actions?: ReactNode
}

/**
 * Cabecera del chat: quién es el otro y si está activo ahora. Avatar y nombre
 * llevan a su perfil (/users/$userId). No hay botón de llamada: el backend no
 * tiene llamadas.
 */
export function ChatHeader({ participant, isOnline, onBack, onClose, actions }: ChatHeaderProps) {
  const { t } = useLanguage()

  return (
    <header className="flex items-center gap-2 border-b border-mynted-border bg-white px-3 py-3 sm:gap-3 sm:px-4">
      {onBack && (
        <button type="button" onClick={onBack} aria-label={t('chat.header.back')} className={chatIconButtonClass}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
      )}

      {/* Avatar y nombre llevan al perfil del otro (vendedor o comprador). */}
      <Link
        to="/users/$userId"
        params={{ userId: participant.id }}
        className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
      >
        <ChatAvatar name={participant.displayName} photoUrl={participant.photoUrl} online={isOnline} frame={participant.frame} />

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-heading text-base font-semibold text-mynted-ink group-hover:underline">
              {participant.displayName}
            </span>
            {participant.isVerified && <VerifiedMark />}
            {participant.isPro && <ProBadge size="xs" />}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-mynted-gray">
            <span className={cx('size-[7px] rounded-full', isOnline ? 'bg-[#22c55e]' : 'bg-mynted-gray-light')} aria-hidden="true" />
            {isOnline ? t('chat.header.online') : t('chat.header.offline')}
          </span>
        </span>
      </Link>

      {actions}

      {onClose && (
        <button type="button" onClick={onClose} aria-label={t('chat.header.close')} className={cx(chatIconButtonClass, 'bg-mynted-bg')}>
          <X className="size-[18px]" aria-hidden="true" />
        </button>
      )}
    </header>
  )
}
