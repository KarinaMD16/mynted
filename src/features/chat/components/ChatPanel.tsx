import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, WifiOff, X } from 'lucide-react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { QueryErrorState } from '@/components/errors/QueryErrorState'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useLanguage } from '@/i18n/LanguageContext'
import { ReportMenu } from '@/features/reports/components/ReportMenu'
import { cx } from '@/utils/cx'
import { useIsChatConnected } from '../hooks/useChatConnection'
import { useConversationMessages } from '../hooks/useChatQueries'
import { useConversationRoom } from '../hooks/useConversationRoom'
import { useSendMessages } from '../hooks/useSendMessages'
import { ChatBuyBar } from './ChatBuyBar'
import { ChatComposer } from './ChatComposer'
import { ChatHeader, chatIconButtonClass } from './ChatHeader'
import { ChatProductCard } from './ChatProductCard'
import { ChatProductTicket } from './ChatProductTicket'
import { MessageThread } from './MessageThread'

interface ChatPanelProps {
  conversationId: number
  /** 'sheet': panel del detalle de producto (sin enlace al producto, con cerrar). 'page': /messages. */
  variant: 'page' | 'sheet'
  onBack?: () => void
  onClose?: () => void
  className?: string
}

/**
 * Chat completo de una conversación: cabecera, producto, hilo y caja para
 * escribir. Lo usan el panel lateral del detalle de producto y /messages, así
 * que todo el comportamiento vive acá y las pantallas solo deciden dónde va.
 *
 * Ocupa todo el alto de su contenedor (el hilo es lo único que scrollea).
 */
