import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, LoaderCircle, MessageCircle } from 'lucide-react'
import { ImagePreviewDialog } from '@/components/ui/ImagePreviewDialog'
import { useLanguage } from '@/i18n/LanguageContext'
import { cx } from '@/utils/cx'
import type { PendingMessage } from '../hooks/useSendMessages'
import type { ChatMessage } from '../models/chat'
import { formatDayLabel, formatMessageTime, isSameDay } from '../utils/chatFormat'
import { isRetriableSendError } from '../utils/chatValidation'
import { MessageBubble } from './MessageBubble'

/** Mensajes del mismo autor con menos de esto entre sí se agrupan (sin hora en cada uno). */
const GROUP_WINDOW_MS = 5 * 60 * 1000
/** A menos de esto del fondo se considera "abajo del todo" y se sigue el chat. */
const STICK_TO_BOTTOM_PX = 120

type ThreadItem =
  | { kind: 'message'; key: string; own: boolean; createdAt: string; message: ChatMessage }
  | { kind: 'pending'; key: string; own: true; createdAt: string; pending: PendingMessage }

interface MessageThreadProps {
  /** Historial tal como viene del backend: del más nuevo al más viejo. */
  messages: ChatMessage[]
  pending: PendingMessage[]
  currentUserId: string | null
  hasOlder: boolean
  isLoadingOlder: boolean
  onLoadOlder: () => void
  onRetry: (localId: string) => void
  onDiscard: (localId: string) => void
}

/**
 * Hilo de mensajes, del más viejo (arriba) al más nuevo (abajo).
 *
 * - Abre abajo del todo y sigue los mensajes nuevos si ya estabas abajo (o si
 *   el mensaje es tuyo). Si estabas leyendo más arriba, no te mueve: aparece
 *   el botón "Mensajes nuevos".
 * - Al llegar arriba pide los mensajes anteriores (cursor) y conserva la
 *   posición para que no "salte".
 * - Separadores por día y agrupación de mensajes seguidos del mismo autor.
 */