export function ChatPanel({ conversationId, variant, onBack, onClose, className }: ChatPanelProps) {
  const { t } = useLanguage()
  const { userId } = useCurrentUser()
  const history = useConversationMessages(conversationId)
  const { isOtherOnline } = useConversationRoom(conversationId)
  const { pending, sendText, sendImage, retry, discard } = useSendMessages(conversationId)
  const isConnected = useIsChatConnected()
  const [isTicketVisible, setIsTicketVisible] = useState(true)
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  const suggestions = [
    t('chat.suggestions.available'),
    t('chat.suggestions.box'),
    t('chat.suggestions.shipping'),
    t('chat.suggestions.trade'),
  ]

  const messages = useMemo(() => history.data?.pages.flatMap((page) => page.data) ?? [], [history.data])
  const context = history.data?.pages[0]?.conversation
  // El historial lo dice al cargar; un mensaje del vendedor que llega en vivo lo habilita sin recargar.
  const sellerHasReplied =
    context?.sellerHasReplied === true ||
    (context?.viewerRole === 'buyer' && messages.some((message) => message.senderId === context.otherParticipant.id))
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = history
  const loadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const shell = cx('flex h-full min-h-0 flex-col overflow-hidden bg-white', className)

  if (history.isPending) {
    return <ChatPanelSkeleton className={className} showClose={Boolean(onClose)} />
  }

  if (history.isError || !context) {
    return (
      <div className={shell}>
        {(onBack || onClose) && (
          <div className="flex justify-between border-b border-mynted-border px-3 py-3">
            {onBack ? (
              <button type="button" onClick={onBack} aria-label={t('chat.header.back')} className={chatIconButtonClass}>
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
            ) : (
              <span />
            )}
            {onClose && (
              <button type="button" onClick={onClose} aria-label={t('chat.header.close')} className={chatIconButtonClass}>
                <X className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-4">
          <QueryErrorState
            error={history.error}
            onRetry={() => void history.refetch()}
            variant="compact"
            texts={{
              notFound: { description: t('chat.error.notFound') },
              forbidden: { description: t('chat.error.forbidden') },
              error: { description: t('chat.error.load') },
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <section ref={setPanel} className={shell} aria-label={context.otherParticipant.displayName}>
      {/* En la burbuja y en el detalle de producto el chat es un diálogo modal
          (Radix): un menú montado en body quedaría detrás, sin recibir clics,
          y tocarlo contaría como clic afuera. Por eso se monta dentro del panel. */}
      <UNSAFE_PortalProvider getContainer={() => panel}>
        <ChatHeader
          participant={context.otherParticipant}
          isOnline={isOtherOnline}
          onBack={onBack}
          onClose={onClose}
          /* Una conversación nunca es "contenido propio": siempre hay otro. */
          actions={<ReportMenu itemType="conversation" itemId={conversationId} placement="bottom end" />}
        />
      </UNSAFE_PortalProvider>
      {/*
        Mientras la ficha del producto (al principio del hilo) está a la vista, la tira fija
        sobra; aparece al bajar por la conversación, para no perder de qué se habla.
      */}
      <div
        className={cx(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          isTicketVisible ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        )}
        aria-hidden={isTicketVisible || undefined}
        inert={isTicketVisible || undefined}
      >
        <div className="overflow-hidden">
          <ChatProductCard product={context.product} linkToProduct={variant === 'page'} />
        </div>
      </div>

      {/* key: al cambiar de estado se reinicia la espera (ver OfflineNotice). */}
      <OfflineNotice key={String(isConnected)} isOffline={!isConnected} />

      <MessageThread
        messages={messages}
        pending={pending}
        currentUserId={userId}
        hasOlder={Boolean(hasNextPage)}
        isLoadingOlder={isFetchingNextPage}
        onLoadOlder={loadOlder}
        onRetry={retry}
        onDiscard={discard}
        start={<ChatProductTicket product={context.product} linkToProduct={variant === 'page'} />}
        onStartVisibilityChange={setIsTicketVisible}
      />

      <ChatBuyBar context={context} sellerHasReplied={sellerHasReplied} onClose={onClose} />

      {/* En el panel del producto se enfoca la caja al abrir, salvo en pantallas táctiles (abriría el teclado encima del chat). */}
      <ChatComposer
        onSendText={sendText}
        onSendImage={sendImage}
        autoFocus={variant === 'sheet' && hasFinePointer()}
        // Al empezar (sin mensajes todavía): preguntas típicas de coleccionista.
        suggestions={messages.length === 0 && pending.length === 0 ? suggestions : undefined}
      />
    </section>
  )
}

function hasFinePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}

/** Cuánto esperar antes de avisar que no hay conexión (evita el parpadeo al conectar o en cortes cortitos). */
const OFFLINE_NOTICE_DELAY_MS = 3000

/** Aviso de "reconectando": con el socket caído el chat sigue andando por REST, solo se pierde lo en vivo. */
function OfflineNotice({ isOffline }: { isOffline: boolean }) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isOffline) return
    const timer = window.setTimeout(() => setVisible(true), OFFLINE_NOTICE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isOffline])

  if (!isOffline || !visible) return null
  return (
    <p role="status" className="flex items-center gap-2 border-b border-mynted-border bg-[#fff4d6] px-4 py-2 text-xs text-[#8a5a00]">
      <WifiOff className="size-3.5 shrink-0" aria-hidden="true" />
      {t('chat.connection.offline')}
    </p>
  )
}

/** Esqueleto del chat: mientras carga el historial, y en el panel acoplado mientras se abre. */
export function ChatPanelSkeleton({ className, showClose = true }: { className?: string; showClose?: boolean }) {
  return (
    <div className={cx('flex h-full min-h-0 flex-col overflow-hidden bg-white', className)} aria-busy="true">
      <div className="flex items-center gap-3 border-b border-mynted-border px-4 py-3">
        <span className="size-11 animate-pulse rounded-full bg-mynted-bg" />
        <span className="flex flex-1 flex-col gap-2">
          <span className="h-3.5 w-32 animate-pulse rounded bg-mynted-bg" />
          <span className="h-3 w-20 animate-pulse rounded bg-mynted-bg" />
        </span>
        {showClose && <span className="size-10 rounded-full bg-mynted-bg" />}
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 bg-mynted-bg p-5">
        <span className="h-10 w-2/3 animate-pulse rounded-2xl bg-white" />
        <span className="h-10 w-1/2 animate-pulse self-end rounded-2xl bg-mynted-border" />
        <span className="h-10 w-3/5 animate-pulse rounded-2xl bg-white" />
      </div>
      <div className="h-[65px] border-t border-mynted-border bg-white" />
    </div>
  )
}