export function MessageThread({
  messages,
  pending,
  currentUserId,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  onRetry,
  onDiscard,
}: MessageThreadProps) {
  const { t, language } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const distanceFromBottom = useRef(0)
  const lastItemKey = useRef<string | null>(null)
  const [hasUnseenBelow, setHasUnseenBelow] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const items = useMemo<ThreadItem[]>(() => {
    const chronological: ThreadItem[] = [...messages].reverse().map((message) => ({
      kind: 'message',
      key: `m-${message.id}`,
      own: message.senderId === currentUserId,
      createdAt: message.createdAt,
      message,
    }))
    const outgoing: ThreadItem[] = pending.map((item) => ({
      kind: 'pending',
      key: item.localId,
      own: true,
      createdAt: item.createdAt,
      pending: item,
    }))
    return [...chronological, ...outgoing]
  }, [messages, pending, currentUserId])

  // El último mensaje propio ya confirmado lleva "Visto" / "Enviado" (si no hay pendientes después).
  const receiptKey = useMemo(() => {
    const last = items[items.length - 1]
    if (!last || last.kind !== 'message' || !last.own) return null
    return last.key
  }, [items])

  // Índices de `items` agrupados por día calendario, en orden.
  const days = useMemo(() => {
    const groups: { key: string; firstAt: string; indexes: number[] }[] = []
    items.forEach((item, index) => {
      const current = groups[groups.length - 1]
      if (current && isSameDay(new Date(current.firstAt), new Date(item.createdAt))) current.indexes.push(index)
      else groups.push({ key: item.key, firstAt: item.createdAt, indexes: [index] })
    })
    return groups
  }, [items])

  function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    setHasUnseenBelow(false)
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    distanceFromBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom.current < STICK_TO_BOTTOM_PX) setHasUnseenBelow(false)
  }

  // Posición del scroll después de cada cambio de la lista.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const last = items[items.length - 1]
    const lastKey = last?.key ?? null
    const isFirstRender = lastItemKey.current === null
    const newAtBottom = lastKey !== lastItemKey.current
    lastItemKey.current = lastKey

    if (isFirstRender || (newAtBottom && (last?.own || distanceFromBottom.current < STICK_TO_BOTTOM_PX))) {
      el.scrollTop = el.scrollHeight
      distanceFromBottom.current = 0
      return
    }
    // Llegaron mensajes viejos arriba (o algo cambió de alto): mantener la distancia al fondo.
    el.scrollTop = el.scrollHeight - el.clientHeight - distanceFromBottom.current
    if (newAtBottom) setHasUnseenBelow(true)
  }, [items])

  // Si el hilo cambia de alto (aparece el aviso de conexión, el teclado en móvil, se
  // redimensiona la ventana) y estabas abajo del todo, seguir abajo.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      if (distanceFromBottom.current < STICK_TO_BOTTOM_PX) el.scrollTop = el.scrollHeight
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Cargar mensajes anteriores al ver el tope del hilo.
  useEffect(() => {
    const root = scrollRef.current
    const sentinel = topSentinelRef.current
    if (!root || !sentinel || !hasOlder) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingOlder) onLoadOlder()
      },
      { root, rootMargin: '200px 0px 0px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasOlder, isLoadingOlder, onLoadOlder])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label={t('chat.thread.label')}
        aria-live="polite"
        aria-relevant="additions"
        className="h-full overflow-y-auto overscroll-contain bg-mynted-bg px-3 py-4 [scrollbar-width:thin] sm:px-5"
      >
        <div ref={topSentinelRef} aria-hidden="true" />

        {hasOlder ? (
          <p className="flex items-center justify-center gap-2 py-2 text-xs text-mynted-gray">
            {isLoadingOlder && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {isLoadingOlder ? t('chat.thread.loadingOlder') : null}
          </p>
        ) : items.length > 0 ? (
          <p className="py-2 text-center text-xs text-mynted-gray-light">{t('chat.thread.start')}</p>
        ) : null}

        {items.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-mynted-blue ring-1 ring-mynted-border">
              <MessageCircle className="size-6" aria-hidden="true" />
            </span>
            <p className="font-heading text-base font-semibold text-mynted-ink">{t('chat.thread.empty.title')}</p>
            <p className="max-w-xs text-sm text-mynted-gray">{t('chat.thread.empty.description')}</p>
          </div>
        )}

        {days.map((day) => (
          // Cada día es su propia sección: así el separador queda pegado arriba solo mientras se ve ese día.
          <section key={day.key} aria-label={formatDayLabel(day.firstAt, language, t)}>
            <div className="sticky top-0 z-10 flex justify-center py-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-mynted-gray shadow-[0_1px_4px_rgba(13,13,20,0.08)] ring-1 ring-mynted-border">
                {formatDayLabel(day.firstAt, language, t)}
              </span>
            </div>
            <ol className="flex flex-col">
              {day.indexes.map((index) => {
                const item = items[index]
                const next = items[index + 1]
                const date = new Date(item.createdAt)
                const sameAuthorAsNext =
                  next !== undefined &&
                  next.own === item.own &&
                  isSameDay(new Date(next.createdAt), date) &&
                  new Date(next.createdAt).getTime() - date.getTime() < GROUP_WINDOW_MS
                const isLastInGroup = !sameAuthorAsNext

                return (
                  <li key={item.key} className={cx(isLastInGroup ? 'mb-3' : 'mb-1')}>
                    {item.kind === 'message' ? (
                      <MessageBubble
                        own={item.own}
                        type={item.message.type}
                        content={item.message.content}
                        imageUrl={item.message.imageUrl}
                        isLastInGroup={isLastInGroup}
                        onOpenImage={setPreview}
                        footer={
                          isLastInGroup || item.key === receiptKey ? (
                            <>
                              <time dateTime={item.createdAt}>{formatMessageTime(item.createdAt, language)}</time>
                              {item.key === receiptKey && (
                                <span className={cx(item.message.readAt && 'font-medium text-mynted-blue')}>
                                  {item.message.readAt ? t('chat.message.seen') : t('chat.message.sent')}
                                </span>
                              )}
                            </>
                          ) : null
                        }
                      />
                    ) : (
                      <PendingBubble item={item.pending} isLastInGroup={isLastInGroup} onRetry={onRetry} onDiscard={onDiscard} />
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>

      {hasUnseenBelow && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-mynted-ink px-3.5 py-2 text-xs font-semibold text-white shadow-lg outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mynted-blue-mid"
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
          {t('chat.thread.newMessages')}
        </button>
      )}

      <ImagePreviewDialog
        src={preview}
        alt={t('chat.message.image')}
        title={t('chat.message.image')}
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}

function PendingBubble({
  item,
  isLastInGroup,
  onRetry,
  onDiscard,
}: {
  item: PendingMessage
  isLastInGroup: boolean
  onRetry: (localId: string) => void
  onDiscard: (localId: string) => void
}) {
  const { t } = useLanguage()
  const failed = item.status === 'failed' && item.error !== null
  const linkClass =
    'cursor-pointer rounded font-semibold outline-none hover:underline focus-visible:outline-2 focus-visible:outline-mynted-blue-mid'

  return (
    <MessageBubble
      own
      type={item.type}
      content={item.content}
      imageUrl={item.previewUrl}
      isLastInGroup={isLastInGroup}
      isSending={item.status === 'sending'}
      isFailed={failed}
      footer={
        failed && item.error ? (
          <span role="alert" className="flex flex-wrap items-center justify-end gap-x-2 text-[#c62a2f]">
            {t(`chat.message.failed.${item.error}`)}
            {isRetriableSendError(item.error) && (
              <button type="button" onClick={() => onRetry(item.localId)} className={cx(linkClass, 'text-mynted-blue')}>
                {t('chat.message.retry')}
              </button>
            )}
            <button type="button" onClick={() => onDiscard(item.localId)} className={cx(linkClass, 'text-mynted-gray')}>
              {t('chat.message.discard')}
            </button>
          </span>
        ) : (
          <span>{t('chat.message.sending')}</span>
        )
      }
    />
  )
}
